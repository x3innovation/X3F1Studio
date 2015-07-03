module.exports = {
	AppId : 'serene-vim-452',
	ClientId : '924032194879-rvf4u88b7tg9fimtha2fg1gbunpm964r.apps.googleusercontent.com',
	InstallScope : 'https://www.googleapis.com/auth/drive.install',
	FileScope : 'https://www.googleapis.com/auth/drive',
	OpenIdScope : 'openid',
	
	MimeType : {
		DMX : 'application/dmx',
		DMXE : 'application/dmxe',
		FMX : 'application/fmx',
		PROJECT : 'application/f1.project',
		FOLDER : 'application/vnd.google-apps.folder'
	},	

	ObjectType : {
		PERSISTENT_DATA : 'f1-objectType-persistentData',
		ENUM : 'f1-objectType-enum',
		SNIPPET : 'f1-objectType-snippet',
		EVENT : 'f1-objectType-event',
		FLOW : 'f1-objectType-flow',
		PROJECT_METADATA : 'f1-objectType-projectMetadata'
	},

	CustomObjectKey : {
		PERSISTENT_DATA : 'persistent-data-custom-object',
		ENUM : 'enum-data-custom-object',
		SNIPPET : 'snippet-data-custom-object',
		EVENT : 'event-data-custom-object',
		FLOW : 'flow-data-custom-object',
		PROJECT_METADATA : 'project-metadata-custom-object'
	},

	Project : {
		KEY_TITLE : 'title',
		KEY_DESCRIPTION : 'description',
	},

	ProjectMetadata : {
		KEY_VERSION : 'version',
		KEY_ANNOUNCEMENT : 'announcement',
		KEY_NEXT_ID : 'nextId'
	},

	PersistentData : {
		KEY_INTRODUCED_VERSION : 'introducedVersion',
		KEY_DEPRECATED_VERSION : 'deprecatedVersion',
		KEY_ID : 'id',
		KEY_TITLE : 'title',
		KEY_DESCRIPTION : 'description',
		KEY_FIELDS : 'fields',
		KEY_QUERIES : 'queries',
		KEY_APP_STATE_ID : 'appStateId',
		KEY_UPDATE_PD_EVENT_TYPE_ID : 'UpdatePersistenceEventTypeId',
		KEY_CREATE_PD_EVENT_TYPE_ID : 'CreatePersistenceEventTypeId',
		KEY_REMOVE_PD_EVENT_TYPE_ID : 'RemovePersistenceEventTypeId',
		KEY_UPDATED_PD_EVENT_TYPE_ID : 'UpdatedPersistenceEventTypeId',
		KEY_CREATED_PD_EVENT_TYPE_ID : 'CreatedPersistenceEventTypeId',
		KEY_REMOVED_PD_EVENT_TYPE_ID : 'RemovedPersistenceEventTypeId',
		KEY_REJECT_UPDATE_PD_EVENT_TYPE_ID : 'RejectUpdatePersistenceEventTypeId',
		KEY_REJECT_CREATE_PD_EVENT_TYPE_ID : 'RejectCreatePersistenceEventTypeId',
		KEY_REJECT_REMOVE_PD_EVENT_TYPE_ID : 'RejectRemovePersistenceEventTypeId',
		KEY_REJECTED_UPDATE_PD_EVENT_TYPE_ID : 'RejectedUpdatePersistenceEventTypeId',
		KEY_REJECTED_CREATE_PD_EVENT_TYPE_ID : 'RejectedCreatePersistenceEventTypeId',
		KEY_REJECTED_REMOVE_PD_EVENT_TYPE_ID : 'RejectedRemovePersistenceEventTypeId'
	},

	Event : {
		KEY_INTRODUCED_VERSION : 'introducedVersion',
		KEY_DEPRECATED_VERSION : 'deprecatedVersion',
		KEY_ID : 'id',
		KEY_TITLE : 'title',
		KEY_DESCRIPTION : 'description',
		KEY_FIELDS : 'fields',
		KEY_QUERIES : 'queries',
		KEY_APP_STATE_ID : 'appStateId'
	},

	Snippet : {
		KEY_INTRODUCED_VERSION : 'introducedVersion',
		KEY_DEPRECATED_VERSION : 'deprecatedVersion',
		KEY_ID : 'id',
		KEY_TITLE : 'title',
		KEY_DESCRIPTION : 'description',
		KEY_FIELDS : 'fields',
		KEY_APP_STATE_ID : 'appStateId'
	},

	Enum : {
		KEY_INTRODUCED_VERSION : 'introducedVersion',
		KEY_DEPRECATED_VERSION : 'deprecatedVersion',
		KEY_ID : 'id',
		KEY_TITLE : 'title',
		KEY_DESCRIPTION : 'description',
		KEY_FIELDS : 'fields'
	},

	Flow : {
		KEY_INTRODUCED_VERSION : 'introducedVersion',
		KEY_DEPRECATED_VERSION : 'deprecatedVersion',
		KEY_ID : 'id',
		KEY_TITLE : 'title',
		KEY_DESCRIPTION : 'description',
		KEY_TASKS : 'tasks',
		KEY_START_TRIGGER_NODES : 'startTriggerNodes',
		KEY_FLOWS : 'flows',
		KEY_EVENT_FLOWS : 'eventFlows',
		KEY_ENGINE_FLOWS : 'engineFlows'
	}
};