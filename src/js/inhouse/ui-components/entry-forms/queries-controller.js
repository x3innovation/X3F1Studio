function QueriesController(gFileCustomModel, gMetadataCustomObject, projectFolderFileId, gFileModel )
{
	// //////// private members
	var googleDriveUtils = require('../../utils/google-drive-utils.js');
	var DefaultValueConstants = require('../../constants/default-value-constants.js');
	var GDriveConstants = require('../../constants/google-drive-constants.js');
	var gFileCustomModel = gFileCustomModel;
	var gMetadataCustomObject = gMetadataCustomObject;
	var gFileModel = gFileModel;
	var pFolderId = projectFolderFileId;

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

	this.loadProjectObjects = function(callback)
	{
		var objectsToGet = { 
			persistentData: true,
			snippet: true
		};

		googleDriveUtils.getProjectObjects(pFolderId, '', objectsToGet, onProjectObjectsLoaded);

		function onProjectObjectsLoaded(projectObjects)
		{
			var snippets = [];
			var pds = [];
			var projectObject;
			for (var i = 0, len = projectObjects.length; i<len; i++) {
				projectObject = {
					id: projectObjects[i].id,
					title: projectObjects[i].title,
					fileType: projectObjects[i].description 
				};
				
				switch (projectObjects[i].description) {
					case GDriveConstants.ObjectType.PERSISTENT_DATA:
						if(gFileCustomModel.title.text === projectObjects[i].title)
							pds.push(projectObject);
						break;
					case GDriveConstants.ObjectType.SNIPPET:
						snippets.push(projectObject);
						break;
					case GDriveConstants.ObjectType.EVENT:
					case GDriveConstants.ObjectType.ENUM:
					default: break;
				}
			}

			callback(snippets, pds);
		}
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
			isBusinessRequest: false, 
			retType: null
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

	this.updateQuery = function(queryId, name, description, retType)
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
					description: description, 
					returnType: retType
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