var DefaultValueConstants = require('../constants/default-value-constants.js');
var FieldSizeCons = DefaultValueConstants.FieldSizeValues;

var EventType = require('../constants/event-type.js');

function DataVisualizationService() {
	// //////// private members
	var fieldSizeLookup = {
		"byte": FieldSizeCons.BYTE_SIZE,
		"short": FieldSizeCons.SHORT_SIZE,
		"integer": FieldSizeCons.INTEGER_SIZE,
		"long": FieldSizeCons.LONG_SIZE,
		"float": FieldSizeCons.FLOAT_SIZE,
		"double": FieldSizeCons.DOUBLE_SIZE,
		"date": FieldSizeCons.DATE_SIZE,
		"datetime": FieldSizeCons.DATETIME_SIZE,
		"time": FieldSizeCons.TIME_SIZE,
		"string": FieldSizeCons.STRING_SIZE,
		"boolean": FieldSizeCons.BOOLEAN_SIZE,
		"enum": FieldSizeCons.ENUM_SIZE,
		"ref": FieldSizeCons.REF_SIZE
	};

	// //////// public members
	this.generateFieldModel = function(gField,startByte) {
		var fieldModel = {};
		fieldModel.id = gField.id;
		fieldModel.name = gField.get('name').toString();
		fieldModel.type = gField.get('type').toString();
		fieldModel.size = fieldSizeLookup[fieldModel.type] || 0;

		if (fieldModel.type === 'string') {
			var maxStrLen = gField.has('maxStrLen') ?
				parseInt(gField.get('maxStrLen').toString(), 10) :
				parseInt(gField.get('strLen').toString(), 10);
			if (maxStrLen && !isNaN(maxStrLen)) {
				fieldModel.size += maxStrLen;
			} else {
				fieldModel.size = 0;
			}
		}
		if (gField.get('array')) {
			fieldModel.arrayLen = parseInt(gField.get('arrayLen').toString(), 10);
			fieldModel.nullBits = Math.ceil(fieldModel.arrayLen / 32);
			fieldModel.size *= fieldModel.arrayLen; 
			fieldModel.size += fieldModel.nullBits;
		}
		fieldModel.startByte = startByte;
		fieldModel.endByte = startByte + fieldModel.size - 1;

		return fieldModel;
	}

	this.generateFieldModelDetails = function(fieldModel) {
		var details = '';
		if (fieldModel.type) {
			details += fieldModel.type + ', ';
		}
		details += fieldModel.size + ' bytes (' + fieldModel.startByte + '-' + fieldModel.endByte + ')';
		if (fieldModel.arrayLen) {
			details += '\narray length: ' + fieldModel.arrayLen + ', ';
			details += 'null bits: ' + fieldModel.nullBits;
		}

		return details;
	}
}

module.exports = new DataVisualizationService();