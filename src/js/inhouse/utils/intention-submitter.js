var IntentionType = require('../constants/intention-type.js');
var uniqueIdGenerator = require('./unique-id-generator.js');
var EventType = require('../constants/event-type.js');

function IntentionSubmitter()
{
	var functionIdsInUse = {};

	var intentionTypeEventTypeMap = {};
	// intentionTypeEventTypeMap[IntentionType.USER_LOG_IN] = EventType.App.RECEIVE_DATA_STREAM_PROFILE;

	function executeCallbackOnceOnResponse(eventType, callback)
	{
		var functionId = getUniqueId();
		var intentionId = functionId;
		subscribeToBulletEvent(eventType, functionId, callbackWrapper);
		function callbackWrapper(event)
		{
			if (event.intentionId === intentionId)
			{
				unsubscribeToBulletEvent(eventType, functionId);
				callback(event);
			}
		}

		return intentionId;
	}

	function subscribeToBulletEvent(eventType, functionId, callback)
	{
		Bullet.on(eventType, functionId, callback);
		functionIdsInUse[functionId] = null;
	}

	function unsubscribeToBulletEvent(eventType, functionId)
	{
		Bullet.off(eventType, functionId);
		delete functionIdsInUse[functionId];
	}

	function getUniqueId()
	{
		var generatedId;
		do
		{
			generatedId = uniqueIdGenerator.getId();
		}while(functionIdsInUse.hasOwnProperty(generatedId));

		return generatedId;
	}

	// //////// public members
	this.submit = function(type, payload, callback)
	{
		var intention = {};
		intention.type = type;
		intention.payload = payload;

		if (callback != null)
		{
			var intentionId = executeCallbackOnceOnResponse(intentionTypeEventTypeMap[type], callback);
			intention.payload.intentionId = intentionId;
		}

		Bullet.trigger(EventType.App.SUBMIT_INTENTION, intention);
	}
}

module.exports = new IntentionSubmitter();