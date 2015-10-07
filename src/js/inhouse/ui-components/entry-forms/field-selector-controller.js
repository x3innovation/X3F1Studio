function FieldSelectorController(gFileCustomModel, gFileModel){
	// //////// private members
	var googleDriveUtils = require('../../utils/google-drive-utils.js');

	var gFileCustomModel = gFileCustomModel;
	var gFileModel = gFileModel;

	// //////// public members
	this.addFieldsUpdateListener = function(listener){
		gFileCustomModel.fields.addEventListener(gapi.drive.realtime.EventType.VALUES_ADDED, listener);
		gFileCustomModel.fields.addEventListener(gapi.drive.realtime.EventType.VALUES_REMOVED, listener);
	}

	this.getFields = function(){
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

	this.getGoogleModelFields = function(){
		return gFileCustomModel.fields;
	}

	this.addField = function(newFieldName){
		gFileModel.beginCompoundOperation();
		var field = googleDriveUtils.createNewField(newFieldName, gFileModel);
		gFileModel.endCompoundOperation();
		gFileCustomModel.fields.push(field);
		return field;
	}

	this.removeField = function(removedFieldId){
		for (var i = 0, len = gFileCustomModel.fields.length; i<len; i++) {
			if ('' + gFileCustomModel.fields.get(i).id === removedFieldId) {
				gFileCustomModel.fields.remove(i);
				return true;
			}
		}
	}
}

module.exports = FieldSelectorController;