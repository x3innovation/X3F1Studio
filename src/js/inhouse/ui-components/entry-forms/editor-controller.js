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
	var fileType = fileType;
	
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

	// //////// public members
	this.initialize = function(onInitializeFinished)
	{
		gDriveUtils.loadMetadataDoc(projectFileId, onMetadataLoaded);
		gDriveUtils.loadDriveFileDoc(objectFileId, fileType, onObjectFileLoaded);

		function onMetadataLoaded(metadataDoc, metadataCustomObject)
		{
			gMetadataDoc = metadataDoc;
			gMetadataModel = metadataCustomObject;
			onLoaded();
		}

		function onObjectFileLoaded(objectDoc, objectModel, objectCustomObject)
		{
			gDoc = objectDoc;
			gFileModel = objectModel;
			gFileCustomModel = objectCustomObject;
			onLoaded();
		}

		function onLoaded()
		{
			if (gMetadataDoc && gDoc)
			{
				onInitializeFinished(gMetadataModel, gFileCustomModel, gFileModel);
			}
		}
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