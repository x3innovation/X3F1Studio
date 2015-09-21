function EditorController(fileType, projectFileId, objectFileId)
{
	// //////// private members
	var projectFileId = projectFileId;
	var objectFileId = objectFileId;
	var gDriveInterface = require('../../remote-server-interfaces/google-api-interface.js');
	var GDriveConstants = require('../../constants/google-drive-constants.js');
	var DefaultValueConstants = require('../../constants/default-value-constants.js');
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
	var gModel;

	function loadMetadataModel(onMetadataLoaded, onInitializeFinished)
	{
		gapi.drive.realtime.load(projectFileId, onMetadataFileLoaded, initializeMetadataModel);

		function initializeMetadataModel(model) {
	        var field = model.create(GCons.CustomObjectKey.PROJECT_METADATA);
	        field.announcement = model.createList();
	        field.nextId = 0;
	        field.version = 1;
	        model.getRoot().set(GDriveConstants.CustomObjectKey.PROJECT_METADATA, field);
	    };

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
			gModel = doc.getModel().getRoot().get(customObjectKey);
			if (!gModel.creatingUser) {
				this.setCreator(gModel, callback);
			}

			onInitializeFinished(gMetadataModel, gModel);
		};

		function setCreator(gModel) {
			gDriverInterface.getFileMetadata(objectFileId, function(respData) {
				gModel.createdDate = respData.createdDate;
				gModel.creatingUser = {
					name: respData.owners[0].displayName,
					userId: respData.owners[0].permissionId
				};
			});
		};

		function initializeModel(model) {
			gModel = model.create(customObjectKey);
			gModel.getRoot().set(customObjectKey, model);

			switch (fileType) {
				case ObjectType.PERSISTENT_DATA:
					gModel.title = model.createString(DefaultValueConstants.NewFileValues.PERSISTENT_DATA_TITLE);
					gModel.description = model.createString(DefaultValueConstants.NewFileValues.PERSISTENT_DATA_DESCRIPTION);
					gModel.fields = model.createList();
					gModel.queries = model.createList();
					gModel.id = setAndGetNextMetadataModelId();
					gModel.UpdatePersistenceEventTypeId = setAndGetNextMetadataModelId();
					gModel.CreatePersistenceEventTypeId = setAndGetNextMetadataModelId();
					gModel.RemovePersistenceEventTypeId = setAndGetNextMetadataModelId();
					gModel.UpdatedPersistenceEventTypeId = setAndGetNextMetadataModelId();
					gModel.CreatedPersistenceEventTypeId = setAndGetNextMetadataModelId();
					gModel.RemovedPersistenceEventTypeId = setAndGetNextMetadataModelId();
					gModel.RejectedUpdatePersistenceEventTypeId = setAndGetNextMetadataModelId();
					gModel.RejectedCreatePersistenceEventTypeId = setAndGetNextMetadataModelId();
					gModel.RejectedRemovePersistenceEventTypeId = setAndGetNextMetadataModelId();
					break;
				case ObjectType.EVENT:
					gModel.title = model.createString(DefaultValueConstants.NewFileValues.EVENT_TITLE);
					gModel.description = model.createString(DefaultValueConstants.NewFileValues.EVENT_DESCRIPTION);
					gModel.fields = model.createList();
					gModel.queries = model.createList();
					gModel.id = setAndGetNextMetadataModelId();
					break;
				case ObjectType.SNIPPET:
					gModel.title = model.createString(DefaultValueConstants.NewFileValues.SNIPPET_TITLE);
					gModel.description = model.createString(DefaultValueConstants.NewFileValues.SNIPPET_DESCRIPTION);
					gModel.fields = model.createList();
					gModel.id = setAndGetNextMetadataModelId();
					break;
				case ObjectType.ENUM:
					gModel.title = model.createString(DefaultValueConstants.NewFileValues.ENUM_TITLE);
					gModel.description = model.createString(DefaultValueConstants.NewFileValues.ENUM_DESCRIPTION);
					gModel.fields = model.createList();
					gModel.id = setAndGetNextMetadataModelId();
					break;
				default: break;
			}
			this.setCreator(gModel);
		};

		function setAndGetNextMetadataModelId()
		{
			if (gMetadataModel.nextId == null)
			{
				gMetadataModel.nextId = 0;
			}
			gMetadataModel.nextId = gMetadataModel.nextId + 1;
			return gMetadataModel.nextId;
		};
	}

	// //////// public members
	this.initialize = function(onInitializeFinished)
	{
		loadMetadataModel(loadDataModel, onInitializeFinished);
	}

	this.dispose = function()
	{
		gMetadataDoc.close();
		gDoc.close();
	}
}

module.exports = EditorController;