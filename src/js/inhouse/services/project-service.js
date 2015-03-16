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
	this.getProjects = function(intentionId)
	{
		googleApiInterface.getProjects(successCallback);

		function successCallback(projects)
		{
			var intentionPayload = {};
			intentionPayload.intentionId = intentionId;
			intentionPayload.projects = projects;
			intentionSubmitter.submit(IntentionType.RECEIVE_GET_PROJECTS, intentionPayload);
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