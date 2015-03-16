var IntentionType = require('../constants/intention-type.js');
var GapiConstants = require('../constants/google-drive-constants.js');

function GoogleApiInterface()
{
	// //////// private members
	var shareClient;
	var user;

	// //////// public members
	this.userAuthorize = function(immeidate, successCallback, failCallback)
	{
		gapi.load('auth:client,drive-realtime,drive-share', function() {
	        console.log("Authorizing user with Google");
	        shareClient = new gapi.drive.share.ShareClient(GapiConstants.AppId);
	        gapi.auth.authorize({
	            client_id: GapiConstants.ClientId,
	            scope: [GapiConstants.InstallScope, 
	            		GapiConstants.FileScope,
	            		GapiConstants.OpenIdScope],
	            user_id: user == null ? null : user.id,
	            immediate: immeidate
	        }, authorizationCallback);
	    });

	    // inner functions
	    function authorizationCallback(authResult)
	    {
	    	if (authResult && !authResult.error)
	    	{
	    		// loading Google Drive sdk asynchronously
	    		gapi.client.load('drive', 'v2', function(){
	    			successCallback();
	    		});	    		
	    	}
	    	else
	    	{
	    		failCallback();
	    	}
	    }
	}

	this.getProjects = function(successCallback)
	{
		var request = gapi.client.drive.files.list({
			corpus : 'DOMAIN',
			q : 'mimeType="' + GapiConstants.PROJECT_MIMETYPE + '"',
			fields : 'items(id,title)'
		});

		request.execute(function(response){
			successCallback(response.items);
		});
	}
}

module.exports = new GoogleApiInterface();