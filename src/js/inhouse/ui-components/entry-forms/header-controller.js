function HeaderController(objectFileId, objectFileType, gMetadataModel, gMetadataCustomObject, gFileCustomObject)
{
	// //////// private members
	var googleApiInterface = require('../../remote-server-interfaces/google-api-interface.js');
	var AnnouncementType = require('../../constants/announcement-type.js');
	var objectFileId = objectFileId;
	var objectFileType = objectFileType;
	var gMetadataModel = gMetadataModel;
	var gMetadataCustomObject = gMetadataCustomObject;
	var gFileCustomObject = gFileCustomObject;

	// //////// public members
	this.getTitle = function()
	{
		return gFileCustomObject.title.getText();
	}

	this.setTitle = function(title)
	{
		gFileCustomObject.title.setText(title);

		// update event title in metadata businessRequest and nonBusinessRequest
		for (var i=0; i<gMetadataCustomObject.businessRequestEvents.length; ++i){
			var businessRequestEvent = gMetadataCustomObject.businessRequestEvents.get(i);
			if (businessRequestEvent.gFileId === objectFileId){
				var newEvent = {
					gFileId: objectFileId,
					eventObjectTitle: title
				}
				gMetadataCustomObject.businessRequestEvents.set(i, newEvent);
			}
		}

		for (var i=0; i<gMetadataCustomObject.nonBusinessRequestEvents.length; ++i){
			var businessRequestEvent = gMetadataCustomObject.nonBusinessRequestEvents.get(i);
			if (businessRequestEvent.gFileId === objectFileId){
				var newEvent = {
					gFileId: objectFileId,
					eventObjectTitle: title
				}
				gMetadataCustomObject.nonBusinessRequestEvents.set(i, newEvent);
			}
		}

		// update project object titles
		var fileIds = gMetadataCustomObject.projectObjectTitles.keys();
		for (var i=0; i<fileIds.length; i++){
			var fileId = fileIds[i];
			if (fileId === objectFileId){
				gMetadataCustomObject.projectObjectTitles.set(fileId, title);
			}
		}
		
		// change the physical google drive file name to reflect the change
		googleApiInterface.saveTitle(objectFileId, title);

		var renameAnnouncement = {
			action: AnnouncementType.RENAME_FILE,
			fileType: objectFileType,
			fileId: objectFileId,
			fileNewName: title
		};
		gMetadataCustomObject.announcement.clear();
	    gMetadataCustomObject.announcement.push(renameAnnouncement);
	}

	this.addTitleUpdateListener = function(listener)
	{
		gFileCustomObject.title.addEventListener(gapi.drive.realtime.EventType.TEXT_INSERTED, listener);
		gFileCustomObject.title.addEventListener(gapi.drive.realtime.EventType.TEXT_DELETED, listener);
	}

	this.getDescription = function()
	{
		return gFileCustomObject.description.getText();
	}

	this.setDescription = function(description)
	{
		gFileCustomObject.description.setText(description);
	}

	this.addDescriptionUpdateListener = function(listener)
	{
		gFileCustomObject.description.addEventListener(gapi.drive.realtime.EventType.TEXT_INSERTED, listener);
		gFileCustomObject.description.addEventListener(gapi.drive.realtime.EventType.TEXT_DELETED, listener);
	}

	this.getId = function()
	{
		return gFileCustomObject.id;
	}

	this.dispose = function()
	{
		gFileCustomObject.title.removeAllEventListeners()
		gFileCustomObject.description.removeAllEventListeners();
	}
}

module.exports = HeaderController;