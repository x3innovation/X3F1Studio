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
		model.prototype.nextId = custom.collaborativeField(Cons.KEY_NEXT_ID);
		model.prototype.announcement = custom.collaborativeField(Cons.KEY_ANNOUNCEMENT);
		model.prototype.businessRequestEvents = custom.collaborativeField(Cons.KEY_BUSINESS_REQUEST_EVENTS);
		model.prototype.nonBusinessRequestEvents = custom.collaborativeField(Cons.KEY_NON_BUSINESS_REQUEST_EVENTS);
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

	function registerLegacyDMXDataCustomObject()
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

	function registerLegacyDMXEDataCustomObject()
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

	function registerLegacyFMXDataCustomObject()
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
	this.registerCustomDataTypes = function()
	{
		registerLegacyDMXDataCustomObject();
		registerLegacyDMXEDataCustomObject();
		registerLegacyFMXDataCustomObject();

		registerProjectMetadataCustomObject();
		registerPersistentDataCustomObject();
		registerEventDataCustomObject();
		registerSnippetDataCustomObject();
		registerEnumDataCustomObject();
		registerFlowDataCustomObject();
	}
}

module.exports = new GoogleApiInterface();
