var googleApiInterface = require('../remote-server-interfaces/google-api-interface.js');
var IntentionType = require('../constants/intention-type.js');
var EventType = require('../constants/event-type.js');
var userStore = require('../stores/user-store.js');
var Constant = require('../constants/constant.js');
var intentionSubmitter = require('../utils/intention-submitter.js');

function UserService()
{
	// //////// private members

	// //////// public members
	this.getProjects = function(titleSearchString, intentionId)
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

			var intentionPayload = {};
			intentionPayload.intentionId = intentionId;
			intentionPayload.projects = filteredProjects;
			intentionSubmitter.submit(IntentionType.RECEIVE_GET_PROJECTS, intentionPayload);

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

	this.logIn = function()
	{
		googleApiInterface.userAuthorize(true, successCallback, failCallback);

		// inner functions
		function successCallback()
		{
			userStore.isLoggedIn = true;
			store.set(Constant.HAS_USER_PREVIOUSLY_LOGGED_IN, 'true');

    		var intentionPayload = {};
    		intentionPayload.success = true;
    		intentionSubmitter.submit(IntentionType.RECEIVE_USER_LOG_IN, intentionPayload);
		}

		function failCallback()
		{
			googleApiInterface.userAuthorize(false, successCallback, secondFailCallback);

			function secondFailCallback()
			{
				store.remove(Constant.HAS_USER_PREVIOUSLY_LOGGED_IN);

				var intentionPayload = {};
				intentionPayload.success = false;
				intentionSubmitter.submit(IntentionType.RECEIVE_USER_LOG_IN, intentionPayload);
			}
		}
	}
}

module.exports = new UserService();