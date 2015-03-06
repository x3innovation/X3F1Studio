var googleApiInterface = require('./google-api-interface.js');
var IntentionType = require('./intention-type.js');

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
    		Bullet.trigger('App>>intention-submitted', intention);
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
				Bullet.trigger('App>>intention-submitted', intention);
			}
		}
	}
}

module.exports = new UserService();