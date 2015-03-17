var IntentionType = require('../constants/intention-type.js');
var userService = require('../services/user-service.js');
var EventType = require('../constants/event-type.js');
var projectService = require('../services/project-service.js');

function IntentionHandler()
{
	// //////// private members
	var handlerMap = {};
	handlerMap[IntentionType.USER_LOG_IN] = handleUserLogIn;
	handlerMap[IntentionType.RECEIVE_USER_LOG_IN] = handleReceiveUserLogIn;
	handlerMap[IntentionType.GET_PROJECTS] = handleGetProjects;
	handlerMap[IntentionType.RECEIVE_GET_PROJECTS] = handleReceiveGetProjects;

	function handleUserLogIn(intentionPayload)
	{
		userService.logIn();
	}

	function handleReceiveUserLogIn(intentionPayload)
	{
		if (intentionPayload.success)
		{
			Bullet.trigger(EventType.App.USER_LOGGED_IN);
		}
		else
		{
			Bullet.trigger(EventType.App.USER_LOG_IN_FAIL);
		}
	}

	function handleGetProjects(intentionPayload)
	{
		projectService.getProjects(intentionPayload.titleSearchString, intentionPayload.intentionId);
	}

	function handleReceiveGetProjects(intentionPayload)
	{
		Bullet.trigger(EventType.Projects.RECEIVE_GET_PROJECTS, intentionPayload);
	}

	// //////// public members
	this.submit = function(intention)
	{
		handlerMap[intention.type](intention.payload);
	}
	Bullet.on(EventType.App.SUBMIT_INTENTION, 'intention-handler.js>>submit', this.submit);
}

module.exports = new IntentionHandler();