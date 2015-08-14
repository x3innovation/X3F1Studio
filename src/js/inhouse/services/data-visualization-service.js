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
		"string": FieldSizeCons.STRING_SIZE,
		"boolean": FieldSizeCons.BOOLEAN_SIZE,
		"enum": FieldSizeCons.ENUM_SIZE,
		"ref": FieldSizeCons.REF_SIZE
	};

	// //////// public members
	this.generateFieldModel = function(gField) {
		var fieldModel = {};
		fieldModel.id = gField.id;
		fieldModel.name = gField.get('name').toString();
		fieldModel.type = gField.get('type').toString()
		fieldModel.size = fieldSizeLookup[fieldModel.type] || 0;

		if (fieldModel.type === 'string') {
			fieldModel.size += parseInt(gField.get('strLen').toString(), 10);
		}
		if (gField.get('array')) {
			arrayLen = parseInt(gField.get('arrayLen').toString(), 10);
			nullBitsLength = Math.ceil(arrayLen / 32);
			fieldModel.size = (fieldModel.size * arrayLen) + nullBitsLength;
			fieldModel.nullBitsLength = nullBitsLength;
		}

		return fieldModel;
	}
}

module.exports = new DataVisualizationService();