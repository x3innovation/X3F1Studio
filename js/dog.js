"use strict";

var dog = dog || {};

dog.INSTALL_SCOPE = 'https://www.googleapis.com/auth/drive.install';
dog.FILE_SCOPE = 'https://www.googleapis.com/auth/drive';
dog.OPENID_SCOPE = 'openid';
dog.shareClient = null;

dog.authorize = function(showPopup, onAuthResult) {
    console.log("in authorize()");
    gapi.load('auth:client,drive-realtime,drive-share', function() {
        console.log("in authorize() :: gapi.load()");
        dog.shareClient = new gapi.drive.share.ShareClient(ball.APP_ID);
        gapi.auth.authorize({
            client_id: ball.CLIENT_ID,
            scope: [dog.INSTALL_SCOPE, dog.FILE_SCOPE, dog.OPENID_SCOPE],
            user_id: ball.user == null ? null : ball.user.id,
            immediate: !showPopup
        }, onAuthResult);
    });
};

dog.handleErrors = function(e) {
    if (e.type == gapi.drive.realtime.ErrorType.TOKEN_REFRESH_REQUIRED) {
        dog.authorize(false, function() {//callback
        });
    } else if (e.type == gapi.drive.realtime.ErrorType.CLIENT_ERROR) {
        alert("An Error happened: " + e.message);
        window.location.href = "/";
    } else if (e.type == gapi.drive.realtime.ErrorType.NOT_FOUND) {
        alert("The file was not found. It does not exist or you do not have read access to the file.");
        window.location.href = "/";
    }
};

/**
 * Get the user object using the UserInfo API and save it to ball.user.
 *
 * callback is optional.
 */
dog.getUser = function(callback) {
    console.log("in getUser()");
    gapi.client.load('oauth2', 'v2', function() {
        gapi.client.oauth2.userinfo.get().execute(function(resp) {
            callback(resp);
        });
    });
};

/**
 * Get the parent folder.
 *
 * fileId
 * callback is optional.
 */
dog.getParentFolder = function(fileId, callback) {
    console.log("in getParentFolder()");
    gapi.client.load('drive', 'v2', function() {
        var request = gapi.client.drive.files.get({
            'fileId': fileId
        });
        request.execute(function(resp) {
            if (resp && resp.parents) {
                callback(resp.parents[0]);
            } else {
                callback();
            }
        });
    });
};

/**
 * Creates a new Realtime file.
 * @param title {string} title of the newly created file.
 * @param parents {string} the parent folder.
 * @param mimeType {string} the MIME type of the new file.
 * @param callback {Function} the callback to call after creation.
 */
dog.createFile = function(title, parents, mimeType, callback) {
    console.log("in dog.createFile()");
    gapi.client.load('drive', 'v2', function() {
        gapi.client.drive.files.insert({
            'resource': {
                mimeType: mimeType,
                title: title,
                parents: parents
            }
        }).execute(callback);
    });
};

/**
 * Creates a new folder.
 * @param title {string} title of the newly created folder.
 * @param callback {Function} the callback to call after creation.
 */
dog.createFolder = function(title, parents, callback) {
    console.log("in dog.createFolder()");
    gapi.client.load('drive', 'v2', function() {
        gapi.client.drive.files.insert({
            'resource': {
                mimeType: 'application/vnd.google-apps.folder',
                title: title,
                //parents : parents
            }
        }).execute(callback);
    });
};

dog.getFiles = function(folderId, mimeTypes, callback) {
    console.log("in getFiles(" + folderId + ", " + mimeTypes + ", callback)");

    var mimeTypeString;
    if (typeof mimeTypes === 'string') {
        mimeTypeString = mimeTypes;
    } else {
        mimeTypeString = mimeTypes.join('\' or mimeType = \'');
    }

    gapi.client.load('drive', 'v2', function() {
        var request = gapi.client.request({
            'path': '/drive/v2/files/' + folderId + '/children',
            'method': 'GET',
            'params': {
                'maxResults': '1000',
                'q': "( mimeType = '" + mimeTypeString + "') and trashed = false"
            }
        });

        request.execute(function(resp) {
            console.log("Got " + resp.items.length + " files.");
            if (resp.items.length == 0) {
                callback(null, 0);
            }
            for (var i = 0; i < resp.items.length; i++) {
                var request = gapi.client.drive.files.get({
                    'fileId': resp.items[i].id
                });
                request.execute(function(resp1) {
                    callback(resp1, resp.items.length);
                });
            }
        });
    });
};

dog.getFolder = function(folderId, callback) {
    console.log("in getFolder()");

    gapi.client.load('drive', 'v2', function() {
        var request = gapi.client.request({
            'path': '/drive/v2/files/' + folderId,
            'method': 'GET'
        });

        request.execute(callback);
    });
};

dog.getFile = function(fileId, callback) {
    gapi.client.load('drive', 'v2', function() {
        var request = gapi.client.drive.files.get({
            'fileId': fileId
        });
        request.execute(callback);
    });
};

dog.renameFile = function(fileId, newName, callback) {
    console.log("in renameFile()");

    var renameRequest = gapi.client.drive.files.patch({
        'fileId': fileId,
        'resource': {
            'title': newName
        }
    });

    renameRequest.execute(callback);
};

// Opens the Google Picker.
dog.popupOpen = function(mimeType, callback) {
    var token = gapi.auth.getToken().access_token;
    var view = new google.picker.View(google.picker.ViewId.DOCS);
    view.setMimeTypes(mimeType);
    var picker = new google.picker.PickerBuilder().enableFeature(google.picker.Feature.NAV_HIDDEN).setAppId(ball.APP_ID).setOAuthToken(token).addView(view).addView(new google.picker.DocsUploadView()).setCallback(callback).build();
    picker.setVisible(true);
};

// Popups the Sharing dialog.
dog.popupShare = function(id) {
    var origin = window.location.protocol + '//' + window.location.host;
    dog.shareClient.setItemIds([id]);
    dog.shareClient.showSettingsDialog();
};

dog.loadParamsToBall = function(onLoaded) {
    var getProjectFolder = function(callback) {
        dog.getParentFolder(cat.anchorParams.projectFileId, function(folder) {
            if (folder && folder.id) {
                ball.projectFolder = folder;
            }
            callback();
        });
    };

    var getProjectFile = function(callback) {
        dog.getFile(cat.anchorParams.projectFileId, function(resp) {
            if (resp && resp.id) {
                ball.projectFile = resp;
            }
            callback();
        });
    };

    var getUser = function(callback) {
        dog.getUser(function(resp) {
            ball.user = resp;
            callback();
        });
    };

    getProjectFile(function() {
        getProjectFolder(function() {
            getUser(function() {
                onLoaded();
            });
        });
    });
};
