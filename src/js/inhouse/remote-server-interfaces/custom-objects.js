var GDriveConstant = require('../constants/google-drive-constants.js');

function GoogleApiInterface()
{
	// //////// private members
	var shareClient;
	var user;
	var tokenRefreshInterval;

	function registerProjectMetadataCustomObject() {
		var Cons = GDriveConstant.ProjectMetadata;

		var model = function(){};
		model.prototype.initialize = function(){
			this.version = 1;
			this.nextId = 0;
		};

		var custom = gapi.drive.realtime.custom;
		custom.registerType(model, GDriveConstant.CustomObjectKey.PROJECT_METADATA);
		model.prototype.version = custom.collaborativeField(Cons.KEY_VERSION);
		model.prototype.announcement = custom.collaborativeField(Cons.KEY_ANNOUNCEMENT);
		model.prototype.businessRequestEvents = custom.collaborativeField(Cons.KEY_BUSINESS_REQUEST_EVENTS);
		model.prototype.nonBusinessRequestEvents = custom.collaborativeField(Cons.KEY_NON_BUSINESS_REQUEST_EVENTS);
		model.prototype.businessResponseEvents = custom.collaborativeField(Cons.KEY_BUSINESS_RESPONSE_EVENTS);
		model.prototype.projectObjectTitles = custom.collaborativeField(Cons.KEY_PROJECT_OBJECT_TITLES);
		custom.setInitializer(model, model.prototype.initialize);
	}

	function registerPersistentDataCustomObject()
	{
		var Cons = GDriveConstant.PersistentData;

		this.model = function(){};
		model.prototype.initialize = function(){};

		var custom = gapi.drive.realtime.custom;
		custom.registerType(model, GDriveConstant.CustomObjectKey.PERSISTENT_DATA);
		model.prototype.introducedVersion = custom.collaborativeField(Cons.KEY_INTRODUCED_VERSION);
		model.prototype.deprecatedVersion = custom.collaborativeField(Cons.KEY_DEPRECATED_VERSION);
		model.prototype.creatingUser = custom.collaborativeField(Cons.KEY_CREATING_USER);
		model.prototype.createdDate = custom.collaborativeField(Cons.KEY_CREATED_DATE);
		model.prototype.id = custom.collaborativeField(Cons.KEY_ID);
		model.prototype.title = custom.collaborativeField(Cons.KEY_TITLE);
		model.prototype.description = custom.collaborativeField(Cons.KEY_DESCRIPTION);
		model.prototype.fields = custom.collaborativeField(Cons.KEY_FIELDS);
		model.prototype.extends = custom.collaborativeField(Cons.KEY_EXTENDS);
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
		model.prototype.isUpdateBusinessRequest = custom.collaborativeField(Cons.KEY_IS_UPDATE_BUSINESS_REQUEST);
		model.prototype.isCreateBusinessRequest = custom.collaborativeField(Cons.KEY_IS_CREATE_BUSINESS_REQUEST);
		model.prototype.isRemoveBusinessRequest = custom.collaborativeField(Cons.KEY_IS_REMOVE_BUSINESS_REQUEST);
		custom.setInitializer(model, model.prototype.initialize);
	}

	function registerEventDataCustomObject()
	{
		var Cons = GDriveConstant.Event;

		var model = function(){};
		model.prototype.initialize = function(){};

		var custom = gapi.drive.realtime.custom;
		custom.registerType(model, GDriveConstant.CustomObjectKey.EVENT);
		model.prototype.introducedVersion = custom.collaborativeField(Cons.KEY_INTRODUCED_VERSION);
		model.prototype.deprecatedVersion = custom.collaborativeField(Cons.KEY_DEPRECATED_VERSION);
		model.prototype.creatingUser = custom.collaborativeField(Cons.KEY_CREATING_USER);
		model.prototype.createdDate = custom.collaborativeField(Cons.KEY_CREATED_DATE);
		model.prototype.id = custom.collaborativeField(Cons.KEY_ID);
		model.prototype.title = custom.collaborativeField(Cons.KEY_TITLE);
		model.prototype.description = custom.collaborativeField(Cons.KEY_DESCRIPTION);
		model.prototype.fields = custom.collaborativeField(Cons.KEY_FIELDS);
		model.prototype.queries = custom.collaborativeField(Cons.KEY_QUERIES);
		model.prototype.appStateId = custom.collaborativeField(Cons.KEY_APP_STATE_ID);
		model.prototype.isBusinessRequest = custom.collaborativeField(Cons.KEY_IS_BUSINESS_REQUEST);
		model.prototype.correspondingBusinessResponses = custom.collaborativeField(Cons.KEY_CORRESPONDING_BUSINESS_RESPONSES);
		custom.setInitializer(model, model.prototype.initialize);
	}

	function registerSnippetDataCustomObject()
	{
		var Cons = GDriveConstant.Snippet;

		var model = function(){};
		model.prototype.initialize = function(){};

		var custom = gapi.drive.realtime.custom;
		custom.registerType(model, GDriveConstant.CustomObjectKey.SNIPPET);
		model.prototype.introducedVersion = custom.collaborativeField(Cons.KEY_INTRODUCED_VERSION);
		model.prototype.deprecatedVersion = custom.collaborativeField(Cons.KEY_DEPRECATED_VERSION);
		model.prototype.creatingUser = custom.collaborativeField(Cons.KEY_CREATING_USER);
		model.prototype.createdDate = custom.collaborativeField(Cons.KEY_CREATED_DATE);
		model.prototype.id = custom.collaborativeField(Cons.KEY_ID);
		model.prototype.title = custom.collaborativeField(Cons.KEY_TITLE);
		model.prototype.description = custom.collaborativeField(Cons.KEY_DESCRIPTION);
		model.prototype.fields = custom.collaborativeField(Cons.KEY_FIELDS);
		model.prototype.extends = custom.collaborativeField(Cons.KEY_EXTENDS);
		model.prototype.appStateId = custom.collaborativeField(Cons.KEY_APP_STATE_ID);
		custom.setInitializer(model, model.prototype.initialize);
	}


	function registerApplicationStateDataCustomObject()
	{
		var Cons = GDriveConstant.ApplicationState;

		var model = function(){};
		model.prototype.initialize = function(){};

		var custom = gapi.drive.realtime.custom;
		custom.registerType(model, GDriveConstant.CustomObjectKey.APPLICATION_STATE);
		model.prototype.introducedVersion = custom.collaborativeField(Cons.KEY_INTRODUCED_VERSION);
		model.prototype.deprecatedVersion = custom.collaborativeField(Cons.KEY_DEPRECATED_VERSION);
		model.prototype.creatingUser = custom.collaborativeField(Cons.KEY_CREATING_USER);
		model.prototype.createdDate = custom.collaborativeField(Cons.KEY_CREATED_DATE);
		model.prototype.id = custom.collaborativeField(Cons.KEY_ID);
		model.prototype.title = custom.collaborativeField(Cons.KEY_TITLE);
		model.prototype.description = custom.collaborativeField(Cons.KEY_DESCRIPTION);
		model.prototype.fields = custom.collaborativeField(Cons.KEY_FIELDS);
		model.prototype.appStateId = custom.collaborativeField(Cons.KEY_APP_STATE_ID);
		custom.setInitializer(model, model.prototype.initialize);
	}

	function registerEnumDataCustomObject()
	{
		var Cons = GDriveConstant.Enum;

		var model = function(){};
		model.prototype.initialize = function(){};

		var custom = gapi.drive.realtime.custom;
		custom.registerType(model, GDriveConstant.CustomObjectKey.ENUM);
		model.prototype.introducedVersion = custom.collaborativeField(Cons.KEY_INTRODUCED_VERSION);
		model.prototype.deprecatedVersion = custom.collaborativeField(Cons.KEY_DEPRECATED_VERSION);
		model.prototype.creatingUser = custom.collaborativeField(Cons.KEY_CREATING_USER);
		model.prototype.createdDate = custom.collaborativeField(Cons.KEY_CREATED_DATE);
		model.prototype.id = custom.collaborativeField(Cons.KEY_ID);
		model.prototype.title = custom.collaborativeField(Cons.KEY_TITLE);
		model.prototype.description = custom.collaborativeField(Cons.KEY_DESCRIPTION);
		model.prototype.fields = custom.collaborativeField(Cons.KEY_FIELDS);
		custom.setInitializer(model, model.prototype.initialize);
	}

	function registerFlowDataCustomObject()
	{
		var Cons = GDriveConstant.Flow;

		var model = function(){};
		model.prototype.initialize = function(){};

		var custom = gapi.drive.realtime.custom;
		custom.registerType(model, GDriveConstant.CustomObjectKey.FLOW);
		model.prototype.introducedVersion = custom.collaborativeField(Cons.KEY_INTRODUCED_VERSION);
		model.prototype.deprecatedVersion = custom.collaborativeField(Cons.KEY_DEPRECATED_VERSION);
		model.prototype.creatingUser = custom.collaborativeField(Cons.KEY_CREATING_USER);
		model.prototype.createdDate = custom.collaborativeField(Cons.KEY_CREATED_DATE);
		model.prototype.id = custom.collaborativeField(Cons.KEY_ID);
		model.prototype.title = custom.collaborativeField(Cons.KEY_TITLE);
		model.prototype.description = custom.collaborativeField(Cons.KEY_DESCRIPTION);
		model.prototype.tasks = custom.collaborativeField(Cons.KEY_TASKS);
		model.prototype.startTriggerNodes = custom.collaborativeField(Cons.KEY_START_TRIGGER_NODES);
		model.prototype.flows = custom.collaborativeField(Cons.KEY_FLOWS);
		model.prototype.eventFlows = custom.collaborativeField(Cons.KEY_EVENT_FLOWS);
		model.prototype.engineFlows = custom.collaborativeField(Cons.KEY_ENGINE_FLOWS);
		custom.setInitializer(model, model.prototype.initialize);
	}

	function registerProjectCustomObject(){
		var Cons = GDriveConstant.Project;

		var model = function(){};
		model.prototype.initialize = function(){};

		var custom = gapi.drive.realtime.custom;
		custom.registerType(model, GDriveConstant.CustomObjectKey.PROJECT);
		model.prototype.title = custom.collaborativeField(Cons.KEY_TITLE);
		model.prototype.description = custom.collaborativeField(Cons.KEY_DESCRIPTION);
		custom.setInitializer(model, model.prototype.initialize);
	}

	// //////// public members
	this.registerCustomDataTypes = function()
	{
		registerProjectMetadataCustomObject();
		registerPersistentDataCustomObject();
		registerEventDataCustomObject();
		registerSnippetDataCustomObject();
		registerApplicationStateDataCustomObject();
		registerEnumDataCustomObject();
		registerFlowDataCustomObject();
		registerProjectCustomObject();
	}
}

module.exports = new GoogleApiInterface();
