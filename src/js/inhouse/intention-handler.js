var IntentionType = require('./intention-type.js');
var userStore = require('./user-store.js');
var userService = require('./user-service.js');

function IntentionHandler()
{
	// //////// private members
	var handlerMap = {};
	handlerMap[IntentionType.USER_LOG_IN] = handleUserLogIn;
	handlerMap[IntentionType.RECEIVE_USER_LOG_IN] = handleReceiveUserLogIn;

	function handleUserLogIn(intentionPayload)
	{
		userService.logIn();
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
			Bullet.trigger('App>>user-log-in-fail');
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