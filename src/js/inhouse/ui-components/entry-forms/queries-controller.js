function QueriesController(gFileCustomModel, gMetadataCustomObject, gFileModel)
{
	// //////// private members
	var googleDriveUtils = require('../../utils/google-drive-utils.js');
	var DefaultValueConstants = require('../../constants/default-value-constants.js');
	var gFileCustomModel = gFileCustomModel;
	var gMetadataCustomObject = gMetadataCustomObject;
	var gFileModel = gFileModel;

	// //////// public members
	this.addQueriesUpdateListener = function(listener)
	{
		queryUpdateListener = listener;
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
		var requestId = googleDriveUtils.getNewTypeId(gMetadataCustomObject);
		var responseId = googleDriveUtils.getNewTypeId(gMetadataCustomObject);
		var newQuery = {
			requestId: requestId,
			responseId: responseId,
			id: requestId,
			name: DefaultValueConstants.DefaultQueryAttributes.QUERY_NAME,
			description: DefaultValueConstants.DefaultQueryAttributes.QUERY_DESCRIPTION,
			isBusinessRequest: false
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
			var query = gFileCustomModel.queries.get(i);
			if (query.id === queryId) {
				// TODO: (temporary)Fix invalid responseId
				var responseQueryId = query.responseId;
				if(query.responseId.length !== 36) {
					responseQueryId = googleDriveUtils.getNewTypeId(gMetadataCustomObject);
				}

				var newQuery = {
					requestId: query.requestId,
					responseId: responseQueryId,
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

	this.setBusinessRequest = function(queryId, isBusinessRequest){
		for (var i=0; i<gFileCustomModel.queries.length; ++i){
			var query = gFileCustomModel.queries.get(i);
			if (query.id == queryId){
				var clone = $.extend({}, query);
				clone.isBusinessRequest = isBusinessRequest;
				gFileCustomModel.queries.set(i, clone);
			}
		}
	}
}

module.exports = QueriesController;