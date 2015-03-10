var googleApiInterface = require('../remote-server-interfaces/google/google-api-interface.js');
var IntentionType = require('../constants/intention-type.js');
var EventType = require('../constants/event-type.js');

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
			var intention = {};
    		intention.type = IntentionType.RECEIVE_USER_LOG_IN;
    		intention.payload = {};
    		intention.payload.success = true;
    		Bullet.trigger(EventType.App.SUBMIT_INTENTION, intention);
		}

		function failCallback()
		{
			googleApiInterface.userAuthorize(false, successCallback, secondFailCallback);

			function secondFailCallback()
			{
				var intention = {};
				intention.type = IntentionType.RECEIVE_USER_LOG_IN;
				intention.payload = {};
				intention.payload.success = false;
				Bullet.trigger(EventType.App.SUBMIT_INTENTION, intention);
			}
		}
	}
}

module.exports = new UserService();