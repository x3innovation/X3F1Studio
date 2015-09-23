function HeaderController(objectFileId, objectFileType, gMetadataModel, gFileCustomModel)
{
	// //////// private members
	var googleApiInterface = require('../../remote-server-interfaces/google-api-interface.js');
	var AnnouncementType = require('../../constants/announcement-type.js');
	var objectFileId = objectFileId;
	var objectFileType = objectFileType;
	var gMetadataModel = gMetadataModel;
	var gFileCustomModel = gFileCustomModel;

	// //////// public members
	this.getTitle = function()
	{
		return gFileCustomModel.title.getText();
	}

	this.setTitle = function(title)
	{
		gFileCustomModel.title.setText(title);
		
		// change the physical google drive file name to reflect the change
		googleApiInterface.saveTitle(objectFileId, title);

		var renameAnnouncement = {
			action: AnnouncementType.RENAME_FILE,
			fileType: objectFileType,
			fileId: objectFileId,
			fileNewName: title
		};
		gMetadataModel.announcement.clear();
	    gMetadataModel.announcement.push(renameAnnouncement);
	}

	this.addTitleUpdateListener = function(listener)
	{
		gFileCustomModel.title.addEventListener(gapi.drive.realtime.EventType.TEXT_INSERTED, listener);
		gFileCustomModel.title.addEventListener(gapi.drive.realtime.EventType.TEXT_DELETED, listener);
	}

	this.getDescription = function()
	{
		return gFileCustomModel.description.getText();
	}

	this.setDescription = function(description)
	{
		gFileCustomModel.description.setText(description);
	}

	this.addDescriptionUpdateListener = function(listener)
	{
		gFileCustomModel.description.addEventListener(gapi.drive.realtime.EventType.TEXT_INSERTED, listener);
		gFileCustomModel.description.addEventListener(gapi.drive.realtime.EventType.TEXT_DELETED, listener);
	}

	this.getId = function()
	{
		return gFileCustomModel.id;
	}

	this.dispose = function()
	{
		gFileCustomModel.title.removeAllEventListeners()
		gFileCustomModel.description.removeAllEventListeners();
	}
}

module.exports = HeaderController;