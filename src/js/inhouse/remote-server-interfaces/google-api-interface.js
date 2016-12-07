var GDriveConstant = require('../constants/google-drive-constants.js');
var customObjects = require('./custom-objects.js');

function GoogleApiInterface()
{
	// //////// private members
	var shareClient;
	var user;
	var tokenRefreshInterval;

	// //////// public members
	this.userAuthorize = function(immediate, successCallback, failCallback)
	{
		var client_id = GDriveConstant.ClientId;
		var scope = [GDriveConstant.InstallScope, GDriveConstant.FileScope, GDriveConstant.OpenIdScope];
		var user_id = (user == null) ? null : user.id;

		gapi.load('auth:client,drive-realtime,drive-share', function() {
			console.log("Authorizing user with Google");
			shareClient = new gapi.drive.share.ShareClient(GDriveConstant.AppId);
			gapi.auth.authorize({
				immediate: immediate,
				client_id: client_id,
				user_id: user_id,
				scope: scope
			}, authorizationCallback);
		});

		// inner functions
		function authorizationCallback(authResult)
		{
			if (authResult && !authResult.error) {
				tokenRefreshInterval = setInterval(function() {
					refreshToken(function(authResult) {
						//console.log(authResult);
					})
				}, (45 * 60 * 1000)); //refresh token every 45 minutes as suggested by google

				// loading Google Drive sdk asynchronously
				gapi.client.load('drive', 'v3', function(){
					customObjects.registerCustomDataTypes();
					successCallback();
				});
			}
			else
			{
				failCallback();
			}
		}

		function refreshToken(refreshCallback) {
			gapi.auth.authorize({
				immediate: true,
				client_id: client_id,
				scope: scope
			}, function(authResult) {
				if (authResult && !authResult.error) {
					refreshCallback(authResult);
				} else {
					refreshToken(refreshCallback);
				}
			});
		}
	};

	this.getProjects = function(callback)
	{
		var request = gapi.client.drive.files.list({
			corpus : 'user',
			q : 'mimeType="' + GDriveConstant.MimeType.PROJECT + '" and trashed = false',
			fields : 'files(id,name,kind,mimeType,parents)'
		});

		request.execute(function(response){
			callback(response.files);
		});
	};

	this.getProjectById = function(projectId, callback)
	{
		var request = gapi.client.drive.files.get({
			'fileId': projectId
		});

		request.execute(function(project){
			callback(project);
		});
	};

	this.saveTitle = function(fileId, title)
	{
		var saveTitleRequest = gapi.client.drive.files.update({
			'fileId' : fileId,
			'resource' : {
				'name' : title
			}
		});

		saveTitleRequest.execute(function(){});
	};

	this.setMimeType = function(fileId, mimeType)
	{
		var saveTitleRequest = gapi.client.drive.files.update({
			'fileId' : fileId,
			'resource' : {
				'mimeType' : mimeType
			}
		});

		saveTitleRequest.execute();
	};

	this.getFilesByMimeType = function(mimeType, callback)
	{
		var request = gapi.client.drive.files.list({
			corpus : 'user',
			q : 'mimeType="' + mimeType + '"',
			fields : 'files(id,parents/id,name)'
		});

		request.execute(function(response){
			callback(response.files);
		});
	};

	this.getAllFilesInFolder = function(folderFileId, callback)
	{
		var request = gapi.client.drive.files.list({
			corpus : 'user',
			q : '"' + folderFileId + '" in parents',
			fields : 'files(id)'
		});

		request.execute(function(response){
			callback(response.files);
		});
	};

	this.getProjectObjects = function(query, callback)
	{
		// among the files in the project folder, find the one with properties key=type value=PROJECT_METADATA
		var request = gapi.client.drive.files.list({
			corpus : 'user',
			q : query,
			fields : 'files(id,description,name,properties)'
		});

		request.execute(function(response){
			callback(response.files);
		});
	};

	this.createNewFolder = function(folderCreationParams, callback) {
		var request = gapi.client.drive.files.insert({
			name: folderCreationParams.name,
			mimeType: folderCreationParams.mimeType,
		});

		request.execute(function(folder) {
			callback(folder);
		});
	};

	this.createNewFile = function(fileCreationParams, callback) {
		var parentId = {
			'id' : fileCreationParams.parentId
		};

		var request = gapi.client.drive.files.insert({
			name: fileCreationParams.name,
			description: fileCreationParams.description,
			mimeType: fileCreationParams.mimeType,
			parents: [parentId]	// google requires us to pass an array here
		});

		request.execute(function(file){
			callback(file);
		});
	};

	this.getFileMetadata = function(fileId, callback) {
		var request = gapi.client.drive.files.get({
		   'fileId': fileId
		});
		
		if (typeof callback === 'function') {
			request.execute(function(resp){
				callback(resp);
			});
		} else {
			request.execute(function(resp){
				console.log(JSON.stringify(resp));
			});
		}
	}
}

module.exports = new GoogleApiInterface();
