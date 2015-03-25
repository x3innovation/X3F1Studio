module.exports = {
	AppId : 'serene-vim-452',
	ClientId : '924032194879-rvf4u88b7tg9fimtha2fg1gbunpm964r.apps.googleusercontent.com',
	InstallScope : 'https://www.googleapis.com/auth/drive.install',
	FileScope : 'https://www.googleapis.com/auth/drive',
	OpenIdScope : 'openid',
	
	MimeType : {
		DMX : 'application/dmx',
		FMX : 'application/fmx',
		PROJECT : 'application/f1.project',
		FOLDER : 'application/vnd.google-apps.folder'
	},	

	ObjectType : {
		PERSISTENT_DATA : 'f1-objectType-persistentData',
		ENUM : 'f1-objectType-enum',
		EVENT : 'f1-objectType-event',
		FLOW : 'f1-objectType-flow',
		PROJECT_METADATA : 'f1-objectType-projectMetadata'
	},

	CustomObjectKey : {
		PERSISTENT_DATA : 'persistent-data-custom-object',
		ENUM : 'enum-data-custom-object',
		EVENT : 'event-data-custom-object',
		FLOW : 'flow-data-custom-object'
	}
}