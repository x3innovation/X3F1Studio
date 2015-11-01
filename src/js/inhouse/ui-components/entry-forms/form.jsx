var EventType = require('../../constants/event-type.js');
var GDriveConstants = require('../../constants/google-drive-constants.js');
var Configs = require('../../app-config.js');
var GDriveUtils = require('../../utils/google-drive-utils.js');
var AnnouncementType = require('../../constants/announcement-type.js');

module.exports = React.createClass({
	/* ******************************************
				LIFE CYCLE FUNCTIONS
	****************************************** */
	componentWillMount: function() {
		this.fieldData = null;
		this.fieldDataId = null;
		this.fieldSelected = false;
		this.updateListeningModels = [];
		this.controller = this.props.controller;
		this.gFileModel = this.controller.getFileModel();
		this.gFileCustomModel = this.controller.getFileCustomModel();
		this.gFields = this.controller.getFields();
		this.isInitialized = false;

		Bullet.on(EventType.EntryForm.FIELD_SELECTED, 'form.jsx>>onFieldSelected', this.onFieldSelected);
	},

	componentDidMount: function() {
		this.initialize();
		
		$('input[type=text]').keypress(function(e) {
			var code = (e.keyCode || e.which);
			if (code === 13) { //enter was detected, ignore keypress
				$(e.currentTarget).blur();
				return false;
			}
		});

		window.onbeforeunload = this.showWarningMessageWhenInvalid;
		window.onhashchange = this.showWarningMessageWhenInvalid;

		this.isInitialized = true;
		this.updateForSelectedField();
	},

	componentWillUnmount: function() {
		this.gFileCustomModel = null;
		this.gFields = null;
		this.fieldData = null;
		this.fieldDataId = null;
		this.fieldSelected = false;
		this.updateListeningModels = [];
		$('.error-tooltipped').tooltipster('destroy');
		$('#def-date-field, #min-date-field, #max-date-field').datetimepicker('destroy');

		if (this.gFields) { 
			this.gFields.removeEventListener(gapi.drive.realtime.EventType.VALUES_SET, this.updateUi);
		}

		Bullet.off(EventType.EntryForm.FIELD_SELECTED, 'form.jsx>>onFieldSelected');
	},

	/* ******************************************
			   NON LIFE CYCLE FUNCTIONS
	****************************************** */
	initialize: function()
	{
		var _this = this;
		this.initializeTooltips();
		this.initializeDatepicker();
		this.controller.addFieldsUpdateListener(this.updateUi);
		this.controller.loadProjectObjects(onProjectObjectsLoaded);
		this.controller.addAnnouncementListener(this.onAnnouncement);

		function onProjectObjectsLoaded(refs, enums)
		{
			_this.refs = refs;
			_this.enums = enums;
			_this.setSelectOptions();
		}
	},

	onAnnouncement: function(announcement)
	{
		switch (announcement.action) {
			case AnnouncementType.ADD_FILE:
				switch (announcement.fileType) {
					case GDriveConstants.ObjectType.PERSISTENT_DATA:
					case GDriveConstants.ObjectType.SNIPPET:
					case GDriveConstants.ObjectType.EVENT:
						this.addToRefs(announcement);
						break;
					case GDriveConstants.ObjectType.ENUM:
						this.addToEnums(announcement);
						break;
					default: break;
				} break;
			case AnnouncementType.RENAME_FILE:
				switch (announcement.fileType) {
					case GDriveConstants.ObjectType.PERSISTENT_DATA:
					case GDriveConstants.ObjectType.SNIPPET:
					case GDriveConstants.ObjectType.EVENT:
						this.updateRefNames(announcement);
						break;
					case GDriveConstants.ObjectType.ENUM:
						this.updateEnums(announcement);
						break;
					default: break;
				} break;
			case AnnouncementType.ADD_ENUM:
				if (announcement.fileId === _this.fieldData.get('enumId')) { 
				// if the active enum doesn't match the updated enum, then any update would be unnoticed to the user anyways
					this.setEnumValues(announcement.fileId);
				} break;
			case AnnouncementType.DELETE_ENUM:
				if (announcement.fileId === _this.fieldData.get('enumId')) {
					this.setEnumValues(announcement.fileId);
				} break;
			case AnnouncementType.RENAME_ENUM:
				if (announcement.fileId === _this.fieldData.get('enumId')) {
					this.setEnumValues(announcement.fileId);
				} break;
			default: break;
		}
	},

	showWarningMessageWhenInvalid: function(e) {
		this.enforceValidation();
		if ($('.invalid-input').length) {
			return 'Warning: Invalid fields were found, please fix them before navigating away.';
		}
		return null;
	},

	initializeTooltips: function() {
		$('.error-tooltipped').tooltipster({
			position: 'right',
			theme: 'form-error-message',
			autoClose: false,
			maxWidth: 300,
			offsetY: '6px',
			trigger: 'custom'
		});
	},

	initializeDatepicker: function() {
		var _this = this;
		var DATE_FORMAT = 'YYYY-MM-DD';
		var TIME_FORMAT = 'HH:mm:00';
		var datepickerOptions = {
			format: DATE_FORMAT + ' ' + TIME_FORMAT,
			formatDate: DATE_FORMAT,
			formatTime: TIME_FORMAT,
			className: 'form-datetimepicker',
			datepicker: true,
			timepicker: true,
			lazyInit: true,
			step: 10,
			onShow: function() {
				var fieldType = _this.fieldData.get('type');
				var optionsToSet;
				switch (fieldType) {
					case "datetime":
						optionsToSet = {
							format: DATE_FORMAT + ' ' + TIME_FORMAT,
							datepicker: true,
							timepicker: true
						};
						break;
					case "date":
						optionsToSet = {
							format: DATE_FORMAT,
							datepicker: true,
							timepicker: false
						};
						break;
					case "time":
						optionsToSet = {
							format: TIME_FORMAT,
							datepicker: false,
							timepicker: true
						};
						break;
					default: break;
				}
				this.setOptions(optionsToSet);
			}
		};

		// on change handler for min / max
		datepickerOptions.onChangeDateTime = function(datetimepicker, $input){
			if ($('#field-type-select').val() === 'datetime'){
				var input = $input.val();
				var inputTokenized = input.split(' ');
				var date = inputTokenized[0];
				var time = inputTokenized[1];

				if ($input.attr('id') === 'min-date-field'){
					$('#min-datetime-date').attr('data-date', date);
					$('#min-datetime-time').attr('data-time', time);
				}
				else if ($input.attr('id') === 'max-date-field'){
					$('#max-datetime-date').attr('data-date', date);
					$('#max-datetime-time').attr('data-time', time);
				}
				else if ($input.attr('id') === 'def-date-field'){
					$('#def-datetime-date').attr('data-date', date);
					$('#def-datetime-time').attr('data-time', time);
				}
			}
			_this.saveUiToGoogle();
		};
		$('#def-date-field, #min-date-field, #max-date-field').datetimepicker(datepickerOptions);
	},

	updateUi: function() {
		if (!this.fieldData) { return; }

		this.displayCorrectUiComponents();
		var getById = document.getElementById.bind(document);

		getById('name-field').value = this.fieldData.get('name').text;
		getById('description-field').value = this.fieldData.get('description').text;
		getById('def-value-field').value = this.fieldData.get('defValue').text;
		getById('min-value-field').value = this.fieldData.get('minValue').text;
		getById('max-value-field').value = this.fieldData.get('maxValue').text;
		getById('min-str-len-field').value = this.fieldData.get('minStrLen').text;
		getById('max-str-len-field').value = this.fieldData.get('maxStrLen').text;
		getById('array-len-field').value = this.fieldData.get('arrayLen').text;

		getById('field-type-select').value = this.fieldData.get('type');
		getById('enum-value-select').value = this.fieldData.get('enumValue');

		getById('def-date-field').value = this.fieldData.get('defDate').toString();
		getById('min-date-field').value = this.fieldData.get('minDate').toString();
		getById('max-date-field').value = this.fieldData.get('maxDate').toString();

		getById('ref-soft-radio').checked = this.fieldData.get('refType') === 'soft';
		getById('ref-hard-radio').checked = this.fieldData.get('refType') === 'hard';
		getById('def-value-checkbox').checked = this.fieldData.get('defValueBool');
		getById('optional-checkbox').checked = this.fieldData.get('optional');
		getById('array-checkbox').checked =  this.fieldData.get('array');
		getById('context-id-checkbox').checked =  this.fieldData.get('contextId');
		this.updateAllSelect();
	},

	saveUiToGoogle: function() {
		if (this.enforceValidation())
		{
			var fieldIndex;
			for (var i = 0, len = this.gFields.length; i<len; i++) {
				if (this.gFields.get(i).id === this.fieldData.id) {
					fieldIndex = i;
					break;
				}
			}

			var getById = document.getElementById.bind(document);
			this.gFileModel.beginCompoundOperation();

			var type = getById('field-type-select').value;
			this.fieldData.set('type', type);
			this.fieldData.set('refId', getById('ref-name-select').value);
			var newRefType = '';
			if (getById('ref-soft-radio').checked) {
				newRefType = 'soft';
			} else if (getById('ref-hard-radio').checked) {
				newRefType = 'hard';
			}

			this.fieldData.set('refType', newRefType);
			this.fieldData.set('enumId', getById('enum-name-select').value);
			this.fieldData.set('enumValue', getById('enum-value-select').value);

			this.fieldData.get('minValue').setText(getById('min-value-field').value);
			this.fieldData.get('maxValue').setText(getById('max-value-field').value);
			this.fieldData.get('minStrLen').setText(getById('min-str-len-field').value);
			this.fieldData.get('maxStrLen').setText(getById('max-str-len-field').value);
			this.fieldData.get('defValue').setText(getById('def-value-field').value);

			if (type === 'datetime'){
				var datetimeDate = $('#min-datetime-date').attr('data-date');
				var datetimeTime = $('#min-datetime-time').attr('data-time');
				if (datetimeDate != null && datetimeTime != null){
					this.fieldData.get('minDateTimeDate').setText(datetimeDate);
					this.fieldData.get('minDateTimeTime').setText(datetimeTime);
				}

				datetimeDate = $('#max-datetime-date').attr('data-date');
				datetimeTime = $('#max-datetime-time').attr('data-time');
				if (datetimeDate != null && datetimeTime != null){
					this.fieldData.get('maxDateTimeDate').setText(datetimeDate);
					this.fieldData.get('maxDateTimeTime').setText(datetimeTime);
				}

				datetimeDate = $('#def-datetime-date').attr('data-date');
				datetimeTime = $('#def-datetime-time').attr('data-time');
				if (datetimeDate != null && datetimeTime != null){
					this.fieldData.get('defDateTimeDate').setText(datetimeDate);
					this.fieldData.get('defDateTimeTime').setText(datetimeTime);
				}
			}

			this.fieldData.get('minDate').setText(getById('min-date-field').value);
			this.fieldData.get('maxDate').setText(getById('max-date-field').value);
			this.fieldData.get('defDate').setText(getById('def-date-field').value);

			if (!$('#array-len-wrapper').hasClass('hide')){
				this.fieldData.get('arrayLen').setText(getById('array-len-field').value);
			}

			this.fieldData.set('defValueBool', getById('def-value-checkbox').checked);
			this.fieldData.set('optional', getById('optional-checkbox').checked);
			this.fieldData.set('array', getById('array-checkbox').checked);
			this.fieldData.set('contextId', getById('context-id-checkbox').checked);
			this.gFields.set(fieldIndex, this.fieldData);

			this.gFileModel.endCompoundOperation();
		}
	},

	displayCorrectUiComponents: function(fieldType) {
		fieldType = (typeof fieldType) !== 'undefined' ? fieldType : this.fieldData.get('type');
		
		$('.type-specific-field').addClass('hide');
		$('#array-len-wrapper').addClass('hide');
		$('.'+fieldType+'-specific-field').removeClass('hide');
		if (this.fieldData.get('array')) {
			$('#array-len-wrapper').removeClass('hide');
		}

		$('.invalid-input.hide').next('label').tooltipster('hide');
		$('.invalid-input.hide').removeClass('invalid-input');

		var floatTypes = 'double float', integerTypes = 'integer byte short long';
		if (floatTypes.indexOf(fieldType) !== -1 || integerTypes.indexOf(fieldType) !== -1) {
			$('#def-value-field').addClass('number-input');
		} else {
			$('#def-value-field').removeClass('number-input');
		}

		if (integerTypes.indexOf(fieldType) !== -1) {
			$('#min-value-field, #max-value-field, #def-value-field').addClass('integer-input');
		} else {
			$('#min-value-field, #max-value-field, #def-value-field').removeClass('integer-input');
		}
	},

	enforceValidation: function(fieldType) {
		if (!this.gFileCustomModel || !this.fieldData) { return; } //if field not selected, validation doesn't make sense

		var allFieldsValid = true;
		var validateField = this.validateField;
		fieldType = (typeof fieldType) !== 'undefined' ? fieldType : this.fieldData.get('type');

		$('.validated-input:visible').each(function(index, element) {
			var isValid = validateField(element, fieldType);
			if (!isValid){
				allFieldsValid = isValid;
			}
		});

		return allFieldsValid;
	},

	validateField: function(targetField, fieldType) {
		var $targetField = $(targetField);
		var errorMessage = this.setErrorMessage(targetField, fieldType);

		var $fieldLabel = $targetField.next('label');

		if (errorMessage) {
			$targetField.addClass('invalid-input');
			if ($fieldLabel.tooltipster('content') !== errorMessage) { // only change message if message is different
				$fieldLabel.tooltipster('content', errorMessage);
			}
			$fieldLabel.tooltipster('show');
			return false;
			//$targetField.focus(); //force user to fix
		} else if ($targetField.hasClass('invalid-input')) {
			$targetField.removeClass('invalid-input');
			$fieldLabel.tooltipster('show'); // show before hide to ensure tooltipster can be hidden
			$fieldLabel.tooltipster('hide');
		}

		return true;
	},

	setErrorMessage: function(targetField, fieldType) {
		var $targetField = $(targetField);
		var fieldVal = $targetField.val();
		var errorMessage = '';
		var fieldId = targetField.id;

		if (!errorMessage && !fieldVal) {
			if ($targetField.prop('required')) {
				errorMessage += 'This is a required field. ';
			} else {
				return '';
			}
		}

		//numeric fields must only contain numbers
		if (!errorMessage && $targetField.hasClass('number-input') &&  
		    (isNaN(fieldVal) || fieldVal.indexOf(' ') !== -1)) { //isNaN ignores leading/trailing whitespace
			errorMessage += 'Value should be a number. ';
		}

		//integer fields must only contain integers
		if (!errorMessage && $targetField.hasClass('integer-input') && fieldVal.indexOf('.') !== -1) {
			errorMessage += 'Value should be an integer. ';
		}

		var dateFormat = '';
		   if (fieldType === 'datetime') { dateFormat = 'YYYY-MM-DD HH:mm:ss.SSS';
		} else if (fieldType === 'date') { dateFormat = 'YYYY-MM-DD';
		} else if (fieldType === 'time') { dateFormat = 'HH:mm:ss.SSS';
		}
		var parseDate = function(dateVal) {return moment(dateVal, dateFormat);};
		//date fields must be valid
		if (!errorMessage && $targetField.hasClass('date-input') && fieldVal && !parseDate(fieldVal).isValid()) {
			errorMessage += 'Value should be a valid date. ';
		}

		//names must start with an alphabetic character and contain only alphanumerics
		if (!errorMessage && fieldId === 'name-field') {
			for (i = 0, len = this.gFields.length; i < len; i++) {
				if (this.gFields.get(i).get('name').toString() === fieldVal && this.gFields.get(i).id !== this.fieldDataId) {
					errorMessage += 'This name is already in use. ';
					break;
				}
			}
			if (fieldVal.length > Configs.EntryForm.FIELD_NAME_LENGTH_MAX) { 
				errorMessage += 'Names should be '+Configs.EntryForm.FIELD_NAME_LENGTH_MAX+' characters long at most. ';
			}
			if (!fieldVal.match(/^[A-Za-z][A-Za-z0-9]*$/)) {
				errorMessage += 'Names should start with a letter and contain only alphanumeric characters. ';
			}
		}

		//the max field must be >= the min field
		if (!errorMessage && fieldId === 'max-value-field' && !isNaN($('#min-value-field').val()) &&
		 	 parseFloat(fieldVal) < parseFloat($('#min-value-field').val())) {
			errorMessage += 'Max value should be greater than or equal to min value. ';
			$('#min-value-field').addClass('invalid-input');
		}

		//the max length field must be >= the min length field
		if (!errorMessage && fieldId === 'max-str-len-field' && !isNaN($('#min-str-len-field').val()) &&
		 	 parseFloat(fieldVal) < parseFloat($('#min-str-len-field').val())) {
			errorMessage += 'Max string length should be greater than or equal to min string length. ';
			$('#min-str-len-field').addClass('invalid-input');
		}

		//the max date field must be >= the min date field
		if (!errorMessage && fieldId === 'max-date-field' && $('#min-date-field').val() &&
		 	 parseDate(fieldVal).isBefore(parseDate($('#min-date-field').val()))) {
			errorMessage += 'Max date should be after min date. ';
			$('#min-date-field').addClass('invalid-input');
		}

		//default-value field for numbers must be within the min max range
		if (!errorMessage && fieldId === 'def-value-field' && $targetField.hasClass('number-input')  && fieldVal) {
			if (!isNaN($('#min-value-field').val()) && parseFloat(fieldVal) < parseFloat($('#min-value-field').val())) {
				errorMessage += 'Default value should be greater than or equal to min value. ';
			}
			if (!isNaN($('#max-value-field').val()) && parseFloat(fieldVal) > parseFloat($('#max-value-field').val())) {
				errorMessage += 'Default value should be less than or equal to max value. ';
			}
		}
		//default-value field for strings has a user-defined max length
		if (!errorMessage && fieldId === 'def-value-field' && fieldType === 'string') {
			if (!isNaN($('#min-str-len-field').val()) && fieldVal.length < parseInt($('#min-str-len-field').val(), 10)) {
				errorMessage += 'Default value should be longer than defined minimum length. ';
			}
			if (!isNaN($('#max-str-len-field').val()) && fieldVal.length > parseInt($('#max-str-len-field').val(), 10)) {
				errorMessage += 'Default value should be within defined maximum length. ';
			}
		}
		//default-value field for dates has a user-defined range
		if (!errorMessage && fieldId === 'def-date-field') {
			if ($('#max-date-field').val() && 
			    parseDate(fieldVal).isAfter(parseDate($('#max-date-field').val()))) {
				errorMessage += 'Default ' +fieldType+ ' should not be after defined maximum ' +fieldType+ '. ';
			}
			if ($('#min-date-field').val() &&
			 	 parseDate(fieldVal).isBefore(parseDate($('#min-date-field').val()))) {
				errorMessage += 'Default ' +fieldType+ ' should not be before defined minimum ' +fieldType+ '. ';
			}
		}

		
		//Validating: Short 
		if (!errorMessage && fieldType === 'short' && fieldId === 'min-value-field' && $('#min-value-field').val()){			
			if( parseInt($('#min-value-field').val(),10 ) <  parseInt(Configs.DataTypeDef.FIELD_SHORT_MIN_VALUE) ){
				errorMessage += 'The minimum value should be greater than ' + parseInt(Configs.DataTypeDef.FIELD_SHORT_MIN_VALUE);
				$('#min-value-field').addClass('invalid-input');
			}
			if( parseInt($('#min-value-field').val(),10 ) >  parseInt(Configs.DataTypeDef.FIELD_SHORT_MAX_VALUE) ){
				errorMessage += 'The minimum value can not be greater than ' + Configs.DataTypeDef.FIELD_SHORT_MAX_VALUE;
				$('#min-value-field').addClass('invalid-input');
			}
		}	
		if(!errorMessage && fieldType === 'short' && fieldId === 'max-value-field' && $('#max-value-field').val()){
			if( parseInt($('#max-value-field').val(),10 ) >  parseInt(Configs.DataTypeDef.FIELD_SHORT_MAX_VALUE) ){
				errorMessage += 'The maximum value can not be greater than ' + Configs.DataTypeDef.FIELD_SHORT_MAX_VALUE;
				$('#max-value-field').addClass('invalid-input');
			}
			if( parseInt($('#max-value-field').val(),10 ) <  parseInt(Configs.DataTypeDef.FIELD_SHORT_MIN_VALUE) ){
				errorMessage += 'The maximum value can not be less than ' + Configs.DataTypeDef.FIELD_SHORT_MIN_VALUE;
				$('#max-value-field').addClass('invalid-input');
			}
		}	
		//Validating: Integer
		if (!errorMessage && fieldType === 'integer' && fieldId === 'min-value-field' && $('#min-value-field').val()){			
			if( parseInt($('#min-value-field').val(),10 ) <  parseInt(Configs.DataTypeDef.FIELD_INT_MIN_VALUE) ){
				errorMessage += 'The minimum value should be greater than ' + Configs.DataTypeDef.FIELD_INT_MIN_VALUE;
				$('#min-value-field').addClass('invalid-input');
			}
			if( parseInt($('#min-value-field').val(),10 ) >  parseInt(Configs.DataTypeDef.FIELD_INT_MAX_VALUE) ){
				errorMessage += 'The minimum value can not be greater than ' + Configs.DataTypeDef.FIELD_INT_MAX_VALUE;
				$('#min-value-field').addClass('invalid-input');
			}
		}	
		if(!errorMessage && fieldType === 'integer' && fieldId === 'max-value-field' && $('#max-value-field').val()){
			if( parseInt($('#max-value-field').val(),10 ) >  parseInt(Configs.DataTypeDef.FIELD_INT_MAX_VALUE) ){
				errorMessage += 'The maximum value can not be greater than ' + Configs.DataTypeDef.FIELD_INT_MAX_VALUE;
				$('#max-value-field').addClass('invalid-input');
			}
			if( parseInt($('#max-value-field').val(),10 ) <  parseInt(Configs.DataTypeDef.FIELD_INT_MIN_VALUE) ){
				errorMessage += 'The maximum value should greater than ' + Configs.DataTypeDef.FIELD_INT_MIN_VALUE;
				$('#max-value-field').addClass('invalid-input');
			}
		}	
		//Validating: Long
		if (!errorMessage && fieldType === 'long' && fieldId === 'min-value-field' && $('#min-value-field').val()){			
			if( parseInt($('#min-value-field').val(),20 ) <  parseInt(Configs.DataTypeDef.FIELD_LONG_MIN_VALUE) ){
				errorMessage += 'The minimum value should be greater than ' + Configs.DataTypeDef.FIELD_LONG_MIN_VALUE;
				$('#min-value-field').addClass('invalid-input');
			}
			if( parseInt($('#min-value-field').val(),20 ) >  parseInt(Configs.DataTypeDef.FIELD_LONG_MAX_VALUE) ){
				errorMessage += 'The minimum value can not be greater than ' + Configs.DataTypeDef.FIELD_LONG_MAX_VALUE;
				$('#min-value-field').addClass('invalid-input');
			}
		}	
		if(!errorMessage && fieldType === 'long' && fieldId === 'max-value-field' && $('#max-value-field').val()){
			if( parseInt($('#max-value-field').val(),20 ) >  parseInt(Configs.DataTypeDef.FIELD_LONG_MAX_VALUE) ){
				errorMessage += 'The maximum value can not be greater than ' + Configs.DataTypeDef.FIELD_LONG_MAX_VALUE;
				$('#max-value-field').addClass('invalid-input');
			}
			if( parseInt($('#max-value-field').val(),20 ) <  parseInt(Configs.DataTypeDef.FIELD_LONG_MIN_VALUE) ){
				errorMessage += 'The maximum value should greater than ' + Configs.DataTypeDef.FIELD_LONG_MIN_VALUE;
				$('#max-value-field').addClass('invalid-input');
			}
		}	
		//Validating: Byte
		if (!errorMessage && fieldType === 'byte' && fieldId === 'min-value-field' && $('#min-value-field').val()){			
			if( parseInt($('#min-value-field').val(),10 ) <  parseInt(Configs.DataTypeDef.FIELD_BYTE_MIN_VALUE) ){
				errorMessage += 'The minimum value should be greater than ' + Configs.DataTypeDef.FIELD_BYTE_MIN_VALUE;
				$('#min-value-field').addClass('invalid-input');
			}
			if( parseInt($('#min-value-field').val(),10 ) >  parseInt(Configs.DataTypeDef.FIELD_BYTE_MAX_VALUE) ){
				errorMessage += 'The minimum value can not be greater than ' + Configs.DataTypeDef.FIELD_BYTE_MAX_VALUE;
				$('#min-value-field').addClass('invalid-input');
			}
		}	
		if(!errorMessage && fieldType === 'byte' && fieldId === 'max-value-field' && $('#max-value-field').val()){
			if( parseInt($('#max-value-field').val(),10 ) >  parseInt(Configs.DataTypeDef.FIELD_BYTE_MAX_VALUE) ){
				errorMessage += 'The maximum value can not be greater than ' + Configs.DataTypeDef.FIELD_BYTE_MAX_VALUE;
				$('#max-value-field').addClass('invalid-input');
			}
			if( parseInt($('#max-value-field').val(),10 ) <  parseInt(Configs.DataTypeDef.FIELD_BYTE_MIN_VALUE) ){
				errorMessage += 'The maximum value should greater than ' + Configs.DataTypeDef.FIELD_BYTE_MIN_VALUE;
				$('#max-value-field').addClass('invalid-input');
			}
		}	
		//Validating: Double
		if (!errorMessage && fieldType === 'double' && fieldId === 'min-value-field' && $('#min-value-field').val()){			
			if( parseFloat($('#min-value-field').val()) <  parseFloat(Configs.DataTypeDef.FIELD_DOUBLE_MIN_VALUE) ){
				errorMessage += 'The minimum value should be greater than ' + Configs.DataTypeDef.FIELD_DOUBLE_MIN_VALUE;
				$('#min-value-field').addClass('invalid-input');
			}
			if( parseFloat($('#min-value-field').val()) >  parseFloat(Configs.DataTypeDef.FIELD_DOUBLE_MAX_VALUE) ){
				errorMessage += 'The minimum value can not be greater than ' + Configs.DataTypeDef.FIELD_DOUBLE_MAX_VALUE;
				$('#min-value-field').addClass('invalid-input');
			}
		}	
		if(!errorMessage && fieldType === 'double' && fieldId === 'max-value-field' && $('#max-value-field').val()){
			if( parseFloat($('#max-value-field').val() ) >  parseFloat(Configs.DataTypeDef.FIELD_DOUBLE_MAX_VALUE) ){
				errorMessage += 'The maximum value can not be greater than ' + Configs.DataTypeDef.FIELD_DOUBLE_MAX_VALUE;
				$('#max-value-field').addClass('invalid-input');
			}
			if( parseFloat($('#max-value-field').val() ) <  parseFloat(Configs.DataTypeDef.FIELD_DOUBLE_MIN_VALUE) ){
				errorMessage += 'The maximum value should greater than ' + Configs.DataTypeDef.FIELD_DOUBLE_MIN_VALUE;
				$('#max-value-field').addClass('invalid-input');
			}
		}	
		//Validating: Float
		if (!errorMessage && fieldType === 'float' && fieldId === 'min-value-field' && $('#min-value-field').val()){			
			if( parseFloat($('#min-value-field').val()) <  parseFloat(Configs.DataTypeDef.FIELD_FLOAT_MIN_VALUE) ){
				errorMessage += 'The minimum value should be greater than ' + Configs.DataTypeDef.FIELD_FLOAT_MIN_VALUE;
				$('#min-value-field').addClass('invalid-input');
			}
			if( parseFloat($('#min-value-field').val()) >  parseFloat(Configs.DataTypeDef.FIELD_FLOAT_MAX_VALUE) ){
				errorMessage += 'The minimum value can not be greater than ' + Configs.DataTypeDef.FIELD_FLOAT_MAX_VALUE;
				$('#min-value-field').addClass('invalid-input');
			}
		}	
		if(!errorMessage && fieldType === 'float' && fieldId === 'max-value-field' && $('#max-value-field').val()){
			if( parseFloat($('#max-value-field').val() ) >  parseFloat(Configs.DataTypeDef.FIELD_FLOAT_MAX_VALUE) ){
				errorMessage += 'The maximum value can not be greater than ' + Configs.DataTypeDef.FIELD_FLOAT_MAX_VALUE;
				$('#max-value-field').addClass('invalid-input');
			}
			if( parseFloat($('#max-value-field').val() ) <  parseFloat(Configs.DataTypeDef.FIELD_FLOAT_MIN_VALUE) ){
				errorMessage += 'The maximum value should greater than ' + Configs.DataTypeDef.FIELD_FLOAT_MIN_VALUE;
				$('#max-value-field').addClass('invalid-input');
			}
		}	
		//can't store strings or sequences of non-positive length
		if (!errorMessage && 
		    (targetField.id === 'array-len-field'    || 
		     targetField.id === 'min-str-len-field'  ||
		     targetField.id === 'max-str-len-field') && 
			parseInt(fieldVal, 10) <= 0) {
			errorMessage += 'Please enter a positive integer. ';
		}

		return errorMessage;
	},

	alignAllLabels: function() {
		$('.labelled-input').each(function(index, element) {
			var $element = $(element);
			if ($element.val() !== '') {
				$element.next('label').addClass('active');
			} else {
				$element.next('label').removeClass('active');
			}
		});
	},

	onFieldSelected: function(selectedField) {
		this.selectedField = selectedField;

		if (this.isInitialized)
		{
			this.updateForSelectedField();
		}
	},

	updateForSelectedField: function()
	{
		this.fieldData = null; //clear and get again
		this.fieldDataId = null;
		if (this.selectedField == null || this.selectedField.fieldCount === 0)
		{
			this.fieldSelected = false;
			$('form').addClass('hide');
			return false;
		}
		
		this.fieldSelected = true;
		$('form').removeClass('hide');

		var _this = this;
		var selectedFieldId = this.selectedField.selectedFieldId;
		for (var i = 0, len = this.gFields.length; i<len; i++) {
			if (this.gFields.get(i).id === selectedFieldId) {
				this.fieldData = this.gFields.get(i);
				this.fieldDataId = selectedFieldId;

				//* if old model, must update model*/
				this.updateOldModel();

				this.updateUi();
				this.setSelectOptions();
				this.addModelUpdateListeners();
				this.alignAllLabels();
				this.setEnumValues(this.fieldData.get('enumId'));
				this.enforceValidation();
				break;
			}
		}
	},

	updateOldModel: function() {
		this.gFileModel.beginCompoundOperation();

		if (!this.fieldData.has('maxStrLen')) {
			this.fieldData.set('maxStrLen', this.fieldData.get('strLen'));
		}
		if (!this.fieldData.has('minStrLen')) {
			this.fieldData.set('minStrLen', this.gFileModel.createString(''));
		}

		if (!this.fieldData.has('defDate')) {
			this.fieldData.set('defDate', this.gFileModel.createString(''));
			this.fieldData.set('minDate', this.gFileModel.createString(''));
			this.fieldData.set('maxDate', this.gFileModel.createString(''));
		}
		this.gFileModel.endCompoundOperation();
	},

	alignLabel: function(evt, $label) {
		if (evt.isLocal) { return; } //if the event was called by self, don't worry about labels
		if (evt.target.length) { //if the string isn't empty
			$label.addClass('active');
		} else {
			$label.removeClass('active');
		}
	},

	addModelUpdateListeners: function() {
		var getById = document.getElementById.bind(document);
		var _this = this;

		for (var i = 0, len = this.updateListeningModels.length; i<len; i++) {
			this.updateListeningModels[i].removeAllEventListeners(); //remove all previous event listeners
		}

		this.addListenerForString(this.fieldData.get('name'), getById('name-field'));
		this.addListenerForString(this.fieldData.get('description'), getById('description-field'));
		
		this.addListenerForString(this.fieldData.get('defValue'), getById('def-value-field'));
		this.addListenerForString(this.fieldData.get('minValue'), getById('min-value-field'));
		this.addListenerForString(this.fieldData.get('maxValue'), getById('max-value-field'));

		this.addListenerForString(this.fieldData.get('minStrLen'), getById('min-str-len-field'));
		this.addListenerForString(this.fieldData.get('maxStrLen'), getById('max-str-len-field'));

		this.addListenerForString(this.fieldData.get('arrayLen'), getById('array-len-field'));
	},

	addListenerForString: function(googleModel, element) {
		var _this = this;
		var TextInsertedEvent = gapi.drive.realtime.EventType.TEXT_INSERTED;
		var TextDeletedEvent = gapi.drive.realtime.EventType.TEXT_DELETED;

		var $label = $('label[for="'+element.id+'"]');
		googleModel.addEventListener(TextInsertedEvent, onModelUpdate);
		googleModel.addEventListener(TextDeletedEvent, onModelUpdate);
		_this.updateListeningModels.push(googleModel);

		function onModelUpdate(evt)
		{
			_this.alignLabel(evt, $label);
			element.value = googleModel.text;
		}
	},

	updateAllSelect: function() {
		var _this = this;
		$('#field-type-select').material_select(function() {
			_this.onFieldTypeChanged($('#field-type-dropdown').find('input.select-dropdown').val());
		});
		this.updateRefNameSelectOptions();
		this.updateEnumNameSelectOptions();
	},

	onFieldTypeChanged: function(newFieldType) {
		if (newFieldType === 'enum') {
			this.setEnumValues(this.fieldData.get('enumId'));
		}
		this.gFileModel.beginCompoundOperation();
		this.fieldData.set('type', newFieldType);
		GDriveUtils.resetFieldData(this.fieldData);
		this.gFileModel.endCompoundOperation();

		this.alignAllLabels();
		this.displayCorrectUiComponents(newFieldType);
		this.updateUi();
		this.enforceValidation();
	},

	onRefTypeChanged: function(newRefName) {
		this.fieldData.set('refName', newRefName);
		this.saveUiToGoogle();
	},

	onEnumTypeChanged: function(newEnumName, newEnumId) {
		this.gFileModel.beginCompoundOperation();
		this.fieldData.set('enumId', newEnumId);
		this.setEnumValues(newEnumId);
		this.fieldData.set('enumName', newEnumName);
		this.gFileModel.endCompoundOperation();

		this.saveUiToGoogle();
	},

	setSelectOptions: function() {
		var _this = this;
		if (!this.refs || !this.enums) { return; }

		var refs = this.refs;
		var $refNameSelect = $('#ref-name-select');
		var refOptions = "<option disabled value='default'>select a ref</option>";
		for (i = 0, len = refs.length; i<len; i++) {
			refOptions += '<option data-file-type = "'+refs[i].fileType+'" data-file-id = "'+refs[i].id+'" value = "'+refs[i].id+'">'+refs[i].title+'</option>';
		}
		$refNameSelect.html(refOptions);
		if (this.fieldData) {
			$refNameSelect.val(this.fieldData.get('refId'));
		} else { 
			$refNameSelect.val('default');
		}

		$refNameSelect.material_select(function() {
			_this.onRefTypeChanged($('#ref-name-dropdown').find('.select-dropdown').val());
		});

		//set the same data attributes in the materialized select
		$('#ref-name-dropdown').find('span').each(function(index, element) {
			for (i = 0, len = refs.length; i<len; i++) {
				if (element.text === '' + refs[i].title) {
					element.dataset.fileId = refs[i].id;
					element.dataset.fileType = refs[i].fileType;
					break;
				}
			}
		});

		var enums = this.enums;
		var $enumNameSelect = $('#enum-name-select');
		if (enums.length) {
			var enumOptions = "<option disabled value='default'>select an enum</option>";
			for (i = 0, len = enums.length; i<len; i++) {
				enumOptions += '<option data-file-type = "'+enums[i].fileType+'" data-file-id = "'+enums[i].id+
									'" value = "'+enums[i].id+'">'+enums[i].title+'</option>';
			}
			$enumNameSelect.html(enumOptions);
			if (this.fieldData) { $enumNameSelect.val(this.fieldData.get('enumId')); }
			else { $enumNameSelect.val('default'); }
			
			$enumNameSelect.material_select(function() {
				var selectedEnumObjectName = $('#enum-name-dropdown').find('.select-dropdown').val();
				var selectedEnumFileId = $('#enum-name-select').val();
				_this.onEnumTypeChanged(selectedEnumObjectName, selectedEnumFileId);
			});

			//set the same data attributes in the materialized select
			$('#enum-name-dropdown').find('span').each(function(index, element) {
				for (i = 0, len = enums.length; i<len; i++) {
					if (element.text === '' + enums[i].title) {
						element.dataset.fileId = enums[i].id;
						element.dataset.fileType = enums[i].fileType;
						break;
					}
				}
			});
		} else {
			$enumNameSelect.material_select(function() {
				_this.onEnumTypeChanged($('#enum-name-dropdown').find('.select-dropdown').val());
			});
		}
	},

	addToRefs: function(announcement) {
		var id = announcement.fileId;
		var title = announcement.fileName;
		var fileType = announcement.fileType;
		this.refs.push({
			id: id,
			title: title,
			fileType: fileType
		});
		$('#ref-name-select').append('<option data-file-type = "'+fileType+'" data-file-id = "'+id+'" value = "'+id+'">'+title+'</option>');
		$('#ref-name-dropdown').find('.dropdown-content').append('<li><span data-file-type = "'+fileType+'" data-file-id = "'+id+'">'+title+'</span></li>');
	},

	updateRefNames: function(announcement) {
		var refs = this.refs;
		for (var i = 0, len = refs.length; i<len; i++) {
			if (refs[i].id === announcement.fileId) {
				refs[i].title = announcement.fileNewName;
				break;
			}
		}
		this.updateRefNameSelectOptions();
	},

	updateRefNameSelectOptions: function() {
		var refs = this.refs;
		var refId;
		if (this.fieldData) {
			refId = this.fieldData.get('refId');
			$('#ref-name-select').val(refId);
		}
		$('#ref-name-dropdown').find('span').each(function(index, element) {
			var $element = $(element);
			for (var i = 0, len = refs.length; i<len; i++) {
				if ($element.attr('data-file-id') === refs[i].id) {
					if ($element.text() !== refs[i].title) {
						$element.text(refs[i].title);
					}
					if (refs[i].id === refId) {
						$('#ref-name-dropdown').find('.select-dropdown').val(refs[i].title);
					}
					break;
				}
			}
		});
	}, 

	addToEnums: function(announcement) {
		var id = announcement.fileId;
		var title = announcement.fileName;
		var fileType = announcement.fileType;
		this.enums.push({
			id: id,
			title: title,
			fileType: fileType
		});
		$('#enum-name-select')
			.append('<option data-file-type = "'+fileType+'" data-file-id = "'+id+'" value = "'+id+'">'+title+'</option>');
		$('#enum-name-dropdown').find('.dropdown-content')
			.append('<li><span data-file-type = "'+fileType+'" data-file-id = "'+id+'">'+title+'</span></li>');
	},

	updateEnums: function(announcement) {
		var enums = this.enums;
		for (var i = 0, len = enums.length; i<len; i++) {
			if (enums[i].id === announcement.fileId) {
				enums[i] = {
					id: announcement.fileId,
					title: announcement.fileNewName,
					fileType: announcement.fileType
				};
				break;
			}
		}
		this.updateEnumNameSelectOptions();
	},

	updateEnumNameSelectOptions: function() {
		var enums = this.enums;
		if (this.fieldData) {
			var enumId = this.fieldData.get('enumId');
			if ($('#enum-name-select').val() !== enumId) {
				$('#enum-name-select').val(enumId);
				this.setEnumValues(enumId);
			} else {
				this.updateEnumValueSelectOptions();
			}
		}
		$('#enum-name-dropdown').find('span').each(function(index, element) {
			var $element = $(element);
			for (var i = 0, len = enums.length; i<len; i++) {
				if ($element.attr('data-file-id') === enums[i].id) {
					if ($element.text() !== enums[i].title) {
						$element.text(enums[i].title);
					}
					if (enums[i].id === enumId) {
						$('#enum-name-dropdown').find('.select-dropdown').val(enums[i].title);
					}
					break;
				}
			}
		});
	},

	setEnumValues: function(enumId) {
		var _this = this;
		var $enumValueSelect = $('#enum-value-select');
		$enumValueSelect.html('<option value="default" disabled>loading enum values...</option>');
		$enumValueSelect.material_select();
		if (!enumId || enumId === 'default') {
			$enumValueSelect.html('<option value="default" disabled>select default value</option>');
			$enumValueSelect.prop('disabled', true);
			$enumValueSelect.material_select();
			return;
		}
		GDriveUtils.loadDriveFileDoc(enumId, GDriveConstants.ObjectType.ENUM, function(doc) {
			var enumValues = doc.getModel().getRoot().get(GDriveConstants.CustomObjectKey.ENUM).fields.asArray();
			if (enumValues.length) {
				$enumValueSelect.prop('disabled', false);
				var enumValueOptions = '<option value = "default">no default value</option>';
				for (var i = 0, len = enumValues.length; i<len; i++) {
					enumValueOptions += '<option data-enum-index = "'+enumValues[i].index+'" value = "'+enumValues[i].name+'">'+enumValues[i].name+'</option>';
				}
				$enumValueSelect.html(enumValueOptions);
			} else {
				$enumValueSelect.html('<option value = "default">no enums defined</option>');
				$enumValueSelect.prop('disabled', true);
			}
			$enumValueSelect.material_select(_this.saveUiToGoogle);
			_this.updateEnumValueSelectOptions();
		});
	},

	updateEnumValueSelectOptions: function() {
		var enumValue = this.fieldData.get('enumValue');
		$('#enum-value-dropdown').find('span').each(function(index, element) {
			var $element = $(element);
			if ($element.text() === enumValue) {
				$('#enum-value-dropdown').find('.select-dropdown').val(enumValue);
				return false;
			}
		});
	},

	onNameChange: function(e)
	{
		if (this.validateField(e.currentTarget, this.fieldData.get('type')))
		{
			this.fieldData.get('name').setText(e.currentTarget.value);
		}
	},

	onDescriptionChange: function(e)
	{
		if (this.validateField(e.currentTarget, this.fieldData.get('type')))
		{
			this.fieldData.get('description').setText(e.currentTarget.value);
		}
	},

	getFormContents: function() {
		var inputHandler = this.enforceSingleFieldValidation; //only check current field to save time
		return (
			<form id = 'dmx-form' className='col s12' action='#!'>
				<div className='row'>
					<div className='input-field col s4'>
						<input type='text' id='name-field' className='labelled-input validated-input'
						 onChange={this.onNameChange} required spellCheck='false' />
						<label htmlFor='name-field' className='error-tooltipped'>name *</label>
					</div>
				</div>

				<div className='row'>
					<div className='input-field col s12'>
						<textarea id='description-field' className='materialize-textarea labelled-input' 
							spellCheck='false' 
							onChange={this.onDescriptionChange} />
						<label htmlFor='description-field' >description</label>
					</div>
				</div>

				<div className='row'>
					<div id='field-type-dropdown' className='input-field col s4'>
						<select id='field-type-select' className='type-selector form-select'>
							<option value='double'>double</option>
							<option value='float'>float</option>
							<option value='byte'>byte</option>
							<option value='short'>short</option>
							<option value='integer'>integer</option>
							<option value='long'>long</option>
							<option value='string'>string</option>
							<option value='boolean'>boolean</option>
							<option value='ref'>ref</option>
							<option value='enum'>enum</option>
							<option value='date'>date</option>
							<option value='datetime'>datetime</option>
							<option value='time'>time</option>
						</select>
						<label htmlFor='field-type-select' >type</label>
					</div>

					<div className='input-field col s4 type-specific-field enum-specific-field'>
						<div id='enum-name-dropdown'>
							<select id='enum-name-select' className='enum-name-selector form-select' value='default'>
								<option value='default' disabled>no enums defined</option>
							</select>
							<label htmlFor='enum-name-select' >enum type</label>
						</div>
					</div>
					<div className='col s4 input-field type-specific-field
					 	double-specific-field float-specific-field byte-specific-field integer-specific-field
					 	long-specific-field short-specific-field string-specific-field ref-specific-field'>
						<input type='text' id='def-value-field' className='labelled-input validated-input' spellCheck='false' onChange={this.saveUiToGoogle}/>
						<label htmlFor='def-value-field' className='error-tooltipped'>default value</label>
					</div>
					<div className='col s4 input-field type-specific-field date-specific-field datetime-specific-field time-specific-field'>
						<input type='text' id='def-date-field' className='labelled-input date-input validated-input' onChange={this.saveUiToGoogle} />
						<label htmlFor='def-date-field' className='error-tooltipped'>default value</label>
						<input type='hidden' id='def-datetime-date' />
						<input type='hidden' id='def-datetime-time' />
					</div>
					<div className='col s4 type-specific-field boolean-specific-field'>
						<br />
						<input type='checkbox' id='def-value-checkbox' className='filled-in' onChange={this.saveUiToGoogle} />
						<label htmlFor='def-value-checkbox' >default value</label>
					</div>

					<div id='checkbox-field' className='col s4'>
						<input type='checkbox' id='optional-checkbox' className='filled-in' onChange={this.saveUiToGoogle} />
						<label htmlFor='optional-checkbox' >optional</label>
						<br />
						<input type='checkbox' id='array-checkbox' className='filled-in' onChange={this.saveUiToGoogle} />
						<label htmlFor='array-checkbox' >array</label>
					</div>
				</div>

				<div className='row type-specific-field ref-specific-field'>
					<div id='ref-name-dropdown' className='input-field col s4'>
						<select id='ref-name-select' className='ref-name-selector form-select' value='default'>
							<option value='default' disabled>loading refs...</option>
						</select>
						<label htmlFor='ref-name-select' >ref</label>
					</div>
					<div className='col s4'>
						<br />
						<input name="ref-group" className='with-gap' type="radio" id="ref-soft-radio" onChange={this.saveUiToGoogle} />
						<label htmlFor="ref-soft-radio" className='ref-radio-label'>soft</label>
						<input name="ref-group" className='with-gap' type="radio" id="ref-hard-radio" onChange={this.saveUiToGoogle} />
						<label htmlFor="ref-hard-radio" className='ref-radio-label'>hard</label>
					</div>
				</div>

				<div className='row'>
					<div className='type-specific-field enum-specific-field'>
						<div id='enum-value-dropdown' className='input-field col s4'>
							<select id='enum-value-select' className='enum-value-selector form-select' value='default'>
								<option value='default' disabled>loading enum values...</option>
							</select>
							<label htmlFor='enum-value-select' >default enum value</label>
						</div>
					</div>
					<div className='type-specific-field string-specific-field'>
						<div className='input-field col s4'>
							<input type='text' id='min-str-len-field' 
								className='labelled-input number-input integer-input validated-input' 
								onChange={this.saveUiToGoogle} />
							<label htmlFor='min-str-len-field' className='error-tooltipped'>min string length</label>
						</div>
						<div className='input-field col s4'>
							<input type='text' id='max-str-len-field' 
								className='labelled-input number-input integer-input validated-input' 
								onChange={this.saveUiToGoogle}
								defaultValue="" required />
							<label htmlFor='max-str-len-field' className='error-tooltipped'>max string length*</label>
						</div>
					</div>
					<div className='type-specific-field double-specific-field float-specific-field byte-specific-field
					     integer-specific-field long-specific-field short-specific-field'>
						<div className='input-field col s4'>
							<input type='text' id='min-value-field' className='labelled-input number-input validated-input' onChange={this.saveUiToGoogle} />
							<label htmlFor='min-value-field' className='error-tooltipped'>min value</label>
						</div>
						<div className='input-field col s4'>
							<input type='text' id='max-value-field' className='labelled-input number-input validated-input' onChange={this.saveUiToGoogle} />
							<label htmlFor='max-value-field' className='error-tooltipped'>max value</label>
						</div>
					</div>
					<div className='type-specific-field date-specific-field datetime-specific-field time-specific-field'>
						<div className='input-field col s4'>
							<input type='text' id='min-date-field' className='labelled-input date-input validated-input' />
							<label htmlFor='min-date-field' className='labelled-input error-tooltipped'>min value</label>
							<input type='hidden' id='min-datetime-date' />
							<input type='hidden' id='min-datetime-time' />
						</div>
						<div className='input-field col s4'>
							<input type='text' id='max-date-field' className='labelled-input date-input validated-input' />
							<label htmlFor='max-date-field' className='labelled-input error-tooltipped'>max value</label>
							<input type='hidden' id='max-datetime-date' />
							<input type='hidden' id='max-datetime-time' />
						</div>
					</div>

					<div id='array-len-wrapper' className='input-field col type-specific-field s4 right'>
						<input type='text' id='array-len-field' className='labelled-input validated-input number-input integer-input' 
							   onInput={inputHandler} onChange={this.saveUiToGoogle} required />
						<label htmlFor='array-len-field' className='error-tooltipped'>array length *</label>
					</div>
				</div>

				<div className='row'>
					<div className='col s12'>
						<br />
						<input type='checkbox' id='context-id-checkbox' className='filled-in' onChange={this.saveUiToGoogle} />
						<label htmlFor='context-id-checkbox' >context identifier</label>
					</div>
				</div>
			</form>
		);
	},

	render: function() {
		var formContents = this.getFormContents();
		return (
			<div className='row'>
				{formContents}	
			</div>
		);
	}
});
