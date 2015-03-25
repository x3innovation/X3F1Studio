var googleApiInterface = require('../remote-server-interfaces/google-api-interface.js');
var userStore = require('../stores/user-store.js');
var Constant = require('../constants/constant.js');
var GoogleDriveConstant = require('../constants/google-drive-constants.js');

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

	this.saveProjectTitle = function(projectFileId, newTitle, parentFileId)
	{
		googleApiInterface.saveTitle(projectFileId, newTitle);
		googleApiInterface.saveTitle(parentFileId, newTitle);
	}

	this.getProjectObjects = function(projectFolderFileId, titleSearchString, includePersistentData, includeEnum, includeEvent, includeFlow, callback)
	{
		if (!includePersistentData && !includeEnum && !includeEvent && !includeFlow)
		{
			console.log("Not including any object types.");	
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
				query += 'fullText contains "' + GoogleDriveConstant.ObjectType.PERSISTENT_DATA + '"';
				isFirstCondition = false;
			}

			// add enum query
			if (includeEnum)
			{
				if (!isFirstCondition)
				{
					query += ' or ';
				}
				query += 'fullText contains "' + GoogleDriveConstant.ObjectType.ENUM + '"';
				isFirstCondition = false;
			}

			// add event query
			if (includeEvent)
			{
				if (!isFirstCondition)
				{
					query += ' or ';
				}
				query += 'fullText contains "' + GoogleDriveConstant.ObjectType.EVENT + '"';
				isFirstCondition = false;
			}

			// add flow query
			if (includeFlow)
			{
				if (!isFirstCondition)
				{
					query += ' or ';
				}
				query += 'fullText contains "' + GoogleDriveConstant.ObjectType.FLOW + '"';
				isFirstCondition = false;
			}

			query += ')';

			return query;
		}
	}
}

module.exports = new GoogleDriveService();