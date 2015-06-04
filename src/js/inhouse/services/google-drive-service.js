var googleApiInterface = require('../remote-server-interfaces/google-api-interface.js');
var userStore = require('../stores/user-store.js');
var LocalStorageKey = require('../constants/local-storage-key.js');
var GCons = require('../constants/google-drive-constants.js');

function GoogleDriveService()
{
	// //////// private members
	var sortCompareByFileTitle = function(a,b){
		var titlsA=a.title.toLowerCase(), titleB=b.title.toLowerCase();
		if (titlsA < titleB) //sort string ascending
		{
			return -1;
		}
		else if (titlsA > titleB)
		{
			return 1;
		}
		else
		{
			return 0;
		}
	}

	// //////// public members
	this.getProjects = function(titleSearchString, callback)
	{
		googleApiInterface.getProjects(successCallback);

		function successCallback(projects)
		{
			var filteredProjects = [];
			if (titleSearchString != null && titleSearchString.length > 0)
			{
				for (var i in projects)
				{
					var projectTitle = projects[i].title;
					if (projectTitle.indexOf(titleSearchString) > -1)
					{
						filteredProjects.push(projects[i]);
					}
				}
			}
			else
			{
				filteredProjects = projects;
			}			

			filteredProjects.sort(sortCompareByFileTitle);
			callback(filteredProjects);
		}
	}

	this.saveProjectTitle = function(projectFileId, newTitle, parentFolderId)
	{
		googleApiInterface.saveTitle(projectFileId, newTitle);
		googleApiInterface.saveTitle(parentFolderId, newTitle);
	}

	this.getProjectObjects = function(projectFolderFileId, titleSearchString, includePersistentData, includeEnum, includeEvent, includeFlow, callback)
	{
		if (!includePersistentData && !includeEnum && !includeEvent && !includeFlow)
		{
			return [];
		}
		else
		{
			var query = buildQuery(projectFolderFileId, includePersistentData, includeEnum, includeEvent, includeFlow);
			googleApiInterface.getProjectObjects(query, callbackWrapper);

			function callbackWrapper(projectObjects)
			{
				var filteredProjectObjects = filterObjectsByTitle(projectObjects, titleSearchString);
				filteredProjectObjects.sort(sortCompareByFileTitle);
				callback(filteredProjectObjects);
			}

			function filterObjectsByTitle(projectObjects, titleSearchString)
			{
				var filteredProjectObjects = [];
				for (var i in projectObjects)
				{
					if (projectObjects[i].title.indexOf(titleSearchString) > -1)
					{
						filteredProjectObjects.push(projectObjects[i]);
					}
				}
				return filteredProjectObjects;
			}
		}
		
		function buildQuery(projectFolderFileId, includePersistentData, includeEnum, includeEvent, includeFlow)
		{
			// we are doing fullText contains search because at the time of writing this code,
			// google drive api had bugs in custom properties query. So we are relying on having the object types
			// right in the file's description and doing fullText search provided by Google to query the files accordingly
			var query = '"' + projectFolderFileId + '" in parents and (';
			var isFirstCondition = true;

			// add persistent data query
			if (includePersistentData)
			{
				query += 'fullText contains "' + GCons.ObjectType.PERSISTENT_DATA + '"';
				isFirstCondition = false;
			}

			// add enum query
			if (includeEnum)
			{
				if (!isFirstCondition)
				{
					query += ' or ';
					isFirstCondition = false;
				}
				query += 'fullText contains "' + GCons.ObjectType.ENUM + '"';
			}

			// add event query
			if (includeEvent)
			{
				if (!isFirstCondition)
				{
					query += ' or ';
					isFirstCondition = false;
				}
				query += 'fullText contains "' + GCons.ObjectType.EVENT + '"';
			}

			// add flow query
			if (includeFlow)
			{
				if (!isFirstCondition)
				{
					query += ' or ';
					isFirstCondition = false;
				}
				query += 'fullText contains "' + GCons.ObjectType.FLOW + '"';
			}

			query += ') and trashed = false'; //do not list entries in the trash folder

			return query;
		}
	}

	this.createNewProject = function(callback) {
		folderCreationParams={};
		folderCreationParams.title='New F1 Project';
		folderCreationParams.mimeType=GCons.MimeType.FOLDER;
		googleApiInterface.createNewFolder(folderCreationParams, createNewF1Metadata);

		function createNewF1Metadata(folder) {
			fileCreationParams={};
			fileCreationParams.title=folder.title;
			fileCreationParams.description=GCons.ObjectType.PROJECT_METADATA;
			fileCreationParams.parentId=folder.id;
			fileCreationParams.mimeType=GCons.MimeType.PROJECT;
			googleApiInterface.createNewFile(fileCreationParams, callback)
		}
	}

	this.createNewPersistentData = function(parentFolderId, callback) {
		fileCreationParams={};
		fileCreationParams.title='New Persistent Data';
		fileCreationParams.description=GCons.ObjectType.PERSISTENT_DATA;
		fileCreationParams.parentId=parentFolderId;
		fileCreationParams.mimeType=GCons.MimeType.DMX;
		googleApiInterface.createNewFile(fileCreationParams, callback);
	}

	this.getPersistentDataModel = function()
	{
		return googleApiInterface.PersistentDataModel;
	}
}

module.exports = new GoogleDriveService();