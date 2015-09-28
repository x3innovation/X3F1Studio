function PersistentEventsController(gFileCustomModel)
{
	// //////// private members
	var gFileCustomModel = gFileCustomModel;

	// //////// public members
	this.addModelUpdateListener = function(listener)
	{
		gFileCustomModel.title.addEventListener(gapi.drive.realtime.EventType.TEXT_INSERTED, listener);
		gFileCustomModel.title.addEventListener(gapi.drive.realtime.EventType.TEXT_DELETED, listener);
	}

	this.getTitle = function()
	{
		return gFileCustomModel.title.text;
	}

	this.getPersistenceEvents = function()
	{
		var persistenceEvents = {};
		persistenceEvents.UpdatePersistenceEventTypeId = gFileCustomModel.UpdatePersistenceEventTypeId;
		persistenceEvents.CreatePersistenceEventTypeId = gFileCustomModel.CreatePersistenceEventTypeId;
		persistenceEvents.RemovePersistenceEventTypeId = gFileCustomModel.RemovePersistenceEventTypeId;
		persistenceEvents.UpdatedPersistenceEventTypeId = gFileCustomModel.UpdatedPersistenceEventTypeId;
		persistenceEvents.CreatedPersistenceEventTypeId = gFileCustomModel.CreatedPersistenceEventTypeId;
		persistenceEvents.RemovedPersistenceEventTypeId = gFileCustomModel.RemovedPersistenceEventTypeId;
		persistenceEvents.RejectedUpdatePersistenceEventTypeId = gFileCustomModel.RejectedUpdatePersistenceEventTypeId;
		persistenceEvents.RejectedCreatePersistenceEventTypeId = gFileCustomModel.RejectedCreatePersistenceEventTypeId;
		persistenceEvents.RejectedRemovePersistenceEventTypeId = gFileCustomModel.RejectedRemovePersistenceEventTypeId;
		return persistenceEvents;
	}
}

module.exports = PersistentEventsController;