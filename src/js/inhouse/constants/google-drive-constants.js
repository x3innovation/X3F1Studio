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
		APPLICATION_STATE : 'f1-objectType-applicationState',
		PROJECT_METADATA : 'f1-objectType-projectMetadata',
		PROJECT : 'f1-objectType-project'
	},

	CustomObjectKey : {
		PERSISTENT_DATA : 'persistent-data-custom-object',
		ENUM : 'enum-data-custom-object',
		SNIPPET : 'snippet-data-custom-object',
		EVENT : 'event-data-custom-object',
		FLOW : 'flow-data-custom-object',
		APPLICATION_STATE : 'application-state-data-custom-object',
		PROJECT : 'project-custom-object',
		PROJECT_METADATA : 'project-metadata-custom-object',
		ProjectMetadata : {
			EVENT_OBJECT : 'project-metadata-event-object'
		}
	},

	Project : {
		KEY_TITLE : 'title',
		KEY_DESCRIPTION : 'description',
	},

	Object : {
		VERSION : 'version'
	},

	ProjectMetadata : {
		KEY_VERSION : 'version',
		KEY_ANNOUNCEMENT : 'announcement',
		KEY_NEXT_ID : 'nextId',
		KEY_BUSINESS_REQUEST_EVENTS : 'businessRequestEvents',
		KEY_NON_BUSINESS_REQUEST_EVENTS : 'nonBusinessRequestEvents',
		KEY_PROJECT_OBJECT_TITLES: 'projectObjectTitles',
		KEY_BUSINESS_RESPONSE_EVENTS : 'businessResponseEvents'
	},

	PersistentData : {
		KEY_INTRODUCED_VERSION : 'introducedVersion',
		KEY_DEPRECATED_VERSION : 'deprecatedVersion',
		KEY_CREATING_USER : 'creatingUser',
		KEY_CREATED_DATE : 'createdDate',
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
		KEY_REJECTED_REMOVE_PD_EVENT_TYPE_ID : 'RejectedRemovePersistenceEventTypeId',
		KEY_IS_UPDATE_BUSINESS_REQUEST : 'isUpdateBusinessRequest',
		KEY_IS_CREATE_BUSINESS_REQUEST : 'isCreateBusinessRequest',
		KEY_IS_REMOVE_BUSINESS_REQUEST : 'isRemoveBusinessRequest'
	},

	Event : {
		KEY_INTRODUCED_VERSION : 'introducedVersion',
		KEY_DEPRECATED_VERSION : 'deprecatedVersion',
		KEY_CREATING_USER : 'creatingUser',
		KEY_CREATED_DATE : 'createdDate',
		KEY_ID : 'id',
		KEY_TITLE : 'title',
		KEY_DESCRIPTION : 'description',
		KEY_FIELDS : 'fields',
		KEY_QUERIES : 'queries',
		KEY_APP_STATE_ID : 'appStateId',
		KEY_IS_BUSINESS_REQUEST : 'isBusinessRequest',
		KEY_CORRESPONDING_BUSINESS_RESPONSES : 'correspondingBusinessResponses'
	},

	Snippet : {
		KEY_INTRODUCED_VERSION : 'introducedVersion',
		KEY_DEPRECATED_VERSION : 'deprecatedVersion',
		KEY_CREATING_USER : 'creatingUser',
		KEY_CREATED_DATE : 'createdDate',
		KEY_ID : 'id',
		KEY_TITLE : 'title',
		KEY_DESCRIPTION : 'description',
		KEY_FIELDS : 'fields',
		KEY_APP_STATE_ID : 'appStateId'
	},

	ApplicationState : {
		KEY_INTRODUCED_VERSION : 'introducedVersion',
		KEY_DEPRECATED_VERSION : 'deprecatedVersion',
		KEY_CREATING_USER : 'creatingUser',
		KEY_CREATED_DATE : 'createdDate',
		KEY_ID : 'id',
		KEY_TITLE : 'title',
		KEY_DESCRIPTION : 'description',
		KEY_FIELDS : 'fields',
		KEY_APP_STATE_ID : 'appStateId'
	},

	Enum : {
		KEY_INTRODUCED_VERSION : 'introducedVersion',
		KEY_DEPRECATED_VERSION : 'deprecatedVersion',
		KEY_CREATING_USER : 'creatingUser',
		KEY_CREATED_DATE : 'createdDate',
		KEY_ID : 'id',
		KEY_TITLE : 'title',
		KEY_DESCRIPTION : 'description',
		KEY_FIELDS : 'fields'
	},

	Flow : {
		KEY_INTRODUCED_VERSION : 'introducedVersion',
		KEY_DEPRECATED_VERSION : 'deprecatedVersion',
		KEY_CREATING_USER : 'creatingUser',
		KEY_CREATED_DATE : 'createdDate',
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