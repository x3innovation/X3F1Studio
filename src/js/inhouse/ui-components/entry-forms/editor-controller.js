function EditorController(fileType, projectFileId, objectFileId)
{
	// //////// private members
	var projectFileId = projectFileId;
	var objectFileId = objectFileId;
	var gDriveInterface = require('../../remote-server-interfaces/google-api-interface.js');
	var GDriveConstants = require('../../constants/google-drive-constants.js');
	var DefaultValueConstants = require('../../constants/default-value-constants.js');
	var gDriveUtils = require('../../utils/google-drive-utils.js');
	var gDriverInterface = require('../../remote-server-interfaces/google-api-interface.js');
	var ObjectType = GDriveConstants.ObjectType;
	
	var customObjectKeys = {};
	customObjectKeys[ObjectType.PERSISTENT_DATA] = GDriveConstants.CustomObjectKey.PERSISTENT_DATA;
	customObjectKeys[ObjectType.ENUM] = GDriveConstants.CustomObjectKey.ENUM;
	customObjectKeys[ObjectType.EVENT] = GDriveConstants.CustomObjectKey.EVENT;
	customObjectKeys[ObjectType.SNIPPET] = GDriveConstants.CustomObjectKey.SNIPPET;
	var customObjectKey = customObjectKeys[fileType];

	var PageTitleConstants = DefaultValueConstants.PageTitleValues;
	var pageTitles = {};
	pageTitles[ObjectType.PERSISTENT_DATA] = PageTitleConstants.PERSISTENT_DATA_FORM_PAGE_TITLE;
	pageTitles[ObjectType.ENUM] = PageTitleConstants.ENUM_FORM_PAGE_TITLE;
	pageTitles[ObjectType.EVENT] = PageTitleConstants.EVENT_FORM_PAGE_TITLE;
	pageTitles[ObjectType.SNIPPET] = PageTitleConstants.SNIPPET_FORM_PAGE_TITLE;
	var pageTitle = pageTitles[fileType];

	var gMetadataDoc;
	var gMetadataModel;
	var gDoc;
	var gFileModel;
	var gFileCustomModel;

	function loadMetadataModel(onMetadataLoaded, onInitializeFinished)
	{
		gapi.drive.realtime.load(projectFileId, onMetadataFileLoaded);

		function onMetadataFileLoaded(doc) {
			gMetadataDoc = doc;
	        gMetadataModel = doc.getModel().getRoot().get(GDriveConstants.CustomObjectKey.PROJECT_METADATA);
	        if (gMetadataModel == null) {
	        	initializeMetadataModel(doc.getModel());
	        	onMetadataFileLoaded(doc);
	        }
	        else {
	        	updateMetadataModel(gMetadataModel, doc);//if not properly initialized, update it
	        	onMetadataLoaded(gMetadataModel, onInitializeFinished);
	    	}
	    };

	    function updateMetadataModel(gMetadataModel, doc) {
			if (gMetadataModel.version == null) {
			    gMetadataModel.version = 1;
			}
			if (gMetadataModel.nextId == null) {
			    gMetadataModel.nextId = 10;
			}
			if (gMetadataModel.announcement == null) {
			    gMetadataModel.announcement = doc.getModel().createList();
			}
		};
	}

	function loadDataModel(gMetadataModel, onInitializeFinished)
	{
		gapi.drive.realtime.load(objectFileId, onDataFileLoaded, initializeModel);

		function onDataFileLoaded(doc)
		{
			gDoc = doc;
			gFileModel = doc.getModel();
			gFileCustomModel = gFileModel.getRoot().get(customObjectKey);
			if (!gFileCustomModel.creatingUser) {
				setCreator(gFileCustomModel);
			}
			else
			{
				onInitializeFinished(gMetadataModel, gFileCustomModel, gFileModel);
			}
		};

		function setCreator(gFileCustomModel) {
			gDriverInterface.getFileMetadata(objectFileId, function(respData) {
				gFileCustomModel.createdDate = respData.createdDate;
				gFileCustomModel.creatingUser = {
					name: respData.owners[0].displayName,
					userId: respData.owners[0].permissionId
				};

				onInitializeFinished(gMetadataModel, gFileCustomModel, gFileModel);
			});
		};

		function initializeModel(gFileModel) {
			gFileCustomModel = gFileModel.create(customObjectKey);
			gFileModel.getRoot().set(customObjectKey, gFileCustomModel);

			switch (fileType) {
				case ObjectType.PERSISTENT_DATA:
					gFileCustomModel.title = gFileModel.createString(DefaultValueConstants.NewFileValues.PERSISTENT_DATA_TITLE);
					gFileCustomModel.description = gFileModel.createString(DefaultValueConstants.NewFileValues.PERSISTENT_DATA_DESCRIPTION);
					gFileCustomModel.fields = gFileModel.createList();
					gFileCustomModel.queries = gFileModel.createList();
					gFileCustomModel.id = gDriveUtils.setAndGetNextMetadataModelId(gMetadataModel);
					gFileCustomModel.UpdatePersistenceEventTypeId = gDriveUtils.setAndGetNextMetadataModelId(gMetadataModel);
					gFileCustomModel.CreatePersistenceEventTypeId = gDriveUtils.setAndGetNextMetadataModelId(gMetadataModel);
					gFileCustomModel.RemovePersistenceEventTypeId = gDriveUtils.setAndGetNextMetadataModelId(gMetadataModel);
					gFileCustomModel.UpdatedPersistenceEventTypeId = gDriveUtils.setAndGetNextMetadataModelId(gMetadataModel);
					gFileCustomModel.CreatedPersistenceEventTypeId = gDriveUtils.setAndGetNextMetadataModelId(gMetadataModel);
					gFileCustomModel.RemovedPersistenceEventTypeId = gDriveUtils.setAndGetNextMetadataModelId(gMetadataModel);
					gFileCustomModel.RejectedUpdatePersistenceEventTypeId = gDriveUtils.setAndGetNextMetadataModelId(gMetadataModel);
					gFileCustomModel.RejectedCreatePersistenceEventTypeId = gDriveUtils.setAndGetNextMetadataModelId(gMetadataModel);
					gFileCustomModel.RejectedRemovePersistenceEventTypeId = gDriveUtils.setAndGetNextMetadataModelId(gMetadataModel);
					break;
				case ObjectType.EVENT:
					gFileCustomModel.title = gFileModel.createString(DefaultValueConstants.NewFileValues.EVENT_TITLE);
					gFileCustomModel.description = gFileModel.createString(DefaultValueConstants.NewFileValues.EVENT_DESCRIPTION);
					gFileCustomModel.fields = gFileModel.createList();
					gFileCustomModel.queries = gFileModel.createList();
					gFileCustomModel.id = gDriveUtils.setAndGetNextMetadataModelId(gMetadataModel);
					break;
				case ObjectType.SNIPPET:
					gFileCustomModel.title = gFileModel.createString(DefaultValueConstants.NewFileValues.SNIPPET_TITLE);
					gFileCustomModel.description = gFileModel.createString(DefaultValueConstants.NewFileValues.SNIPPET_DESCRIPTION);
					gFileCustomModel.fields = gFileModel.createList();
					gFileCustomModel.id = gDriveUtils.setAndGetNextMetadataModelId(gMetadataModel);
					break;
				case ObjectType.ENUM:
					gFileCustomModel.title = gFileModel.createString(DefaultValueConstants.NewFileValues.ENUM_TITLE);
					gFileCustomModel.description = gFileModel.createString(DefaultValueConstants.NewFileValues.ENUM_DESCRIPTION);
					gFileCustomModel.fields = gFileModel.createList();
					gFileCustomModel.id = gDriveUtils.setAndGetNextMetadataModelId(gMetadataModel);
					break;
				default: break;
			}
			setCreator(gFileCustomModel);
		};
	}

	// //////// public members
	this.initialize = function(onInitializeFinished)
	{
		loadMetadataModel(loadDataModel, onInitializeFinished);
	}

	this.getPageTitle = function()
	{
		return pageTitle;
	}

	this.dispose = function()
	{
		gMetadataDoc.close();
		gDoc.close();
	}
}

module.exports = EditorController;