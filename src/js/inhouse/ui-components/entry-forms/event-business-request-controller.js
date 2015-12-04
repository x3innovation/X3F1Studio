function EventBusinessRequestController(gMetadataModel, gMetadataCustomObject, gFileCustomObject, projectFolderFileId, gFileId)
{
	// //////// private members
	var googleDriveUtils = require('../../utils/google-drive-utils.js');
	var GDriveConstants = require('../../constants/google-drive-constants.js');
	var Configs = require('../../app-config.js');

	var gMetadataModel = gMetadataModel;
	var gMetadataCustomObject = gMetadataCustomObject;
	var gFileCustomObject = gFileCustomObject;
	var projectFolderFileId = projectFolderFileId;
	var gFileId = gFileId;
	var id = gFileCustomObject.id;

	var loadedGoogleDocs = {};

	function loadGoogleDoc (fileId, objectType, callback){
		if (loadedGoogleDocs.hasOwnProperty(fileId)){
			callback(loadedGoogleDocs[fileId]);
		}
		else{
			googleDriveUtils.loadDriveFileDoc(fileId, objectType, callback);
		}
	}

	// //////// public members
	this.getResponseEligibleEventsTitles = function(callback){
		var titles = [];
		for (var i=0; i<gMetadataCustomObject.nonBusinessRequestEvents.length; ++i)
		{
			var eventObject = gMetadataCustomObject.nonBusinessRequestEvents.get(i);
			if (eventObject.gFileId != gFileId){
				titles.push(eventObject.eventObjectTitle);
			}
		}

		callback(titles);
	}

	this.isBusinessRequest = function(){
		return gFileCustomObject.isBusinessRequest;
	}

	this.setAsBusinessRequest = function(){
		gFileCustomObject.isBusinessRequest = true;

		// create new metadata business request event custom object
		var metadataEventModel = googleDriveUtils.createMetadataEvent(gFileId, gFileCustomObject.title.text, gFileCustomObject.id);

		// add to business requests in metadata
		gMetadataCustomObject.businessRequestEvents.push(metadataEventModel);

		// remove from non business request in metadata
		for (var i =0 ; i<gMetadataCustomObject.nonBusinessRequestEvents.length; ++i){
			var eventModel = gMetadataCustomObject.nonBusinessRequestEvents.get(i);
			if (eventModel.gFileId === gFileId)
			{
				gMetadataCustomObject.nonBusinessRequestEvents.remove(i);
				break;
			}
		}

		// remove from correspondingBusinessResponses in all other business request events
		for (var i =0 ; i<gMetadataCustomObject.businessRequestEvents.length; ++i){
			var eventModel = gMetadataCustomObject.businessRequestEvents.get(i);
			gapi.drive.realtime.load(eventModel.gFileId, onBusinessRequestDocLoaded, null);
		}

		function onBusinessRequestDocLoaded(doc){
			var customObjectKey = GDriveConstants.CustomObjectKey.EVENT;
			var customObject = doc.getModel().getRoot().get(customObjectKey);

			// find current event and remove from business response
			var index = customObject.correspondingBusinessResponses.indexOf(gFileId);
			if (index >= 0){			
				customObject.correspondingBusinessResponses.remove(index);
			}

			// closing the doc too soon throws an exception from Google
			setTimeout(function(){
				doc.close();
			}, Configs.GoogleDocCloseInterval);
		}

		// reset business response for counter in metadata
		for (var i =0 ; i<gMetadataCustomObject.businessResponseEvents.length; ++i){
			var eventModel = gMetadataCustomObject.businessResponseEvents.get(i);
			if (eventModel.gFileId === gFileId)
			{
				var metadataEventModel = googleDriveUtils.createMetadataEvent(gFileId, eventModel.eventObjectTitle, gFileCustomObject.id);
				metadataEventModel.responseForCounter = 0;
				gMetadataCustomObject.businessResponseEvents.set(i, metadataEventModel);
				break;
			}
		}
	}

	this.setAsNonBusinessRequest = function(){
		gFileCustomObject.isBusinessRequest = false;
		gFileCustomObject.correspondingBusinessResponses.clear();

		// create new metadata business request event custom object
		var metadataEventModel = googleDriveUtils.createMetadataEvent(gFileId, gFileCustomObject.title.text, gFileCustomObject.id);

		// add to business requests in metadata
		gMetadataCustomObject.nonBusinessRequestEvents.push(metadataEventModel);

		// remove from non business request in metadata
		for (var i =0 ; i<gMetadataCustomObject.businessRequestEvents.length; ++i){
			var eventModel = gMetadataCustomObject.businessRequestEvents.get(i);
			if (eventModel.eventObjectId === gFileId)
			{
				gMetadataCustomObject.businessRequestEvents.remove(i);
				break;
			}
		}
	}

	this.addBusinessResponse = function(eventName){
		var gFileId = googleDriveUtils.getGoogleFileIdForEventName(gMetadataCustomObject, eventName);
		var index = gFileCustomObject.correspondingBusinessResponses.indexOf(gFileId);
		if (index < 0){			
			gFileCustomObject.correspondingBusinessResponses.push(gFileId);
		}

		// increment business response for counter in metadata
        gapi.drive.realtime.load(gFileId, onBusinessResponseDocLoaded, null);

		function onBusinessResponseDocLoaded(doc){
			var customObjectKey = GDriveConstants.CustomObjectKey.EVENT;
			var customObject = doc.getModel().getRoot().get(customObjectKey);
            var typeId = customObject.id;

            // find business response from metadata and update the event model
            var metadataEventModel = googleDriveUtils.createMetadataEvent(gFileId, customObject.title.text, typeId);
            var isFoundAndUpdated = false;
            for (var i =0 ; i<gMetadataCustomObject.businessResponseEvents.length; ++i){
                var eventModel = gMetadataCustomObject.businessResponseEvents.get(i);
                if (eventModel.gFileId === gFileId)
                {
                    metadataEventModel.responseForCounter = eventModel.responseForCounter + 1;
                    gMetadataCustomObject.businessResponseEvents.set(i, metadataEventModel);
                    isFoundAndUpdated = true;
                    break;
                }
            }

			if (!isFoundAndUpdated){
                metadataEventModel.responseForCounter = 1;
                gMetadataCustomObject.businessResponseEvents.push(metadataEventModel);
            }

			// closing the doc too soon throws an exception from Google
			setTimeout(function(){
				doc.close();
			}, Configs.GoogleDocCloseInterval);
		}
	}

	this.removeBusinessResponse = function(eventName){
		var gFileId = googleDriveUtils.getGoogleFileIdForEventName(gMetadataCustomObject, eventName);
		var index = gFileCustomObject.correspondingBusinessResponses.indexOf(gFileId);
		gFileCustomObject.correspondingBusinessResponses.remove(index);

		// decrement business response for counter in metadata
		for (var i =0 ; i<gMetadataCustomObject.businessResponseEvents.length; ++i){
			var eventModel = gMetadataCustomObject.businessResponseEvents.get(i);
			if (eventModel.gFileId === gFileId)
			{
				var metadataEventModel = googleDriveUtils.createMetadataEvent(gFileId, eventModel.eventObjectTitle, eventModel.eventTypeId);
				metadataEventModel.responseForCounter = eventModel.responseForCounter - 1;
				if (metadataEventModel.responseForCounter < 0){
					metadataEventModel.responseForCounter = 0;
				}
				gMetadataCustomObject.businessResponseEvents.set(i, metadataEventModel);
				break;
			}
		}
	}

	this.getBusinessResponses = function(){
		var responseGoogleFileIds = gFileCustomObject.correspondingBusinessResponses.asArray();
		var titles = googleDriveUtils.getEventNameForGoogleFileIds(gMetadataCustomObject, responseGoogleFileIds);
		return titles;
	}

	this.removeAllBusinessResponses = function(){
		gFileCustomObject.isBusinessRequest = false;
		gFileCustomObject.correspondingBusinessResponses.clear();
	}

	this.dispose = function(){
		for (var fileId in loadedGoogleDocs)
		{
			var doc = loadedGoogleDocs[fileId];
			doc.close();
		}
	}
}

module.exports = EventBusinessRequestController;