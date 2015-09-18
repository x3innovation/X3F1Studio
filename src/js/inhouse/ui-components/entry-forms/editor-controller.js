function EditorController(fileType, projectFileId, objectFileId)
{
	// //////// private members
	var projectFileId = projectFileId;
	var objectFileId = objectFileId;
	var gDriveInterface = require('../../remote-server-interface/google-api-interface.js');
	var GDriveConstants = require('../../constants/google-drive-constants.js');
	var DefaultValueConstants = require('../../constants/default-value-constants.js');
	var ObjectTypes = GDriveConstants.ObjectTypes;
	
	var customObjectKeys = {};
	customObjectKeys[ObjectTypes.PERSISTENT_DATA] = GDriveConstants.CustomObjectKey.PERSISTENT_DATA;
	customObjectKeys[ObjectTypes.ENUM] = GDriveConstants.CustomObjectKey.ENUM;
	customObjectKeys[ObjectTypes.EVENT] = GDriveConstants.CustomObjectKey.EVENT;
	customObjectKeys[ObjectTypes.SNIPPET] = GDriveConstants.CustomObjectKey.SNIPPET;
	var customObjectKey = customObjectKeys[fileType];

	var PageTitleConstants = DefaultValueConstants.PageTitleValues;
	var pageTitles = {};
	pageTitleMap[ObjectTypes.PERSISTENT_DATA] = PageTitleConstants.PERSISTENT_DATA_FORM_PAGE_TITLE;
	pageTitleMap[ObjectTypes.ENUM] = PageTitleConstants.ENUM_FORM_PAGE_TITLE;
	pageTitleMap[ObjectTypes.EVENT] = PageTitleConstants.EVENT_FORM_PAGE_TITLE;
	pageTitleMap[ObjectTypes.SNIPPET] = PageTitleConstants.SNIPPET_FORM_PAGE_TITLE;
	var pageTitle = pageTitleMap[fileType];

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
		};
	}

	function loadDataModel(gMetadataModel, onInitializeFinished)
	{
		gapi.drive.realtime.load(objectFileId, onDataFileLoaded, initializeModel);

		function onDataFileLoaded(doc)
		{
			gDoc = doc;
			model = doc.getModel().getRoot().get(customObjectKey);
			if (!model.creatingUser) {
				this.setCreator(model, callback);
			}

			onInitializeFinished();
		};

		function setCreator(model) {
			gDriverInterface.getFileMetadata(objectFileId, function(respData) {
				model.createdDate = respData.createdDate;
				model.creatingUser = {
					name: respData.owners[0].displayName,
					userId: respData.owners[0].permissionId
				};
			});
		};

		function initializeModel(model) {
			gModel = model.create(customObjectKey);
			gModel.getRoot().set(customObjectKey, model);

			switch (fileType) {
				case ObjectTypes.PERSISTENT_DATA:
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
				case ObjectTypes.EVENT:
					gModel.title = model.createString(DefaultValueConstants.NewFileValues.EVENT_TITLE);
					gModel.description = model.createString(DefaultValueConstants.NewFileValues.EVENT_DESCRIPTION);
					gModel.fields = model.createList();
					gModel.queries = model.createList();
					gModel.id = setAndGetNextMetadataModelId();
					break;
				case ObjectTypes.SNIPPET:
					gModel.title = model.createString(DefaultValueConstants.NewFileValues.SNIPPET_TITLE);
					gModel.description = model.createString(DefaultValueConstants.NewFileValues.SNIPPET_DESCRIPTION);
					gModel.fields = model.createList();
					gModel.id = setAndGetNextMetadataModelId();
					break;
				case ObjectTypes.ENUM:
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