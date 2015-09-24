function EnumElementsController(gFileCustomModel, gMetadataModel)
{
	// //////// private members
	var gFileCustomModel = gFileCustomModel;
	var gMetadataModel = gMetadataModel;

	// //////// public members
	this.addFieldsUpdateListener = function(listener)
	{
		gFileCustomModel.fields.addEventListener(gapi.drive.realtime.EventType.VALUES_ADDED, listener);
		gFileCustomModel.fields.addEventListener(gapi.drive.realtime.EventType.VALUES_REMOVED, listener);
		gFileCustomModel.fields.addEventListener(gapi.drive.realtime.EventType.VALUES_SET, listener);
	}

	this.getFieldsAsArray = function()
	{
		return gFileCustomModel.fields.asArray();
	}

	this.getFields = function()
	{
		return gFileCustomModel.fields;
	}

	this.getMetadataModel = function()
	{
		return gMetadataModel;
	}
}

module.exports = EnumElementsController;