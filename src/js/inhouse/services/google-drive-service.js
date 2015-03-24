var googleApiInterface = require('../remote-server-interfaces/google-api-interface.js');
var userStore = require('../stores/user-store.js');
var Constant = require('../constants/constant.js');

function GoogleDriveService()
{
	// //////// private members
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

			filteredProjects.sort(projectsSortCompare);
			callback(filteredProjects);

			function projectsSortCompare(a,b){
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
		}
	}

	this.saveProjectTitle = function(projectFileId, newTitle, parentFileId)
	{
		googleApiInterface.saveTitle(projectFileId, newTitle);
		googleApiInterface.saveTitle(parentFileId, newTitle);
	}

	this.getProjectObjects = function(projectFolderFileId, titleSearchString, includeEnum, includeEvent, includeFlow, includePersistentData, callback)
	{
		
	}
}

module.exports = new GoogleDriveService();