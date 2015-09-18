function EditorController(fileType, projectFileId)
{
	// //////// private members
	var GDriveConstants = require('../../constants/google-drive-constants.js');
	var ObjectTypes = GDriveConstants.ObjectTypes;
	var customObjectKeys = {};
	customObjectKeys[ObjectTypes.PERSISTENT_DATA] = GDriveConstants.CustomObjectKey.PERSISTENT_DATA;
	customObjectKeys[ObjectTypes.ENUM] = GDriveConstants.CustomObjectKey.ENUM;
	customObjectKeys[ObjectTypes.EVENT] = GDriveConstants.CustomObjectKey.EVENT;
	customObjectKeys[ObjectTypes.SNIPPET] = GDriveConstants.CustomObjectKey.SNIPPET;
	var customObjectKey = customObjectKeys[fileType];

	function loadMetadataModel()
	{
		gapi.drive.realtime.load(projectFileId, )

		function onMetadataFileLoaded(doc) {
	        metadataModel = doc.getModel().getRoot().get(GCons.CustomObjectKey.PROJECT_METADATA);
	        if (metadataModel == null) {
	        	initializeMetadataModel(doc.getModel());
	        	onMetadataFileLoaded(doc);
	        }
	        else {
	        	updateMetadataModel(metadataModel);//if not properly initialized, update it
	        	callback(metadataModel);
	    	}
	    };

	    function initializeMetadataModel(model) {
	        var field = model.create(GCons.CustomObjectKey.PROJECT_METADATA);
	        field.announcement = model.createList();
	        field.nextId = 0;
	        field.version = 1;
	        model.getRoot().set(GCons.CustomObjectKey.PROJECT_METADATA, field);
	    };
	}

	// //////// public members
	this.initialize = function()
	{
		
		gapi.drive.realtime.load(fileId, onMetadataFileLoaded, initializeMetadataModel);
	}
}

module.exports = EditorController;