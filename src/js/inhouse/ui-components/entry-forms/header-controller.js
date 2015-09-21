function HeaderController(objectFileId, objectFileType, gMetadataModel, gModel)
{
	// //////// private members
	var googleApiInterface = require('../../remote-server-interfaces/google-api-interface.js');
	var AnnouncementType = require('../../constants/announcement-type.js');
	var objectFileId = objectFileId;
	var objectFileType = objectFileType;
	var gMetadataModel = gMetadataModel;
	var gModel = gModel;

	// //////// public members
	this.getTitle = function()
	{
		return gModel.title.getText();
	}

	this.setTitle = function(title)
	{
		gModel.title.setText(title);
		
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
		gModel.title.addEventListener(gapi.drive.realtime.EventType.TEXT_INSERTED, listener);
		gModel.title.addEventListener(gapi.drive.realtime.EventType.TEXT_DELETED, listener);
	}

	this.getDescription = function()
	{
		return gModel.description.getText();
	}

	this.setDescription = function(description)
	{
		gModel.description.setText(description);
	}

	this.addDescriptionUpdateListener = function(listener)
	{
		gModel.description.addEventListener(gapi.drive.realtime.EventType.TEXT_INSERTED, listener);
		gModel.description.addEventListener(gapi.drive.realtime.EventType.TEXT_DELETED, listener);
	}

	this.getId = function()
	{
		return gModel.id;
	}
}

module.exports = HeaderController;