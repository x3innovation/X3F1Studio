var GDriveConstant = require('../constants/google-drive-constants.js');

function GoogleApiInterface()
{
	// //////// private members
	var shareClient;
	var user;

	function registerCustomDataTypes()
	{
		registerLegacyDMXDataModel();
		registerLegacyDMXEDataModel();
		registerLegacyFMXDataModel();

		registerPersistentDataModel();
		registerEventDataModel();
		registerEnumDataModel();
		registerFlowDataModel();
	}

	function registerPersistentDataModel()
	{
		var model = function(){};
		model.prototype.initialize = function(){};

		var custom = gapi.drive.realtime.custom;
		custom.registerType(model, GDriveConstant.CustomObjectKey.PERSISTENT_DATA);
		model.prototype.introducedVersion = custom.collaborativeField('introducedVersion');
		model.prototype.deprecatedVersion = custom.collaborativeField('deprecatedVersion');
	    model.prototype.id = custom.collaborativeField('id');
	    model.prototype.title = custom.collaborativeField('title');
	    model.prototype.description = custom.collaborativeField('description');
	    model.prototype.fields = custom.collaborativeField('fields');
	    model.prototype.queries = custom.collaborativeField('queries');
	    model.prototype.appStateId = custom.collaborativeField('appStateId');
	    model.prototype.UpdatePersistenceEventTypeId = custom.collaborativeField('UpdatePersistenceEventTypeId');
	    model.prototype.CreatePersistenceEventTypeId = custom.collaborativeField('CreatePersistenceEventTypeId');
	    model.prototype.RemovePersistenceEventTypeId = custom.collaborativeField('RemovePersistenceEventTypeId');
	    model.prototype.UpdatedPersistenceEventTypeId = custom.collaborativeField('UpdatedPersistenceEventTypeId');
	    model.prototype.CreatedPersistenceEventTypeId = custom.collaborativeField('CreatedPersistenceEventTypeId');
	    model.prototype.RemovedPersistenceEventTypeId = custom.collaborativeField('RemovedPersistenceEventTypeId');
	    model.prototype.RejectUpdatePersistenceEventTypeId = custom.collaborativeField('RejectUpdatePersistenceEventTypeId');
	    model.prototype.RejectCreatePersistenceEventTypeId = custom.collaborativeField('RejectCreatePersistenceEventTypeId');
	    model.prototype.RejectRemovePersistenceEventTypeId = custom.collaborativeField('RejectRemovePersistenceEventTypeId');
	    model.prototype.RejectedUpdatePersistenceEventTypeId = custom.collaborativeField('RejectedUpdatePersistenceEventTypeId');
	    model.prototype.RejectedCreatePersistenceEventTypeId = custom.collaborativeField('RejectedCreatePersistenceEventTypeId');
	    model.prototype.RejectedRemovePersistenceEventTypeId = custom.collaborativeField('RejectedRemovePersistenceEventTypeId');
	    custom.setInitializer(model, model.prototype.initialize);
	}

	function registerEventDataModel()
	{
		var model = function(){};
		model.prototype.initialize = function(){};

		var custom = gapi.drive.realtime.custom;
		custom.registerType(model, GDriveConstant.CustomObjectKey.EVENT);
		model.prototype.introducedVersion = custom.collaborativeField('introducedVersion');
		model.prototype.deprecatedVersion = custom.collaborativeField('deprecatedVersion');
	    model.prototype.id = custom.collaborativeField('id');
	    model.prototype.title = custom.collaborativeField('title');
	    model.prototype.description = custom.collaborativeField('description');
	    model.prototype.fields = custom.collaborativeField('fields');
	    model.prototype.queries = custom.collaborativeField('queries');
	    model.prototype.appStateId = custom.collaborativeField('appStateId');
	    custom.setInitializer(model, model.prototype.initialize);
	}

	function registerEnumDataModel()
	{
		var model = function(){};
		model.prototype.initialize = function(){};

		var custom = gapi.drive.realtime.custom;
	    custom.registerType(model, GDriveConstant.CustomObjectKey.ENUM);
	    model.prototype.introducedVersion = custom.collaborativeField('introducedVersion');
		model.prototype.deprecatedVersion = custom.collaborativeField('deprecatedVersion');
	    model.prototype.id = custom.collaborativeField('id');
	    model.prototype.title = custom.collaborativeField('title');
	    model.prototype.description = custom.collaborativeField('description');
	    model.prototype.fields = custom.collaborativeField('fields');
	    custom.setInitializer(model, model.prototype.initialize);
	}

	function registerFlowDataModel()
	{
		var model = function(){};
		model.prototype.initialize = function(){};

		var custom = gapi.drive.realtime.custom;
	    custom.registerType(model, GDriveConstant.CustomObjectKey.FLOW);
	    model.prototype.introducedVersion = custom.collaborativeField('introducedVersion');
		model.prototype.deprecatedVersion = custom.collaborativeField('deprecatedVersion');
	    model.prototype.id = custom.collaborativeField('id');
	    model.prototype.title = custom.collaborativeField('title');
	    model.prototype.description = custom.collaborativeField('description');
	    model.prototype.tasks = custom.collaborativeField('tasks');
	    model.prototype.startTriggerNodes = custom.collaborativeField('startTriggerNodes');
	    model.prototype.flows = custom.collaborativeField('flows');
	    model.prototype.eventFlows = custom.collaborativeField('eventFlows');
	    model.prototype.engineFlows = custom.collaborativeField('engineFlows');
	    custom.setInitializer(model, model.prototype.initialize);
	}

	function registerLegacyDMXDataModel()
	{
		var model = function(){};
		model.prototype.initialize = function(){};

		var custom = gapi.drive.realtime.custom;
		custom.registerType(model, 'data');
		model.prototype.version = custom.collaborativeField('version');
	    model.prototype.id = custom.collaborativeField('id');
	    model.prototype.name = custom.collaborativeField('name');
	    model.prototype.type = custom.collaborativeField('type');
	    model.prototype.description = custom.collaborativeField('description');
	    model.prototype.attributes = custom.collaborativeField('attributes');
	    model.prototype.queries = custom.collaborativeField('queries');
	    model.prototype.appStateId = custom.collaborativeField('appStateId');
	    model.prototype.comments = custom.collaborativeField('comments');
	    model.prototype.UpdatePersistenceEventTypeId = custom.collaborativeField('UpdatePersistenceEventTypeId');
	    model.prototype.CreatePersistenceEventTypeId = custom.collaborativeField('CreatePersistenceEventTypeId');
	    model.prototype.RemovePersistenceEventTypeId = custom.collaborativeField('RemovePersistenceEventTypeId');
	    model.prototype.UpdatedPersistenceEventTypeId = custom.collaborativeField('UpdatedPersistenceEventTypeId');
	    model.prototype.CreatedPersistenceEventTypeId = custom.collaborativeField('CreatedPersistenceEventTypeId');
	    model.prototype.RemovedPersistenceEventTypeId = custom.collaborativeField('RemovedPersistenceEventTypeId');
	    model.prototype.RejectUpdatePersistenceEventTypeId = custom.collaborativeField('RejectUpdatePersistenceEventTypeId');
	    model.prototype.RejectCreatePersistenceEventTypeId = custom.collaborativeField('RejectCreatePersistenceEventTypeId');
	    model.prototype.RejectRemovePersistenceEventTypeId = custom.collaborativeField('RejectRemovePersistenceEventTypeId');
	    model.prototype.RejectedUpdatePersistenceEventTypeId = custom.collaborativeField('RejectedUpdatePersistenceEventTypeId');
	    model.prototype.RejectedCreatePersistenceEventTypeId = custom.collaborativeField('RejectedCreatePersistenceEventTypeId');
	    model.prototype.RejectedRemovePersistenceEventTypeId = custom.collaborativeField('RejectedRemovePersistenceEventTypeId');
	    custom.setInitializer(model, model.prototype.initialize);
	}

	function registerLegacyDMXEDataModel()
	{
		var model = function(){};
		model.prototype.initialize = function(){};

		var custom = gapi.drive.realtime.custom;
	    custom.registerType(model, 'enum');
	    model.prototype.version = custom.collaborativeField('version');
	    model.prototype.id = custom.collaborativeField('id');
	    model.prototype.name = custom.collaborativeField('name');
	    model.prototype.description = custom.collaborativeField('description');
	    model.prototype.attributes = custom.collaborativeField('attributes');
	    custom.setInitializer(model, model.prototype.initialize);
	}

	function registerLegacyFMXDataModel()
	{
		var model = function(){};
		model.prototype.initialize = function(){};

		var custom = gapi.drive.realtime.custom;
	    custom.registerType(model, 'flow');
	    model.prototype.version = custom.collaborativeField('version');
	    model.prototype.id = custom.collaborativeField('id');
	    model.prototype.name = custom.collaborativeField('name');
	    model.prototype.description = custom.collaborativeField('description');
	    model.prototype.tasks = custom.collaborativeField('tasks');
	    model.prototype.startTriggerNodes = custom.collaborativeField('startTriggerNodes');
	    model.prototype.flows = custom.collaborativeField('flows');
	    model.prototype.eventFlows = custom.collaborativeField('eventFlows');
	    model.prototype.engineFlows = custom.collaborativeField('engineFlows');
	    custom.setInitializer(model, model.prototype.initialize);
	}

	// //////// public members
	this.userAuthorize = function(immeidate, successCallback, failCallback)
	{
		gapi.load('auth:client,drive-realtime,drive-share', function() {
	        console.log("Authorizing user with Google");
	        shareClient = new gapi.drive.share.ShareClient(GDriveConstant.AppId);
	        gapi.auth.authorize({
	            client_id: GDriveConstant.ClientId,
	            scope: [GDriveConstant.InstallScope, 
	            		GDriveConstant.FileScope,
	            		GDriveConstant.OpenIdScope],
	            user_id: user == null ? null : user.id,
	            immediate: immeidate
	        }, authorizationCallback);
	    });

	    // inner functions
	    function authorizationCallback(authResult)
	    {
	    	if (authResult && !authResult.error)
	    	{
	    		// loading Google Drive sdk asynchronously
	    		gapi.client.load('drive', 'v2', function(){
	    			registerCustomDataTypes();
	    			successCallback();
	    		});
	    	}
	    	else
	    	{
	    		failCallback();
	    	}
	    }
	}

	this.getProjects = function(callback)
	{
		var request = gapi.client.drive.files.list({
			corpus : 'DEFAULT',
			q : 'mimeType="' + GDriveConstant.MimeType.PROJECT + '"',
			fields : 'items(id,parents/id,title)'
		});

		request.execute(function(response){
			callback(response.items);
		});
	}

	this.saveTitle = function(fileId, title)
	{
		var saveTitleRequest = gapi.client.drive.files.patch({
            'fileId' : fileId,
            'resource' : {
                'title' : title
            }
        });

        saveTitleRequest.execute();
	}

	this.setMimeType = function(fileId, mimeType)
	{
		var saveTitleRequest = gapi.client.drive.files.patch({
            'fileId' : fileId,
            'resource' : {
                'mimeType' : mimeType
            }
        });

        saveTitleRequest.execute();
	}

	this.getMimeTypeFiles = function(mimeType, callback)
	{
		var request = gapi.client.drive.files.list({
			corpus : 'DEFAULT',
			q : 'mimeType="' + mimeType + '"',
			fields : 'items(id,parents/id,title)'
		});

		request.execute(function(response){
			callback(response.items);
		});
	}

	this.getAllFilesInFolder = function(folderFileId, callback)
	{
		var request = gapi.client.drive.files.list({
			corpus : 'DEFAULT',
			q : '"' + folderFileId + '" in parents',
			fields : 'items(id)'
		});

		request.execute(function(response){
			callback(response.items);
		});
	}

	this.getProjectObjects = function(query, callback)
	{
		// among the files in the project folder, find the one with properties key=type value=PROJECT_METADATA
		var request = gapi.client.drive.files.list({
			corpus : 'DEFAULT',
			q : query,
			fields : 'items(id,description,title,properties)'
		});

		request.execute(function(response){
			callback(response.items);
		});
	}

	this.createNewFile = function(fileData, callback) {
	  	var request = gapi.client.drive.files.insert({
	  		uploadType: 'multipart',
	  		title: fileData.title,
	  		description: fileData.description,
	  		mimeType: fileData.type,
	  		parents: fileData.parents
	  	});
		if (!callback) {
		    callback = function(file) {
		        console.log('File made with ID: '+file.id);
		    };
		}
	  	request.execute(callback);
	}
}

module.exports = new GoogleApiInterface();