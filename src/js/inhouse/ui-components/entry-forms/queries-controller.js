function QueriesController(gFileCustomModel, gMetadataModel, gFileModel)
{
	// //////// private members
	var googleDriveUtils = require('../../utils/google-drive-utils.js');
	var DefaultValueConstants = require('../../constants/default-value-constants.js');
	var gFileCustomModel = gFileCustomModel;
	var gMetadataModel = gMetadataModel;
	var gFileModel = gFileModel;

	// //////// public members
	this.addQueriesUpdateListener = function(listener)
	{
		gFileCustomModel.queries.addEventListener(gapi.drive.realtime.EventType.VALUES_ADDED, listener);
		gFileCustomModel.queries.addEventListener(gapi.drive.realtime.EventType.VALUES_REMOVED, listener);
		gFileCustomModel.queries.addEventListener(gapi.drive.realtime.EventType.VALUES_SET, listener);
	}

	this.getQueries = function()
	{
		return gFileCustomModel.queries.asArray();
	}

	this.createNewQuery = function()
	{
		var requestId = googleDriveUtils.setAndGetNextMetadataModelId(gMetadataModel);
		var responseId = googleDriveUtils.setAndGetNextMetadataModelId(gMetadataModel);
		var newQuery = {
			requestId: requestId,
			responseId: responseId,
			id: requestId,
			name: DefaultValueConstants.DefaultQueryAttributes.QUERY_NAME,
			description: DefaultValueConstants.DefaultQueryAttributes.QUERY_DESCRIPTION
		}
		gFileCustomModel.queries.push(newQuery);
	}

	this.deleteQuery = function(queryId)
	{
		for (var i = 0, len = gFileCustomModel.queries.length; i<len; i++) {
			if ('' + gFileCustomModel.queries.get(i).id === '' + queryId) {
				gFileCustomModel.queries.remove(i);
				break;
			}
		}
	}

	this.updateQuery = function(queryId, name, description)
	{
		gFileModel.beginCompoundOperation();
		for (var i = 0, len = gFileCustomModel.queries.length; i<len; i++) {
			if (parseInt(gFileCustomModel.queries.get(i).id, 10) === queryId) {
				var newQuery = {
					requestId: queryId,
					responseId: queryId + 1,
					id: queryId,
					name: name,
					description: description
				};
				gFileCustomModel.queries.set(i, newQuery);
				break;
			}
		}
		gFileModel.endCompoundOperation();
	}

	this.dispose = function()
	{
		
	}
}

module.exports = QueriesController;