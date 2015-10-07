function EventBusinessRequestController(gMetadataModel, gMetadataCustomObject, gFileCustomObject, projectFolderFileId, gFileId)
{
	// //////// private members
	var googleDriveUtils = require('../../utils/google-drive-utils.js');
	var GDriveConstants = require('../../constants/google-drive-constants.js');

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

	function cacheGoogleDoc(doc){
		var driveFileId = doc.__rtinternal.e.f;
		loadedGoogleDocs[driveFileId] = doc;
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
		var metadataEventModel = googleDriveUtils.createMetadataEvent(gFileId, gFileCustomObject.title.text);

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
	}

	this.setAsNonBusinessRequest = function(){
		gFileCustomObject.isBusinessRequest = false;
		gFileCustomObject.correspondingBusinessResponses.clear();

		// create new metadata business request event custom object
		var metadataEventModel = googleDriveUtils.createMetadataEvent(gFileId, gFileCustomObject.title.text);

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
	}

	this.removeBusinessResponse = function(eventName){
		var gFileId = googleDriveUtils.getGoogleFileIdForEventName(gMetadataCustomObject, eventName);
		var index = gFileCustomObject.correspondingBusinessResponses.indexOf(gFileId);
		gFileCustomObject.correspondingBusinessResponses.remove(index);
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