var googleApiInterface = require('../remote-server-interfaces/google-api-interface.js');
var GCons = require('../constants/google-drive-constants.js');
var DefaultValueConstants = require('../constants/default-value-constants.js');
var AnnouncementType = require('../constants/announcement-type.js');
var DefaultFields = DefaultValueConstants.DefaultFieldAttributes;
var ObjectType = GCons.ObjectType;
var Configs = require('../app-config.js');
var latestVersionConverter = new LatestVersionConverter(Configs.App.VERSION);
var customObjectKeys = {};
customObjectKeys[ObjectType.PERSISTENT_DATA] = GCons.CustomObjectKey.PERSISTENT_DATA;
customObjectKeys[ObjectType.ENUM] = GCons.CustomObjectKey.ENUM;
customObjectKeys[ObjectType.EVENT] = GCons.CustomObjectKey.EVENT;
customObjectKeys[ObjectType.SNIPPET] = GCons.CustomObjectKey.SNIPPET;
customObjectKeys[ObjectType.PROJECT_METADATA] = GCons.CustomObjectKey.PROJECT_METADATA;
customObjectKeys[ObjectType.PROJECT] = GCons.CustomObjectKey.PROJECT;

function GoogleDriveUtils()
{
	// //////// private members
	var _this = this;
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

	var updateMetadataModel = function(gMetadataObject) {
		if (gMetadataObject.version == null) {
		    gMetadataObject.version = 1;
		}
		if (gMetadataObject.nextId == null) {
		    gMetadataObject.nextId = 10;
		}
		if (gMetadataObject.announcement == null) {
		    gMetadataObject.announcement = doc.getModel().createList();
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

	this.getNewTypeId = function(gMetadataCustomObject, step) {		
		return UUIDjs.create(4).hex;
	};

	this.announce = function(gMetadataCustomObject, announcement) {
	    gMetadataCustomObject.announcement.clear();
	    gMetadataCustomObject.announcement.push(announcement);
	};

	this.registerAnnouncement = function(gMetadataCustomObject, callback) {
	    gMetadataCustomObject.announcement.addEventListener(gapi.drive.realtime.EventType.VALUES_ADDED, callback);
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
			title: DefaultValueConstants.NewFileValues.PROJECT_TITLE,
			mimeType: GCons.MimeType.FOLDER
		};
		googleApiInterface.createNewFolder(folderCreationParams, createNewF1Metadata);
	};

	this.createNewF1Object = function(objectType, metadataFileId, parentFolderId, callback) {
		var fileCreationParams = {
			description: objectType,
			parentId: parentFolderId
		};
		switch (objectType) {
			case (GCons.ObjectType.PERSISTENT_DATA):
				fileCreationParams.title = DefaultValueConstants.NewFileValues.PERSISTENT_DATA_TITLE;
				fileCreationParams.mimeType = GCons.MimeType.DMX;
				break;
			case (GCons.ObjectType.EVENT):
				fileCreationParams.title = DefaultValueConstants.NewFileValues.EVENT_TITLE;
				fileCreationParams.mimeType = GCons.MimeType.DMX;
				break;
			case (GCons.ObjectType.SNIPPET):
				fileCreationParams.title = DefaultValueConstants.NewFileValues.SNIPPET_TITLE;
				fileCreationParams.mimeType = GCons.MimeType.DMX;
				break;
			case (GCons.ObjectType.ENUM):
				fileCreationParams.title = DefaultValueConstants.NewFileValues.ENUM_TITLE;
				fileCreationParams.mimeType = GCons.MimeType.DMXE;
				break;
			case (GCons.ObjectType.FLOW):
				/*** TODO ***/
				break;
			default:
				break;
		}

		var onFileCreationCompleted = function(file) {
			_this.loadMetadataDoc(metadataFileId, parentFolderId, function(metadataDoc, metadataCustomObject){
				// announce file created
				var addFileAnnouncement = {
					action: AnnouncementType.ADD_FILE,
					fileType: objectType,
					fileId: file.id,
					fileName: fileCreationParams.title
				};
				_this.announce(gMetadataObject, addFileAnnouncement);

				metadataDoc.close();
			});
			
			callback(file);
		};
		
		googleApiInterface.createNewFile(fileCreationParams, onFileCreationCompleted);
	};

	this.createNewField = function(newFieldName, gModel) {
		var newField = {
			type: DefaultFields.FIELD_TYPE,
			defValueBool: DefaultFields.FIELD_DEF_BOOL_VALUE,
			optional: DefaultFields.FIELD_OPTIONAL,
			array: DefaultFields.FIELD_ARRAY,
			unique: DefaultFields.FIELD_UNIQUE,
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
        gField.set('minDateTimeDate', gModel.createString(DefaultFields.FIELD_MIN_DATETIME_DATE_VALUE));
        gField.set('minDateTimeTime', gModel.createString(DefaultFields.FIELD_MIN_DATETIME_TIME_VALUE));
        gField.set('maxDateTimeDate', gModel.createString(DefaultFields.FIELD_MAX_DATETIME_DATE_VALUE));
        gField.set('maxDateTimeTime', gModel.createString(DefaultFields.FIELD_MAX_DATETIME_TIME_VALUE));
        gField.set('defDateTimeDate', gModel.createString(DefaultFields.FIELD_DEF_DATETIME_DATE_VALUE));
        gField.set('defDateTimeTime', gModel.createString(DefaultFields.FIELD_DEF_DATETIME_TIME_VALUE));
		gField.set('minDate', gModel.createString(DefaultFields.FIELD_MIN_DATE_VALUE));
		gField.set('maxDate', gModel.createString(DefaultFields.FIELD_MAX_DATE_VALUE));
        gField.set('minTime', gModel.createString(DefaultFields.FIELD_MIN_TIME_VALUE));
        gField.set('maxTime', gModel.createString(DefaultFields.FIELD_MAX_TIME_VALUE));
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

	this.loadMetadataDoc = function(fileId, projectFolderFileId, callback)
	{
		gapi.drive.realtime.load(fileId, onMetadataFileLoaded, initializeMetadataModel);

		function onMetadataFileLoaded(doc) {
	        var metadataCustomObject = doc.getModel().getRoot().get(GCons.CustomObjectKey.PROJECT_METADATA);
	        if (metadataCustomObject == null) {
                metadataCustomObject = initializeMetadataModel(doc.getModel());
	        }

	        if (!latestVersionConverter.isLatestObject(doc))
			{
				latestVersionConverter.convertObjectToLatest(doc, 
					ObjectType.PROJECT_METADATA, 
					projectFolderFileId,
					onVersionConversionCompleted);
			}

			function onVersionConversionCompleted(){
				callback(doc, metadataCustomObject);
			}
	    }

	    function initializeMetadataModel(model) {
	    	// project metadata model related metadata
	        var metadataCustomObject = model.create(GCons.CustomObjectKey.PROJECT_METADATA);
	        metadataCustomObject.announcement = model.createList();
	        metadataCustomObject.nextId = 0;
	        metadataCustomObject.version = Configs.App.VERSION;
	        metadataCustomObject.businessRequestEvents = model.createList();
	        metadataCustomObject.nonBusinessRequestEvents = model.createList();
	        metadataCustomObject.businessResponseEvents = model.createList();
	        model.getRoot().set(GCons.CustomObjectKey.PROJECT_METADATA, metadataCustomObject);
            return metadataCustomObject;
	    };
	}

	this.loadDriveFileDoc = function(fileId, fileType, callback, metadataCustomObject)
	{
		gapi.drive.realtime.load(fileId, onDocumentLoaded, initializeDocument);

		function initializeDocument(docModel)
		{
			var customObjectKey = customObjectKeys[fileType];
			customObject = docModel.create(customObjectKey);

			// initialize custom object depending on filetype
			switch (fileType) {
				case ObjectType.PERSISTENT_DATA:
					customObject.title = docModel.createString(DefaultValueConstants.NewFileValues.PERSISTENT_DATA_TITLE);
					customObject.description = docModel.createString(DefaultValueConstants.NewFileValues.PERSISTENT_DATA_DESCRIPTION);
					customObject.fields = docModel.createList();
					customObject.queries = docModel.createList();
					customObject.id = _this.getNewTypeId(metadataCustomObject);
					customObject.UpdatePersistenceEventTypeId = _this.getNewTypeId(metadataCustomObject);
					customObject.CreatePersistenceEventTypeId = _this.getNewTypeId(metadataCustomObject);
					customObject.RemovePersistenceEventTypeId = _this.getNewTypeId(metadataCustomObject);
					customObject.UpdatedPersistenceEventTypeId = _this.getNewTypeId(metadataCustomObject);
					customObject.CreatedPersistenceEventTypeId = _this.getNewTypeId(metadataCustomObject);
					customObject.RemovedPersistenceEventTypeId = _this.getNewTypeId(metadataCustomObject);
					customObject.RejectedUpdatePersistenceEventTypeId = _this.getNewTypeId(metadataCustomObject);
					customObject.RejectedCreatePersistenceEventTypeId = _this.getNewTypeId(metadataCustomObject);
					customObject.RejectedRemovePersistenceEventTypeId = _this.getNewTypeId(metadataCustomObject);
					customObject.isUpdateBusinessRequest = false;
					customObject.isCreateBusinessRequest = false;
					customObject.isRemoveBusinessRequest = false;
					docModel.getRoot().set(customObjectKey, customObject);

					metadataCustomObject.projectObjectTitles.set(fileId, DefaultValueConstants.NewFileValues.PERSISTENT_DATA_TITLE);
					break;
				case ObjectType.EVENT:
					customObject.title = docModel.createString(DefaultValueConstants.NewFileValues.EVENT_TITLE);
					customObject.description = docModel.createString(DefaultValueConstants.NewFileValues.EVENT_DESCRIPTION);
					customObject.fields = docModel.createList();
					customObject.queries = docModel.createList();
					customObject.id = _this.getNewTypeId(metadataCustomObject);
					customObject.isBusinessRequest = false;
					customObject.correspondingBusinessResponses = docModel.createList();
					docModel.getRoot().set(customObjectKey, customObject);

					var metadataEventModel = _this.createMetadataEvent(fileId, DefaultValueConstants.NewFileValues.EVENT_TITLE, customObject.id);
					metadataCustomObject.nonBusinessRequestEvents.push(metadataEventModel);
					metadataCustomObject.projectObjectTitles.set(fileId, DefaultValueConstants.NewFileValues.EVENT_TITLE);
					break;
				case ObjectType.SNIPPET:
					customObject.title = docModel.createString(DefaultValueConstants.NewFileValues.SNIPPET_TITLE);
					customObject.description = docModel.createString(DefaultValueConstants.NewFileValues.SNIPPET_DESCRIPTION);
					customObject.fields = docModel.createList();
					customObject.id = _this.getNewTypeId(metadataCustomObject);
					docModel.getRoot().set(customObjectKey, customObject);

					metadataCustomObject.projectObjectTitles.set(fileId, DefaultValueConstants.NewFileValues.SNIPPET_TITLE);
					break;
				case ObjectType.ENUM:
					customObject.title = docModel.createString(DefaultValueConstants.NewFileValues.ENUM_TITLE);
					customObject.description = docModel.createString(DefaultValueConstants.NewFileValues.ENUM_DESCRIPTION);
					customObject.fields = docModel.createList();
					customObject.id = _this.getNewTypeId(metadataCustomObject);
					docModel.getRoot().set(customObjectKey, customObject);

					metadataCustomObject.projectObjectTitles.set(fileId, DefaultValueConstants.NewFileValues.ENUM_TITLE);
					break;
				case ObjectType.PROJECT:
					customObject.title = docModel.createString(DefaultValueConstants.NewFileValues.PROJECT_TITLE);
					customObject.description = docModel.createString(DefaultValueConstants.NewFileValues.PROJECT_DESCRIPTION);
					docModel.getRoot().set(customObjectKey, customObject);
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
					latestVersionConverter.convertObjectToLatest(doc, fileType, null, onVersionConversionCompleted);
				}

				function onVersionConversionCompleted(){
					var customObjectKey = customObjectKeys[fileType];
					var customObject = doc.getModel().getRoot().get(customObjectKey);
					if (!customObject.creatingUser) {
						setCreator(customObject, function(){
							callback(doc, doc.getModel(), customObject);
						});
					}
					else
					{
						callback(doc, doc.getModel(), customObject);
					}
				}
			}
		}

		function setCreator(customObject, callback)
		{
			googleApiInterface.getFileMetadata(fileId, function(respData) {
				customObject.createdDate = respData.createdDate;
				customObject.creatingUser = {
					name: respData.owners[0].displayName,
					userId: respData.owners[0].permissionId
				};

				callback();
			});
		}
	}

	this.createMetadataEvent = function(gFileId, eventTitle, typeId){
		var metadataEvent = {};
		metadataEvent.gFileId = gFileId;
		metadataEvent.eventObjectTitle = eventTitle;
		metadataEvent.eventTypeId = typeId;
		return metadataEvent;
	}

	this.getGoogleFileIdForEventName = function(gMetadataCustomObject, eventName){
		var eventFound = false;
		var gFileId;

		// find out the google file id for this event name
		for (var i=0; i<gMetadataCustomObject.businessRequestEvents.length; ++i){
			var businessRequestEvent = gMetadataCustomObject.businessRequestEvents.get(i);
			if (businessRequestEvent.eventObjectTitle === eventName){
				eventFound = true;
				gFileId = businessRequestEvent.gFileId;
				break;
			}
		}
		if (!eventFound){
			for (var i=0; i<gMetadataCustomObject.nonBusinessRequestEvents.length; ++i){
				var nonBusinessRequestEvent = gMetadataCustomObject.nonBusinessRequestEvents.get(i);
				if (nonBusinessRequestEvent.eventObjectTitle === eventName){
					gFileId = nonBusinessRequestEvent.gFileId;
					break;
				}
			}
		}

		return gFileId;
	}

	this.getEventNameForGoogleFileIds = function(gMetadataCustomObject, googleFileIds){
		var titles = [];
		for (var i in googleFileIds){
			var gFileId = googleFileIds[i];
			var title = getTitleForGoogleFileId(gFileId);
			titles.push(title);
		}

		return titles;

		function getTitleForGoogleFileId(gFileId){
			var eventFound = false;
			var title;

			// find out the google file id for this event name
			for (var i=0; i<gMetadataCustomObject.businessRequestEvents.length; ++i){
				var businessRequestEvent = gMetadataCustomObject.businessRequestEvents.get(i);
				if (businessRequestEvent.gFileId === gFileId){
					eventFound = true;
					title = businessRequestEvent.eventObjectTitle;
					break;
				}
			}
			if (!eventFound){
				for (var i=0; i<gMetadataCustomObject.nonBusinessRequestEvents.length; ++i){
					var nonBusinessRequestEvent = gMetadataCustomObject.nonBusinessRequestEvents.get(i);
					if (nonBusinessRequestEvent.gFileId === gFileId){
						title = nonBusinessRequestEvent.eventObjectTitle;
						break;
					}
				}
			}

			return title;
		}
	}

	this.getEventTypeIdForBusinessResponseGoogleFileIds = function(gMetadataCustomObject, googleFileIds) {
		var typeIds = [];
		for (var i in googleFileIds){
			var gFileId = googleFileIds[i];
			var typeId = getEventTypeIdForBusinessResponseGoogleFileId(gFileId);
			typeIds.push(typeId);
		}

		return typeIds;

		function getEventTypeIdForBusinessResponseGoogleFileId(gFileId){
			var typeId;

			// find out the google file id for the business response google file id
			for (var i=0; i<gMetadataCustomObject.businessResponseEvents.length; ++i){
				var businessResponseEvent = gMetadataCustomObject.businessResponseEvents.get(i);
				if (businessResponseEvent.gFileId === gFileId){
					typeId = businessResponseEvent.eventTypeId;
				}
			}

			return typeId;
		}
	}
}

var googleDriveUtils = new GoogleDriveUtils();

module.exports = googleDriveUtils;

function LatestVersionConverter(latestVersion)
{
	// PRIVATE
	var latestVersion = latestVersion;
	var versionConverters = [];
	versionConverters.push(from0to1);
	versionConverters.push(from1to2);

	function from0to1(doc, objectType, projectFolderFileId, callback, isLastConversion){
		if(isLastConversion){
			callback();
		}
	}

	function from1to2(doc, objectType, projectFolderFileId, callback, isLastConversion){
		var customObjectKey = customObjectKeys[objectType];

		switch (objectType)
		{
			case ObjectType.EVENT:
				var customObject = doc.getModel().getRoot().get(customObjectKey);

				// get rid of all these null checks once version 2 becomes official
				if (customObject.isBusinessRequest == null){
					customObject.isBusinessRequest = false;
				}
				if (customObject.correspondingBusinessResponses == null){
					customObject.correspondingBusinessResponses = doc.getModel().createList();
				}

                addNewFieldParameters();

				if (isLastConversion){
					callback();
				}
				break;
			case ObjectType.PROJECT_METADATA:
				var initializationCounter = 0;
				var customObject = doc.getModel().getRoot().get(customObjectKey);

				if (customObject.businessRequestEvents == null){
					customObject.businessRequestEvents = doc.getModel().createList();
				}

				if (customObject.nonBusinessRequestEvents == null){
					initializationCounter++;
					customObject.nonBusinessRequestEvents = doc.getModel().createList();
					initializeNonBusinessRequestEvents(customObject, projectFolderFileId, onEachInitializationFinished);
				}

				if (customObject.projectObjectTitles == null){
					initializationCounter++;
					customObject.projectObjectTitles = doc.getModel().createMap();
					initializeProjectObjectTitles(customObject, projectFolderFileId, onEachInitializationFinished);
				}

				if (customObject.businessResponseEvents == null){
					initializationCounter++;
					customObject.businessResponseEvents = doc.getModel().createList();
					initializeBusinessResponseEvents(customObject, projectFolderFileId, onEachInitializationFinished);
				}

				if (initializationCounter === 0 && isLastConversion){
					callback();
				}

				function onEachInitializationFinished(){
					initializationCounter--;
					if (initializationCounter === 0 && isLastConversion){
						callback();
					}
				}

				break;
			case ObjectType.PERSISTENT_DATA:
				var customObject = doc.getModel().getRoot().get(customObjectKey);
				if (customObject.isUpdateBusinessRequest == null){
					customObject.isUpdateBusinessRequest = false;
				}
				if (customObject.isCreateBusinessRequest == null){
					customObject.isCreateBusinessRequest = false;
				}
				if (customObject.isRemoveBusinessRequest == null){
					customObject.isRemoveBusinessRequest = false;
				}

                addNewFieldParameters();

				if (isLastConversion){
					callback();
				}
				break;
			default:
				if (isLastConversion){
					callback();
				}
				break;
		}

        function addNewFieldParameters(){
            var customObject = doc.getModel().getRoot().get(customObjectKey);
            if (customObject.fields){
                // add 'unique'
                for (var i=0; i<customObject.fields.length; ++i){
                    var field = customObject.fields.get(i);
                    if (!field.get('unique')){
                        field.set('unique', false);
                    }
                }
            }
        }
	}

	function initializeNonBusinessRequestEvents(customObject, projectFolderFileId, callback){
		var objectsToGet = {
			persistentData: false,
			enum: false,
			snippet: false,
			event: true,
			flow: false
		};
		googleDriveUtils.getProjectObjects(projectFolderFileId, '', objectsToGet, onEventsLoaded);

		function onEventsLoaded(events){
			for (var i in events)
			{
				var eventObject = events[i];
				var metadataEventObject = {};
				metadataEventObject.gFileId = eventObject.id;
				metadataEventObject.eventObjectTitle = eventObject.title;
				customObject.nonBusinessRequestEvents.push(metadataEventObject);
			}

			callback();
		}
	}

	function initializeBusinessResponseEvents(customObject, projectFolderFileId, callback){
		var objectsToGet = {
			persistentData: false,
			enum: false,
			snippet: false,
			event: true,
			flow: false
		};
		googleDriveUtils.getProjectObjects(projectFolderFileId, '', objectsToGet, onEventsLoaded);

		function onEventsLoaded(events){
			for (var i in events)
			{
				var eventObject = events[i];
				var metadataEventObject = {};
				metadataEventObject.gFileId = eventObject.id;
				metadataEventObject.eventObjectTitle = eventObject.title;
				metadataEventObject.responseForCounter = 0;
				customObject.businessResponseEvents.push(metadataEventObject);
			}

			callback();
		}
	}

	function initializeProjectObjectTitles(customObject, projectFolderFileId, callback){
		var objectsToGet = {
			persistentData: true,
			enum: true,
			snippet: true,
			event: true,
			flow: true
		};
		googleDriveUtils.getProjectObjects(projectFolderFileId, '', objectsToGet, onObjectsLoaded);

		function onObjectsLoaded(projectObjects){
			for (var i in projectObjects){
				var projectObject = projectObjects[i];
				var key = projectObject.id;
				var value = projectObject.title;
				customObject.projectObjectTitles.set(key, value);
			}

			callback();
		}
	}

	// PUBLIC
	this.isLatestObject = function(doc){
		var currentVersion = doc.getModel().getRoot().get(GCons.Object.VERSION);

		if (currentVersion == null)
		{
			doc.getModel().getRoot().set(GCons.Object.VERSION, 1);
		}

		return doc.version === latestVersion;
	}

	this.convertObjectToLatest = function(doc, objectType, projectFolderFileId, callback){
		var currentVersion = doc.getModel().getRoot().get(GCons.Object.VERSION);
		for (var i=currentVersion; i<versionConverters.length; i++){
			var versionConverter = versionConverters[i];

			if (i === versionConverters.length-1){
				versionConverter(doc, objectType, projectFolderFileId, callback, true);
			}
			else{
				versionConverter(doc, objectType, projectFolderFileId, null, false);
			}
		}
	}
}