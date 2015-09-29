var googleApiInterface = require('../remote-server-interfaces/google-api-interface.js');
var GCons = require('../constants/google-drive-constants.js');
var DefaultCons = require('../constants/default-value-constants.js');
var AnnouncementType = require('../constants/announcement-type.js');
var DefaultFields = DefaultCons.DefaultFieldAttributes;
var ObjectType = GCons.ObjectType;
var Configs = require('../app-config.js');
var latestVersionConverter = new LatestVersionConverter(Configs.App.VERSION);

function GoogleDriveService()
{
	// //////// private members
	var _this = this;
	var customObjectKeys = {};
	customObjectKeys[ObjectType.PERSISTENT_DATA] = GCons.CustomObjectKey.PERSISTENT_DATA;
	customObjectKeys[ObjectType.ENUM] = GCons.CustomObjectKey.ENUM;
	customObjectKeys[ObjectType.EVENT] = GCons.CustomObjectKey.EVENT;
	customObjectKeys[ObjectType.SNIPPET] = GCons.CustomObjectKey.SNIPPET;
	var versionNumber;

	var sortCompareByFileTitle = function(a,b) {
		var titleA = a.title.toLowerCase(), titleB = b.title.toLowerCase();
		if (titleA < titleB) //sort string ascending
		{
			return -1;
		}
		else if (titleA > titleB)
		{
			return 1;
		}
		else
		{
			return 0;
		}
	};

	var updateMetadataModel = function(metadataModel) {
		if (metadataModel.version == null) {
		    metadataModel.version = 1;
		}
		if (metadataModel.nextId == null) {
		    metadataModel.nextId = 10;
		}
		if (metadataModel.announcement == null) {
		    metadataModel.announcement = doc.getModel().createList();
		}
	};

	// //////// public members
	this.getProjects = function(titleSearchString, callback)
	{
		googleApiInterface.getProjects(successCallback);

		function successCallback(projects) {
			var filteredProjects = [];
			if (titleSearchString != null && titleSearchString.length > 0) {
				for (var i in projects) {
					var projectTitle = projects[i].title.toLowerCase();
					if (projectTitle.indexOf(titleSearchString.toLowerCase()) > -1) {
						filteredProjects.push(projects[i]);
					}
				}
			}
			else {
				filteredProjects = projects;
			}			

			filteredProjects.sort(sortCompareByFileTitle);
			callback(filteredProjects);
		}
	};

	this.getProjectById = function(projectId, callback) {
		googleApiInterface.getProjectById(projectId, callback);
	};

	this.saveProjectTitle = function(projectFileId, newTitle, parentFolderId) {
		googleApiInterface.saveTitle(projectFileId, newTitle);
		googleApiInterface.saveTitle(parentFolderId, newTitle);
	};

	this.saveFileTitle = function(fileId, title) {
		googleApiInterface.saveTitle(fileId, title);
	};

	this.setAndGetNextMetadataModelId = function(gMetadataModel, step) {
		if (step == null)
		{
			step = 1;
		}

	    if (gMetadataModel.nextId == null)
		{
			gMetadataModel.nextId = 0;
		}
		
		gMetadataModel.nextId = gMetadataModel.nextId + step;
		return gMetadataModel.nextId;
	};

	this.announce = function(metadataModel, announcement) {
	    metadataModel.announcement.clear();
	    metadataModel.announcement.push(announcement);
	};

	this.registerAnnouncement = function(metadataModel, callback) {
	    metadataModel.announcement.addEventListener(gapi.drive.realtime.EventType.VALUES_ADDED, callback);
	};

	this.getProjectObjects = function( projectFolderFileId, titleSearchString, objectsToGet, callback)
	{
		var buildQuery = function (projectFolderFileId, objectsToGet)
		{
			// we are doing fullText contains search because at the time of writing this code,
			// google drive api had bugs in custom properties query. So we are relying on having the object types
			// right in the file's description and doing fullText search provided by Google to query the files accordingly
			var query = "'" + projectFolderFileId + "' in parents and (";
			var isFirstCondition = true;

			// add persistent data query
			if (objectsToGet.persistentData)
			{	
				if (!isFirstCondition)
				{
					query += " or ";
				}
				query += "fullText contains '" + GCons.ObjectType.PERSISTENT_DATA + "'";
				isFirstCondition = false;
			}

			// add enum query
			if (objectsToGet.enum)
			{
				if (!isFirstCondition)
				{
					query += " or ";
				}
				query += "fullText contains '" + GCons.ObjectType.ENUM + "'";
				isFirstCondition = false;
			}

			// add snippet query
			if (objectsToGet.snippet)
			{
				if (!isFirstCondition)
				{
					query += " or ";
				}
				query += "fullText contains '" + GCons.ObjectType.SNIPPET + "'";
				isFirstCondition = false;
			}

			// add event query
			if (objectsToGet.event)
			{
				if (!isFirstCondition)
				{
					query += " or ";
				}
				query += "fullText contains '" + GCons.ObjectType.EVENT + "'";
				isFirstCondition = false;
			}

			// add flow query
			if (objectsToGet.flow)
			{
				if (!isFirstCondition)
				{
					query += " or ";
				}
				query += "fullText contains '" + GCons.ObjectType.FLOW + "'";
				isFirstCondition = false;
			}

			query += ') and trashed = false'; //do not list entries in the trash folder

			return query;
		};

		var getAnyObjectFlag = false;
		for (var objectType in objectsToGet)
		{
			if (objectsToGet[objectType])
			{
				getAnyObjectFlag = true;
				break;
			}
		}

		if (!getAnyObjectFlag)
		{
			return [];
		}
		else
		{
			var callbackWrapper = function(projectObjects)
			{
				var filteredProjectObjects = filterObjectsByTitle(projectObjects, titleSearchString);
				filteredProjectObjects.sort(sortCompareByFileTitle);
				callback(filteredProjectObjects);
			};

			var filterObjectsByTitle = function(projectObjects, titleSearchString)
			{
				var filteredProjectObjects = [];
				for (var i in projectObjects)
				{
					if (projectObjects[i].title.toLowerCase().indexOf(titleSearchString.toLowerCase()) > -1)
					{
						filteredProjectObjects.push(projectObjects[i]);
					}
				}
				return filteredProjectObjects;
			};

			var query = buildQuery(projectFolderFileId, objectsToGet);
			googleApiInterface.getProjectObjects(query, callbackWrapper);
		}
	};

	this.createNewProject = function(callback) {
		var createNewF1Metadata = function (folder) {
			var fileCreationParams = {
				title: folder.title,
				description: GCons.ObjectType.PROJECT_METADATA,
				parentId: folder.id,
				mimeType: GCons.MimeType.PROJECT
			};
			googleApiInterface.createNewFile(fileCreationParams, callback);
		};
		var folderCreationParams = {
			title: DefaultCons.NewFileValues.PROJECT_TITLE,
			mimeType: GCons.MimeType.FOLDER
		};
		googleApiInterface.createNewFolder(folderCreationParams, createNewF1Metadata);
	};

	this.createNewF1Object = function(objectType, parentFolderId, callback) {
		var fileCreationParams = {
			description: objectType,
			parentId: parentFolderId
		};
		switch (objectType) {
			case (GCons.ObjectType.PERSISTENT_DATA):
				fileCreationParams.title = DefaultCons.NewFileValues.PERSISTENT_DATA_TITLE;
				fileCreationParams.mimeType = GCons.MimeType.DMX;
				break;
			case (GCons.ObjectType.EVENT):
				fileCreationParams.title = DefaultCons.NewFileValues.EVENT_TITLE;
				fileCreationParams.mimeType = GCons.MimeType.DMX;
				break;
			case (GCons.ObjectType.SNIPPET):
				fileCreationParams.title = DefaultCons.NewFileValues.SNIPPET_TITLE;
				fileCreationParams.mimeType = GCons.MimeType.DMX;
				break;
			case (GCons.ObjectType.ENUM):
				fileCreationParams.title = DefaultCons.NewFileValues.PERSISTENT_DATA_TITLE;
				fileCreationParams.mimeType = GCons.MimeType.DMXE;
				break;
			case (GCons.ObjectType.FLOW):
				/*** TODO ***/
				break;
			default:
				break;
		}

		var _this = this;
		var callbackWrapper = function(file) {
			var addFileAnnouncement = {
				action: AnnouncementType.ADD_FILE,
				fileType: objectType,
				fileId: file.id,
				fileName: fileCreationParams.title
			};

			_this.getMetadataModel(parentFolderId, function(metadataModel) {
				_this.announce(metadataModel, addFileAnnouncement);
			});
			callback(file);
		};
		
		googleApiInterface.createNewFile(fileCreationParams, callbackWrapper);
	};

	this.createNewField = function(newFieldName, gModel) {
		var newField = {
			type: DefaultFields.FIELD_TYPE,
			defValueBool: DefaultFields.FIELD_DEF_BOOL_VALUE,
			optional: DefaultFields.FIELD_OPTIONAL,
			array: DefaultFields.FIELD_ARRAY,
			refId: DefaultFields.FIELD_REF_ID,
			refName: DefaultFields.FIELD_REF_NAME,
			refType: DefaultFields.FIELD_REF_TYPE,
			enumId: DefaultFields.FIELD_ENUM_ID,
			enumName: DefaultFields.FIELD_ENUM_NAME,
			enumValue: DefaultFields.FIELD_ENUM_VALUE,
			contextId: DefaultFields.FIELD_CONTEXT_ID
		};

		var gField = gModel.createMap(newField);
		gField.set('name', gModel.createString(newFieldName));
		gField.set('description', gModel.createString(DefaultFields.FIELD_DESCRIPTION));
		gField.set('defValue', gModel.createString(DefaultFields.FIELD_DEF_VALUE));
		gField.set('minValue', gModel.createString(DefaultFields.FIELD_MIN_VALUE));
		gField.set('maxValue', gModel.createString(DefaultFields.FIELD_MAX_VALUE));
		gField.set('defDate', gModel.createString(DefaultFields.FIELD_DEF_DATE_VALUE));
		gField.set('minDate', gModel.createString(DefaultFields.FIELD_MIN_DATE_VALUE));
		gField.set('maxDate', gModel.createString(DefaultFields.FIELD_MAX_DATE_VALUE));
		gField.set('minStrLen', gModel.createString(DefaultFields.FIELD_MIN_STR_LEN));
		gField.set('maxStrLen', gModel.createString(DefaultFields.FIELD_MAX_STR_LEN));
		gField.set('arrayLen', gModel.createString(DefaultFields.FIELD_ARRAY_LEN));
		return gField;
	};

	this.resetFieldData = function(fieldData) {
		fieldData.set('optional', DefaultFields.FIELD_OPTIONAL);
		fieldData.set('array', DefaultFields.FIELD_ARRAY);
		fieldData.set('refId', DefaultFields.FIELD_REF_ID);
		fieldData.set('refName', DefaultFields.FIELD_REF_NAME);
		fieldData.set('refType', DefaultFields.FIELD_REF_TYPE);
		fieldData.set('enumId', DefaultFields.FIELD_ENUM_ID);
		fieldData.set('enumName', DefaultFields.FIELD_ENUM_NAME);
		fieldData.set('enumValue', DefaultFields.FIELD_ENUM_VALUE);
		fieldData.set('defValueBool', DefaultFields.FIELD_DEF_BOOL_VALUE);

		fieldData.get('defValue').setText(DefaultFields.FIELD_DEF_VALUE);
		fieldData.get('minValue').setText(DefaultFields.FIELD_MIN_VALUE);
		fieldData.get('maxValue').setText(DefaultFields.FIELD_MAX_VALUE);
		fieldData.get('defDate').setText(DefaultFields.FIELD_DEF_DATE_VALUE);
		fieldData.get('minDate').setText(DefaultFields.FIELD_MIN_DATE_VALUE);
		fieldData.get('maxDate').setText(DefaultFields.FIELD_MAX_DATE_VALUE);
		fieldData.get('minStrLen').setText(DefaultFields.FIELD_MIN_STR_LEN);
		fieldData.get('maxStrLen').setText(DefaultFields.FIELD_MAX_STR_LEN);
		fieldData.get('arrayLen').setText(DefaultFields.FIELD_ARRAY_LEN);
		return fieldData;
	};

	this.getFileMetadata = function(fileId, callback) {
		googleApiInterface.getFileMetadata(fileId, callback);
	}

	this.loadMetadataDoc = function(projectFileId, callback)
	{
		gapi.drive.realtime.load(projectFileId, onMetadataFileLoaded, initializeMetadataModel);

		function onMetadataFileLoaded(doc) {
	        var metadataModel = doc.getModel().getRoot().get(GCons.CustomObjectKey.PROJECT_METADATA);
	        if (metadataModel == null) {
	        	initializeMetadataModel(doc.getModel());
	        }
	        callback(doc, metadataModel);
	    }

	    function initializeMetadataModel(model) {
	        var field = model.create(GCons.CustomObjectKey.PROJECT_METADATA);
	        field.announcement = model.createList();
	        field.nextId = 0;
	        field.version = Configs.App.VERSION;
	        model.getRoot().set(GCons.CustomObjectKey.PROJECT_METADATA, field);
	    };
	}

	this.loadDriveFileDoc = function(fileId, fileType, callback)
	{
		gapi.drive.realtime.load(fileId, onDocumentLoaded, initializeDocument);

		function initializeDocument(docModel)
		{
			var customObjectKey = customObjectKeys[fileType];
			customObject = docModel.create(customObjectKey);

			// initialize custom object depending on filetype
			switch (fileType) {
				case ObjectType.PERSISTENT_DATA:
					customObject.title = gFileModel.createString(DefaultValueConstants.NewFileValues.PERSISTENT_DATA_TITLE);
					customObject.description = gFileModel.createString(DefaultValueConstants.NewFileValues.PERSISTENT_DATA_DESCRIPTION);
					customObject.fields = gFileModel.createList();
					customObject.queries = gFileModel.createList();
					customObject.id = _this.setAndGetNextMetadataModelId(gMetadataModel);
					customObject.UpdatePersistenceEventTypeId = _this.setAndGetNextMetadataModelId(gMetadataModel);
					customObject.CreatePersistenceEventTypeId = _this.setAndGetNextMetadataModelId(gMetadataModel);
					customObject.RemovePersistenceEventTypeId = _this.setAndGetNextMetadataModelId(gMetadataModel);
					customObject.UpdatedPersistenceEventTypeId = _this.setAndGetNextMetadataModelId(gMetadataModel);
					customObject.CreatedPersistenceEventTypeId = _this.setAndGetNextMetadataModelId(gMetadataModel);
					customObject.RemovedPersistenceEventTypeId = _this.setAndGetNextMetadataModelId(gMetadataModel);
					customObject.RejectedUpdatePersistenceEventTypeId = _this.setAndGetNextMetadataModelId(gMetadataModel);
					customObject.RejectedCreatePersistenceEventTypeId = _this.setAndGetNextMetadataModelId(gMetadataModel);
					customObject.RejectedRemovePersistenceEventTypeId = _this.setAndGetNextMetadataModelId(gMetadataModel);
					break;
				case ObjectType.EVENT:
					customObject.title = gFileModel.createString(DefaultValueConstants.NewFileValues.EVENT_TITLE);
					customObject.description = gFileModel.createString(DefaultValueConstants.NewFileValues.EVENT_DESCRIPTION);
					customObject.fields = gFileModel.createList();
					customObject.queries = gFileModel.createList();
					customObject.id = _this.setAndGetNextMetadataModelId(gMetadataModel);
					customObject.isBusinessRequest = false;
					break;
				case ObjectType.SNIPPET:
					customObject.title = gFileModel.createString(DefaultValueConstants.NewFileValues.SNIPPET_TITLE);
					customObject.description = gFileModel.createString(DefaultValueConstants.NewFileValues.SNIPPET_DESCRIPTION);
					customObject.fields = gFileModel.createList();
					customObject.id = _this.setAndGetNextMetadataModelId(gMetadataModel);
					break;
				case ObjectType.ENUM:
					customObject.title = gFileModel.createString(DefaultValueConstants.NewFileValues.ENUM_TITLE);
					customObject.description = gFileModel.createString(DefaultValueConstants.NewFileValues.ENUM_DESCRIPTION);
					customObject.fields = gFileModel.createList();
					customObject.id = _this.setAndGetNextMetadataModelId(gMetadataModel);
					break;
				case ObjectType.PROJECT:
					var gRoot = docModel.getRoot();
					docModel.beginCompoundOperation();
					gRoot.set(GCons.Project.KEY_TITLE, docModel.createString(DefaultValueConstants.NewFileValues.PROJECT_TITLE));
					gRoot.set(GCons.Project.KEY_DESCRIPTION, docModel.createString(DefaultValueConstants.NewFileValues.PROJECT_DESCRIPTION));
					docModel.endCompoundOperation();
					break;
				default: break;
			}
		}

		function onDocumentLoaded(doc)
		{
			if (fileType === ObjectType.PROJECT)
			{
				callback(doc);
			}
			else
			{
				if (!latestVersionConverter.isLatestObject(doc))
				{
					latestVersionConverter.convertObjectToLatest(doc);
				}

				var customObjectKey = customObjectKeys[fileType];
				var customObject = doc.getModel().getRoot().get(customObjectKey);
				if (!customObject.creatingUser) {
					setCreator(customObject);
				}
				
				callback(doc, doc.getModel(), customObject);
			}
		}

		function setCreator(customObject)
		{
			googleApiInterface.getFileMetadata(objectFileId, function(respData) {
				customObject.createdDate = respData.createdDate;
				customObject.creatingUser = {
					name: respData.owners[0].displayName,
					userId: respData.owners[0].permissionId
				};
			});
		}
	}
}

module.exports = new GoogleDriveService();

function LatestVersionConverter(latestVersion)
{
	// PRIVATE
	var latestVersion = latestVersion;
	var converters = [];

	// PUBLIC
	this.isLatestObject = function(doc)
	{
		var currentVersion = doc.getModel().getRoot().get(GCons.Object.VERSION);

		if (currentVersion == null)
		{
			doc.getModel().getRoot().set(GCons.Object.VERSION, 1);
		}

		return doc.version === latestVersion;
	}

	this.convertObjectToLatest = function(doc)
	{

	}
}