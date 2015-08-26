var googleApiInterface = require('../remote-server-interfaces/google-api-interface.js');
var userStore = require('../stores/user-store.js');
var LocalStorageKey = require('../constants/local-storage-key.js');
var GCons = require('../constants/google-drive-constants.js');
var DefaultCons = require('../constants/default-value-constants.js');
var AnnouncementType = require('../constants/announcement-type.js');

function GoogleDriveService()
{
	// //////// private members
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

	this.getMetadataModel = function(fileId, callback) {
	    var metadataModel;

	    var initializeMetadataModel = function(model) {
	        var field = model.create(GCons.CustomObjectKey.PROJECT_METADATA);
	        field.announcement = model.createList();
	        field.nextId = 0;
	        field.version = 1;
	        model.getRoot().set(GCons.CustomObjectKey.PROJECT_METADATA, field);
	    };

	    var onMetadataFileLoaded = function(doc) {
	        metadataModel = doc.getModel().getRoot().get(GCons.CustomObjectKey.PROJECT_METADATA);
	        if (metadataModel == null) {
	        	initializeMetadataModel(doc.getModel());
	        	onMetadataFileLoaded(doc);
	        }
	        else {
	        	updateMetadataModel(metadataModel);//if not properly initialized, update it
	        	callback(metadataModel);
	    	}
	    };

	    gapi.drive.realtime.load(fileId, onMetadataFileLoaded, initializeMetadataModel);
	};

	this.getMetadataModelId = function(projectFileId, callback, step) {
	    if (typeof step == 'undefined') {
	    	step = 1;
	    }
	    this.getMetadataModel(projectFileId, function(metadataModel) {
	        if (typeof metadataModel.nextId == 'undefined') {
	            metadataModel.nextId = 0;
	        }
	        var thisId = metadataModel.nextId;
	        metadataModel.nextId = metadataModel.nextId+step;
	        callback(thisId);
		});
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
			var query = '"' + projectFolderFileId + '" in parents and (';
			var isFirstCondition = true;

			// add persistent data query
			if (objectsToGet.persistentData)
			{	
				if (!isFirstCondition)
				{
					query += ' or ';
				}
				query += 'fullText contains "' + GCons.ObjectType.PERSISTENT_DATA + '"';
				isFirstCondition = false;
			}

			// add enum query
			if (objectsToGet.enum)
			{
				if (!isFirstCondition)
				{
					query += ' or ';
				}
				query += 'fullText contains "' + GCons.ObjectType.ENUM + '"';
				isFirstCondition = false;
			}

			// add snippet query
			if (objectsToGet.snippet)
			{
				if (!isFirstCondition)
				{
					query += ' or ';
				}
				query += 'fullText contains "' + GCons.ObjectType.SNIPPET + '"';
				isFirstCondition = false;
			}

			// add event query
			if (objectsToGet.event)
			{
				if (!isFirstCondition)
				{
					query += ' or ';
				}
				query += 'fullText contains "' + GCons.ObjectType.EVENT + '"';
				isFirstCondition = false;
			}

			// add flow query
			if (objectsToGet.flow)
			{
				if (!isFirstCondition)
				{
					query += ' or ';
				}
				query += 'fullText contains "' + GCons.ObjectType.FLOW + '"';
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
}

module.exports = new GoogleDriveService();