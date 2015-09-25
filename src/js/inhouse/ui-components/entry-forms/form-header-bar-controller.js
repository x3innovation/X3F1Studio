function FormHeaderBarController(gFileCustomModel)
{
	// //////// private members
	var gFileCustomModel = gFileCustomModel;
	var objectChangedListener;

	// //////// public members
	this.addObjectChangedListener = function(listener)
	{
		objectChangedListener = listener;
		gFileCustomModel.fields.addEventListener(gapi.drive.realtime.EventType.OBJECT_CHANGED, objectChangedListener);
	}

	this.getFields = function()
	{
		return gFileCustomModel.fields;
	}

	this.getCreatorName = function()
	{
		return gFileCustomModel.creatingUser.name;
	}

	this.getCreatedDate = function()
	{
		return gFileCustomModel.createdDate;
	}
}

module.exports = FormHeaderBarController;