var IntentionType = require('./intention-type.js');
var AppConfig = require('./app-config.js');

function GoogleApiInterface()
{
	// //////// private members
	var shareClient;
	var user;

	// //////// public members
	this.userAuthorize = function()
	{
		gapi.load('auth:client,drive-realtime,drive-share', function() {
	        console.log("Authorizing user with Google");
	        shareClient = new gapi.drive.share.ShareClient(AppConfig.GoogleApi.AppId);
	        gapi.auth.authorize({
	            client_id: AppConfig.GoogleApi.ClientId,
	            scope: [AppConfig.GoogleApi.InstallScope, 
	            		AppConfig.GoogleApi.FileScope,
	            		AppConfig.GoogleApi.OpenIdScope],
	            user_id: user == null ? null : user.id,
	            immediate: false
	        }, authorizationCallback);
	    });

	    // inner functions
	    function authorizationCallback(authResult)
	    {
	    	if (authResult && !authResult.error)
	    	{
	    		var intention = {};
	    		intention.type = IntentionType.RECEIVE_USER_LOG_IN;
	    		Bullet.trigger('App>>intention-submitted', intention);
	    	}
	    }
	}
}

module.exports = new GoogleApiInterface();