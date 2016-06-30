function FormController(getFileCustomModel, gMetadataModel, projectFolderFileId, objectFileId, gModel)
{
	// //////// private members
	var gDriveUtils = require('../../utils/google-drive-utils.js');
	var AnnouncementType = require('../../constants/announcement-type.js');
	var GDriveConstants = require('../../constants/google-drive-constants.js');
	var getFileCustomModel = getFileCustomModel;
	var gMetadataModel = gMetadataModel;
	var projectFolderFileId = projectFolderFileId;
	var objectFileId = objectFileId;
	var gModel = gModel;

	// //////// public members
	this.addFieldsUpdateListener = function(listener)
	{
		getFileCustomModel.fields.addEventListener(gapi.drive.realtime.EventType.VALUES_SET, listener);
	}

	this.loadProjectObjects = function(callback)
	{
		var objectsToGet = { //only need the dmx types
			persistentData: true,
			enum: true,
			snippet: true,
			event: true,
			flow: false
		};
		gDriveUtils.getProjectObjects(projectFolderFileId, '', objectsToGet, onProjectObjectsLoaded);

		function onProjectObjectsLoaded(projectObjects)
		{
			var refs = [];
			var enums = [];
			var projectObject;
			for (var i = 0, len = projectObjects.length; i<len; i++) {
				projectObject = {
					id: projectObjects[i].id,
					title: projectObjects[i].title,
					fileType: projectObjects[i].description 
				};
				//the drive file description contains the object type
				switch (projectObjects[i].description) {
					case GDriveConstants.ObjectType.PERSISTENT_DATA:
                    case GDriveConstants.ObjectType.APPLICATION_STATE:
					case GDriveConstants.ObjectType.SNIPPET:
					case GDriveConstants.ObjectType.EVENT:
						refs.push(projectObject);
						break;
					case GDriveConstants.ObjectType.ENUM:
						enums.push(projectObject);
						break;
					default: break;
				}
			}

			callback(refs, enums);
		}
	}

	this.addAnnouncementListener = function(listener)
	{
		gMetadataModel.announcement.addEventListener(gapi.drive.realtime.EventType.VALUES_ADDED, onAnnouncement);

		function onAnnouncement()
		{
			var announcement = gMetadataModel.announcement.get(0); // get first announcement
			if (!(announcement.action === AnnouncementType.ADD_FILE
				&& announcement.fileId === objectFileId))
			{
				listener(announcement);
			}
		}
	}

	this.getFields = function()
	{
		return getFileCustomModel.fields;
	}

	this.getFileCustomModel = function()
	{
		return getFileCustomModel;
	}

	this.getFileModel = function()
	{
		return gModel;
	}
}

module.exports = FormController;