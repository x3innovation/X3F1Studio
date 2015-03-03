var IntentionType = require('./intention-type.js');

function IntentionHandler()
{
	// //////// private members
	var handlerMap = {};
	handlerMap[IntentionType.USER_LOG_IN] = handleUserLogIn;

	function handleUserLogIn(intentionPayload)
	{
		var authNetwork = intentionPayload.authNetwork;

		if (authNetwork === 'google')
		{
			toastr.info("Sorry... still working on it. Please use Facebook instead ^_^;", "Google+ Log In");
		}
		else
		{
			hello(authNetwork).login.bind(hello(authNetwork))();
		}		
	}

	// //////// public members
	this.submit = function(intention)
	{
		handlerMap[intention.type](intention.payload);
	}
	Bullet.on("App>>intention-submitted", 'intention-handler.js>>submit', this.submit);
}

module.exports = new IntentionHandler();