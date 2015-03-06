var IntentionType = require('./intention-type.js');
var AppConfig = require('./app-config.js');
var Constants = require('./google-drive-constants.js');

function GoogleApiInterface()
{
	// //////// private members
	var shareClient;
	var user;

	function createF1StudioFolderIfNotExist()
	{
		/*
		var request = gapi.client.drive.files.list({
			corpus : 'DOMAIN',
			q : 'mimeType="application/vnd.google-apps.folder" and title="' + Constants.F1_STUDIO_FOLDER_NAME + '"',
			fields : 'items/title'
		});

		request.execute(function(response){
			if (response.items.length < 1)
			{
				gapi.client.drive.files.insert({

				})
			}
		});
		*/
	}

	function getFolder = function()
	{

	}

	// //////// public members
	this.userAuthorize = function(immeidate, successCallback, failCallback)
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
}

module.exports = new GoogleApiInterface();