var IntentionType = require('./intention-type.js');
var googleApiInterface = require('./google-api-interface.js');
var userStore = require('./user-store.js');

function IntentionHandler()
{
	// //////// private members
	var handlerMap = {};
	handlerMap[IntentionType.USER_LOG_IN] = handleUserLogIn;
	handlerMap[IntentionType.RECEIVE_USER_LOG_IN] = handleReceiveUserLogIn;

	function handleUserLogIn(intentionPayload)
	{
		googleApiInterface.userAuthorize(true);
	}

	function handleReceiveUserLogIn(intentionPayload)
	{
		if (intentionPayload.success)
		{
			userStore.isLoggedIn = true;
			Bullet.trigger('App>>user-logged-in');
		}
		else
		{
			// once immediate authorization fails, do non immediate to bring up log in screen
			googleApiInterface.userAuthorize(false);
		}
	}

	// //////// public members
	this.submit = function(intention)
	{
		handlerMap[intention.type](intention.payload);
	}
	Bullet.on('App>>intention-submitted', 'intention-handler.js>>submit', this.submit);
}

module.exports = new IntentionHandler();