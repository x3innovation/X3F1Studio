function PersistentEventsController(gMetadataCustomObject, gFileCustomObject, objectFileId){
	// //////// private members
	var googleDriveUtils = require('../../utils/google-drive-utils.js');
	var AnnouncementType = require('../../constants/google-drive-constants.js');
	var gFileCustomObject = gFileCustomObject;
	var gMetadataCustomObject = gMetadataCustomObject;
	var objectFileId = objectFileId;
	var _this = this;

	function announceBusinessRequestUpdated(){
		// announce
		var announcement = {
			action: AnnouncementType.UPDATED_PERSISTENT_DATA_BUSINESS_REQUEST,
			fileId: objectFileId,
			businessRequests: {
				update: _this.getUpdateBusinessRequest(),
				create: _this.getCreateBusinessRequest(),
				remove: _this.getRemoveBusinessRequest()
			}
		};

		googleDriveUtils.announce(gMetadataCustomObject, announcement);
	}

	// //////// public members
	this.addModelUpdateListener = function(listener){
		gFileCustomObject.title.addEventListener(gapi.drive.realtime.EventType.TEXT_INSERTED, listener);
		gFileCustomObject.title.addEventListener(gapi.drive.realtime.EventType.TEXT_DELETED, listener);
	}

	this.getTitle = function(){
		return gFileCustomObject.title.text;
	}

	this.getPersistenceEvents = function(){
		var persistenceEvents = {};
		persistenceEvents.UpdatePersistenceEventTypeId = gFileCustomObject.UpdatePersistenceEventTypeId;
		persistenceEvents.CreatePersistenceEventTypeId = gFileCustomObject.CreatePersistenceEventTypeId;
		persistenceEvents.RemovePersistenceEventTypeId = gFileCustomObject.RemovePersistenceEventTypeId;
		persistenceEvents.UpdatedPersistenceEventTypeId = gFileCustomObject.UpdatedPersistenceEventTypeId;
		persistenceEvents.CreatedPersistenceEventTypeId = gFileCustomObject.CreatedPersistenceEventTypeId;
		persistenceEvents.RemovedPersistenceEventTypeId = gFileCustomObject.RemovedPersistenceEventTypeId;
		persistenceEvents.RejectedUpdatePersistenceEventTypeId = gFileCustomObject.RejectedUpdatePersistenceEventTypeId;
		persistenceEvents.RejectedCreatePersistenceEventTypeId = gFileCustomObject.RejectedCreatePersistenceEventTypeId;
		persistenceEvents.RejectedRemovePersistenceEventTypeId = gFileCustomObject.RejectedRemovePersistenceEventTypeId;
		return persistenceEvents;
	}

	this.setUpdateBusinessRequest = function(isBusinessRequest){
		gFileCustomObject.isUpdateBusinessRequest = isBusinessRequest;
		announceBusinessRequestUpdated();
	}

	this.getUpdateBusinessRequest = function(){
		return gFileCustomObject.isUpdateBusinessRequest;
	}

	this.setCreateBusinessRequest = function(isBusinessRequest){
		gFileCustomObject.isCreateBusinessRequest = isBusinessRequest;
		announceBusinessRequestUpdated();
	}

	this.getCreateBusinessRequest = function(){
		return gFileCustomObject.isCreateBusinessRequest;
	}

	this.setRemoveBusinessRequest = function(isBusinessRequest){
		gFileCustomObject.isRemoveBusinessRequest = isBusinessRequest;
		announceBusinessRequestUpdated();
	}

	this.getRemoveBusinessRequest = function(){
		return gFileCustomObject.isRemoveBusinessRequest;
	}

	this.addBusinessRequestUpdateListener = function(callback){
		googleDriveUtils.registerAnnouncement(gMetadataCustomObject, onBusinessRequestUpdate);
		
		function onBusinessRequestUpdate(announcementEvent){
			var announcement = announcementEvent.values[0];
			if (announcement.fileId === objectFileId && 
				announcement.action === AnnouncementType.RENAME_FILE){
				gFileCustomObject.isUpdateBusinessRequest = announcement.businessRequests.update;
				gFileCustomObject.isCreateBusinessRequest = announcement.businessRequests.create;
				gFileCustomObject.isRemoveBusinessRequest = announcement.businessRequests.remove;
				callback();
			}
		}
	}
}

module.exports = PersistentEventsController;