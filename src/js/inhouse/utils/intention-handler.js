var IntentionType = require('../constants/intention-type.js');
var userStore = require('../stores/user-store.js');
var userService = require('../services/user-service.js');
var EventType = require('../constants/event-type.js');

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
			Bullet.trigger(EventType.App.USER_LOGGED_IN);
		}
		else
		{
			Bullet.trigger(EventType.App.USER_LOGGED_OUT);
		}
	}

	// //////// public members
	this.submit = function(intention)
	{
		handlerMap[intention.type](intention.payload);
	}
	Bullet.on(EventType.App.SUBMIT_INTENTION, 'intention-handler.js>>submit', this.submit);
}

module.exports = new IntentionHandler();