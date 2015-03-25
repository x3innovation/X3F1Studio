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

	this.getProjects = function(callback)
	{
		var request = gapi.client.drive.files.list({
			corpus : 'DEFAULT',
			q : 'mimeType="' + GapiConstants.MimeType.PROJECT + '"',
			fields : 'items(id,parents/id,title)'
		});

		request.execute(function(response){
			callback(response.items);
		});
	}

	this.saveTitle = function(fileId, title)
	{
		var saveTitleRequest = gapi.client.drive.files.patch({
            'fileId' : fileId,
            'resource' : {
                'title' : title
            }
        });

        saveTitleRequest.execute();
	}

	this.setMimeType = function(fileId, mimeType)
	{
		var saveTitleRequest = gapi.client.drive.files.patch({
            'fileId' : fileId,
            'resource' : {
                'mimeType' : mimeType
            }
        });

        saveTitleRequest.execute();
	}

	this.getMimeTypeFiles = function(mimeType, callback)
	{
		var request = gapi.client.drive.files.list({
			corpus : 'DEFAULT',
			q : 'mimeType="' + mimeType + '"',
			fields : 'items(id,parents/id,title)'
		});

		request.execute(function(response){
			callback(response.items);
		});
	}

	this.getAllFilesInFolder = function(folderFileId, callback)
	{
		var request = gapi.client.drive.files.list({
			corpus : 'DEFAULT',
			q : '"' + folderFileId + '" in parents',
			fields : 'items(id)'
		});

		request.execute(function(response){
			callback(response.items);
		});
	}

	this.getProjectObjects = function(query, callback)
	{
		// among the files in the project folder, find the one with properties key=type value=PROJECT_METADATA
		var request = gapi.client.drive.files.list({
			corpus : 'DEFAULT',
			q : query,
			fields : 'items(id,description,title,properties)'
		});

		request.execute(function(response){
			callback(response.items);
		});
	}
}

module.exports = new GoogleApiInterface();