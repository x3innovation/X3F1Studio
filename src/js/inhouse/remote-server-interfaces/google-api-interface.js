var GDriveConstant = require('../constants/google-drive-constants.js');

function GoogleApiInterface()
{
	// //////// private members
	var shareClient;
	var user;

	var that = this;
	function registerCustomDataTypes()
	{
		registerLegacyDMXDataModel();
		registerLegacyDMXEDataModel();
		registerLegacyFMXDataModel();

		that.ProjectMetadataModel = registerProjectMetadataModel();
		that.PersistentDataModel = registerPersistentDataModel();
		that.EventModel = registerEventDataModel();
		that.SnippetModel = registerSnippetDataModel();
		that.EnumModel = registerEnumDataModel();
		that.FlowModel = registerFlowDataModel();
	}

	function registerProjectMetadataModel() {
		var Cons = GDriveConstant.ProjectMetadata;

		this.model = function(){};
		model.prototype.initialize = function(){
			this.version = 1;
			this.nextId = 0;
		};

		var custom = gapi.drive.realtime.custom;
		custom.registerType(model, GDriveConstant.CustomObjectKey.PROJECT_METADATA);
		model.prototype.version = custom.collaborativeField(Cons.KEY_VERSION);
		model.prototype.nextId = custom.collaborativeField(Cons.KEY_NEXT_ID);
		model.prototype.announcement = custom.collaborativeField(Cons.KEY_ANNOUNCEMENT);
		custom.setInitializer(model, model.prototype.initialize);

		return model;
	}

	function registerPersistentDataModel()
	{
		var Cons = GDriveConstant.PersistentData;

		this.model = function(){};
		model.prototype.initialize = function(){};

		var custom = gapi.drive.realtime.custom;
		custom.registerType(model, GDriveConstant.CustomObjectKey.PERSISTENT_DATA);
		model.prototype.introducedVersion = custom.collaborativeField(Cons.KEY_INTRODUCED_VERSION);
		model.prototype.deprecatedVersion = custom.collaborativeField(Cons.KEY_DEPRECATED_VERSION);
		model.prototype.id = custom.collaborativeField(Cons.KEY_ID);
		model.prototype.title = custom.collaborativeField(Cons.KEY_TITLE);
		model.prototype.description = custom.collaborativeField(Cons.KEY_DESCRIPTION);
		model.prototype.fields = custom.collaborativeField(Cons.KEY_FIELDS);
		model.prototype.queries = custom.collaborativeField(Cons.KEY_QUERIES);
		model.prototype.appStateId = custom.collaborativeField(Cons.KEY_APP_STATE_ID);
		model.prototype.UpdatePersistenceEventTypeId = custom.collaborativeField(Cons.KEY_UPDATE_PD_EVENT_TYPE_ID);
		model.prototype.CreatePersistenceEventTypeId = custom.collaborativeField(Cons.KEY_CREATE_PD_EVENT_TYPE_ID);
		model.prototype.RemovePersistenceEventTypeId = custom.collaborativeField(Cons.KEY_REMOVE_PD_EVENT_TYPE_ID);
		model.prototype.UpdatedPersistenceEventTypeId = custom.collaborativeField(Cons.KEY_UPDATED_PD_EVENT_TYPE_ID);
		model.prototype.CreatedPersistenceEventTypeId = custom.collaborativeField(Cons.KEY_CREATED_PD_EVENT_TYPE_ID);
		model.prototype.RemovedPersistenceEventTypeId = custom.collaborativeField(Cons.KEY_REMOVED_PD_EVENT_TYPE_ID);
		model.prototype.RejectUpdatePersistenceEventTypeId = custom.collaborativeField(Cons.KEY_REJECT_UPDATE_PD_EVENT_TYPE_ID);
		model.prototype.RejectCreatePersistenceEventTypeId = custom.collaborativeField(Cons.KEY_REJECT_CREATE_PD_EVENT_TYPE_ID);
		model.prototype.RejectRemovePersistenceEventTypeId = custom.collaborativeField(Cons.KEY_REJECT_REMOVE_PD_EVENT_TYPE_ID);
		model.prototype.RejectedUpdatePersistenceEventTypeId = custom.collaborativeField(Cons.KEY_REJECTED_UPDATE_PD_EVENT_TYPE_ID);
		model.prototype.RejectedCreatePersistenceEventTypeId = custom.collaborativeField(Cons.KEY_REJECTED_CREATE_PD_EVENT_TYPE_ID);
		model.prototype.RejectedRemovePersistenceEventTypeId = custom.collaborativeField(Cons.KEY_REJECTED_REMOVE_PD_EVENT_TYPE_ID);
		custom.setInitializer(model, model.prototype.initialize);

		return model;
	}

	function registerEventDataModel()
	{
		var Cons = GDriveConstant.Event;

		var model = function(){};
		model.prototype.initialize = function(){};

		var custom = gapi.drive.realtime.custom;
		custom.registerType(model, GDriveConstant.CustomObjectKey.EVENT);
		model.prototype.introducedVersion = custom.collaborativeField(Cons.KEY_INTRODUCED_VERSION);
		model.prototype.deprecatedVersion = custom.collaborativeField(Cons.KEY_DEPRECATED_VERSION);
		model.prototype.id = custom.collaborativeField(Cons.KEY_ID);
		model.prototype.title = custom.collaborativeField(Cons.KEY_TITLE);
		model.prototype.description = custom.collaborativeField(Cons.KEY_DESCRIPTION);
		model.prototype.fields = custom.collaborativeField(Cons.KEY_FIELDS);
		model.prototype.queries = custom.collaborativeField(Cons.KEY_QUERIES);
		model.prototype.appStateId = custom.collaborativeField(Cons.KEY_APP_STATE_ID);
		custom.setInitializer(model, model.prototype.initialize);

		return model;
	}

	function registerSnippetDataModel()
	{
		var Cons = GDriveConstant.Snippet;

		var model = function(){};
		model.prototype.initialize = function(){};

		var custom = gapi.drive.realtime.custom;
		custom.registerType(model, GDriveConstant.CustomObjectKey.SNIPPET);
		model.prototype.introducedVersion = custom.collaborativeField(Cons.KEY_INTRODUCED_VERSION);
		model.prototype.deprecatedVersion = custom.collaborativeField(Cons.KEY_DEPRECATED_VERSION);
		model.prototype.id = custom.collaborativeField(Cons.KEY_ID);
		model.prototype.title = custom.collaborativeField(Cons.KEY_TITLE);
		model.prototype.description = custom.collaborativeField(Cons.KEY_DESCRIPTION);
		model.prototype.fields = custom.collaborativeField(Cons.KEY_FIELDS);
		model.prototype.appStateId = custom.collaborativeField(Cons.KEY_APP_STATE_ID);
		custom.setInitializer(model, model.prototype.initialize);

		return model;
	}

	function registerEnumDataModel()
	{
		var Cons = GDriveConstant.Enum;

		var model = function(){};
		model.prototype.initialize = function(){};

		var custom = gapi.drive.realtime.custom;
		custom.registerType(model, GDriveConstant.CustomObjectKey.ENUM);
		model.prototype.introducedVersion = custom.collaborativeField(Cons.KEY_INTRODUCED_VERSION);
		model.prototype.deprecatedVersion = custom.collaborativeField(Cons.KEY_DEPRECATED_VERSION);
		model.prototype.id = custom.collaborativeField(Cons.KEY_ID);
		model.prototype.title = custom.collaborativeField(Cons.KEY_TITLE);
		model.prototype.description = custom.collaborativeField(Cons.KEY_DESCRIPTION);
		model.prototype.fields = custom.collaborativeField(Cons.KEY_FIELDS);
		custom.setInitializer(model, model.prototype.initialize);

		return model;
	}

	function registerFlowDataModel()
	{
		var Cons = GDriveConstant.Flow;

		var model = function(){};
		model.prototype.initialize = function(){};

		var custom = gapi.drive.realtime.custom;
		custom.registerType(model, GDriveConstant.CustomObjectKey.FLOW);
		model.prototype.introducedVersion = custom.collaborativeField(Cons.KEY_INTRODUCED_VERSION);
		model.prototype.deprecatedVersion = custom.collaborativeField(Cons.KEY_DEPRECATED_VERSION);
		model.prototype.id = custom.collaborativeField(Cons.KEY_ID);
		model.prototype.title = custom.collaborativeField(Cons.KEY_TITLE);
		model.prototype.description = custom.collaborativeField(Cons.KEY_DESCRIPTION);
		model.prototype.tasks = custom.collaborativeField(Cons.KEY_TASKS);
		model.prototype.startTriggerNodes = custom.collaborativeField(Cons.KEY_START_TRIGGER_NODES);
		model.prototype.flows = custom.collaborativeField(Cons.KEY_FLOWS);
		model.prototype.eventFlows = custom.collaborativeField(Cons.KEY_EVENT_FLOWS);
		model.prototype.engineFlows = custom.collaborativeField(Cons.KEY_ENGINE_FLOWS);
		custom.setInitializer(model, model.prototype.initialize);

		return model;
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
	this.userAuthorize = function(immediate, successCallback, failCallback)
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
				immediate: immediate
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
	};

	this.getProjects = function(callback)
	{
		var request = gapi.client.drive.files.list({
			corpus : 'DEFAULT',
			q : 'mimeType="' + GDriveConstant.MimeType.PROJECT + '" and trashed = false',
			fields : 'items(id,parents/id,title)'
		});

		request.execute(function(response){
			callback(response.items);
		});
	};

	this.getProjectById = function(projectId, callback)
	{
		var request = gapi.client.drive.files.get({
			'fileId': projectId
		});

		request.execute(function(project){
			callback(project);
		});
	};

	this.saveTitle = function(fileId, title)
	{
		var saveTitleRequest = gapi.client.drive.files.patch({
			'fileId' : fileId,
			'resource' : {
				'title' : title
			}
		});

		saveTitleRequest.execute();
	};

	this.setMimeType = function(fileId, mimeType)
	{
		var saveTitleRequest = gapi.client.drive.files.patch({
			'fileId' : fileId,
			'resource' : {
				'mimeType' : mimeType
			}
		});

		saveTitleRequest.execute();
	};

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
	};

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
	};

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
	};

	this.createNewFolder = function(folderCreationParams, callback) {
		var request = gapi.client.drive.files.insert({
			title: folderCreationParams.title,
			mimeType: folderCreationParams.mimeType,
		});
		
		request.execute(function(folder) {
			callback(folder);
		});
	};

	this.createNewFile = function(fileCreationParams, callback) {
		var parentId = {
			'id' : fileCreationParams.parentId
		};

		var request = gapi.client.drive.files.insert({
			title: fileCreationParams.title,
			description: fileCreationParams.description,
			mimeType: fileCreationParams.mimeType,
			parents: [parentId]	// google forces us to pass an array here
		});
		
		request.execute(function(file){
			callback(file);
		});
	};

}

module.exports = new GoogleApiInterface();