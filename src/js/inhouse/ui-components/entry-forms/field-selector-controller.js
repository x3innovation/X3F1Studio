function FieldSelectorController(gFileCustomModel)
{
	// //////// private members
	var gFileCustomModel = gFileCustomModel;

	// //////// public members
	this.addFieldsUpdateListener = function(listener)
	{
		gFileCustomModel.fields.addEventListener(gapi.drive.realtime.EventType.VALUES_ADDED, listener);
		gFileCustomModel.fields.addEventListener(gapi.drive.realtime.EventType.VALUES_REMOVED, listener);
	}

	this.getFields = function()
	{
		var fields = [];
		var gField;
		var field;
		if (!this.gFields) {
			this.gFields = gFileCustomModel.fields;
		}
		for (var i = 0, len = this.gFields.length; i<len; i++) {
			gField = this.gFields.get(i);
			field = {};
			field.id = gField.id;
			field.name = gField.get('name').toString();
			var dataField = {
				data: field,
				name: field.name
			};
			fields.push(dataField);
		}

		return fields;
	}

	this.getGoogleModelFields = function()
	{
		return gFileCustomModel.fields;
	}

	this.dispose = function()
	{
		
	}
}

module.exports = FieldSelectorController;