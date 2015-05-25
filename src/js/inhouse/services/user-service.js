var googleApiInterface = require('../remote-server-interfaces/google-api-interface.js');
var EventType = require('../constants/event-type.js');
var userStore = require('../stores/user-store.js');
var LocalStorageKey = require('../constants/local-storage-key.js');

function UserService()
{
	// //////// private members

	// //////// public members
	this.logIn = function()
	{
		googleApiInterface.userAuthorize(true, successCallback, failCallback);

		// inner functions
		function successCallback()
		{
			userStore.isLoggedIn = true;
			store.set(LocalStorageKey.HAS_USER_PREVIOUSLY_LOGGED_IN, 'true');
			Bullet.trigger(EventType.App.USER_LOGGED_IN);
		}

		function failCallback()
		{
			googleApiInterface.userAuthorize(false, successCallback, secondFailCallback);

			function secondFailCallback()
			{
				store.remove(LocalStorageKey.HAS_USER_PREVIOUSLY_LOGGED_IN);
				Bullet.trigger(EventType.App.USER_LOG_IN_FAIL);
			}
		}
	}
}

module.exports = new UserService();