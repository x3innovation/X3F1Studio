var EventType = require('../../constants/event-type.js');
var AnnouncementType = require('../../constants/announcement-type.js');
var GDriveConstants = require('../../constants/google-drive-constants.js');

var GDriveService = require('../../services/google-drive-service.js');

var Configs = require('../../app-config.js');

module.exports = React.createClass({
	/* ******************************************
				LIFE CYCLE FUNCTIONS
	****************************************** */
	componentWillMount: function() {
		this.gModel = null;
		this.gFields = null;
		this.fieldData = null;
		this.fieldDataId = null;
		this.fieldSelected = false;
		this.gBindings = [];

		Bullet.on(EventType.EntryForm.GAPI_FILE_LOADED, 'form.jsx>>onGapiFileLoaded', this.onGapiFileLoaded);
		Bullet.on(EventType.EntryForm.METADATA_MODEL_LOADED, 'form.jsx>>onMetadataModelLoaded', this.onMetadataModelLoaded);
		Bullet.on(EventType.EntryForm.FIELD_SELECTED, 'form.jsx>>onFieldSelected', this.onFieldSelected);
	},

	componentDidMount: function() {
		this.initializeTooltips();
		this.initializeDatepicker();
		$('.text-input').keypress(function(e) {
			var code = (e.keyCode || e.which);
			if (code === 13) { //enter was detected, ignore keypress
				$(e.currentTarget).blur();
				return false;
			}
		});
		window.onbeforeunload = this.showWarningMessageWhenInvalid;
		window.onhashchange = this.showWarningMessageWhenInvalid;

		setInterval(this.enforceValidation, Configs.EntryForm.VALIDATION_INTERVAL);
	},

	componentWillUnmount: function() {
		this.gModel = null;
		this.gFields = null;
		this.fieldData = null;
		this.fieldDataId = null;
		this.fieldSelected = false;
		this.gBindings = [];

		if (this.gFields) { this.gFields.removeAllEventListeners(); }
		$('.error-tooltipped').tooltipster('destroy');

		Bullet.off(EventType.EntryForm.GAPI_FILE_LOADED, 'form.jsx>>onGapiFileLoaded');
		Bullet.off(EventType.EntryForm.METADATA_MODEL_LOADED, 'form.jsx>>onMetadataModelLoaded');
		Bullet.off(EventType.EntryForm.FIELD_SELECTED, 'form.jsx>>onFieldSelected');
	},

	/* ******************************************
			   NON LIFE CYCLE FUNCTIONS
	****************************************** */
	showWarningMessageWhenInvalid: function(e) {
		this.enforceValidation();
		if ($('.invalid-input').length) {
			return 'Warning: Invalid fields were found, please fix them before navigating away.';
		}
		return null;
	},

	onGapiFileLoaded: function(doc) {
		this.gModel = doc.getModel();
		this.gFields = this.gModel.getRoot().get(this.props.gapiKey).fields;
		this.gFields.addEventListener(gapi.drive.realtime.EventType.VALUES_SET, this.updateUi);
		this.loadDataFiles();
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
		var that = this;
		var DATE_FORMAT = 'MM/DD/YYYY';
		var TIME_FORMAT = 'HH:mm:ss:SSS';
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
				var fieldType = that.fieldData.get('type');
				var optionsToSet = {};
				switch (fieldType) {
					case "datetime":
						optionsToSet.format = DATE_FORMAT + ' ' + TIME_FORMAT,
						optionsToSet.datepicker = true;
						optionsToSet.timepicker = true;
						break;
					case "date":
						optionsToSet.format = DATE_FORMAT,
						optionsToSet.timepicker = false;
						optionsToSet.datepicker = true;
						break;
					case "time":
						optionsToSet.format = TIME_FORMAT,
						optionsToSet.datepicker = true;
						optionsToSet.timepicker = false;
						break;
					default: break;
				}
				this.setOptions(optionsToSet);
			},
			onChangeDateTime: function() {
				that.saveUiToGoogle();
			}
		};

		$('#def-date-field').datetimepicker(datepickerOptions);
		$('#min-date-field').datetimepicker(datepickerOptions);
		$('#max-date-field').datetimepicker(datepickerOptions);
	},

	onMetadataModelLoaded: function(metadataModel) {
		var that = this;
		GDriveService.registerAnnouncement(metadataModel, function() {
			var announcement = metadataModel.announcement.get(0); //get first announcement
			switch (announcement.action) {
				case AnnouncementType.ADD_FILE:
					// don't catch adding the current file's announcement
					if (announcement.fileId === that.props.fileId) { return; }
					switch (announcement.fileType) {
						case GDriveConstants.ObjectType.PERSISTENT_DATA:
						case GDriveConstants.ObjectType.SNIPPET:
						case GDriveConstants.ObjectType.EVENT:
							that.addToRefs(announcement);
							break;
						case GDriveConstants.ObjectType.ENUM:
							that.addToEnums(announcement);
							break;
						default: break;
					} break;
				case AnnouncementType.RENAME_FILE:
					switch (announcement.fileType) {
						case GDriveConstants.ObjectType.PERSISTENT_DATA:
						case GDriveConstants.ObjectType.SNIPPET:
						case GDriveConstants.ObjectType.EVENT:
							that.updateRefNames(announcement);
							break;
						case GDriveConstants.ObjectType.ENUM:
							that.updateEnums(announcement);
							break;
						default: break;
					} break;
				case AnnouncementType.ADD_ENUM:
					if (announcement.fileId === that.fieldData.get('enumId')) { 
					// if the active enum doesn't match the updated enum, then any update would be unnoticed to the user anyways
						that.setEnumValues(announcement.fileId);
					} break;
				case AnnouncementType.DELETE_ENUM:
					if (announcement.fileId === that.fieldData.get('enumId')) {
						that.setEnumValues(announcement.fileId);
					} break;
				case AnnouncementType.RENAME_ENUM:
					if (announcement.fileId === that.fieldData.get('enumId')) {
						that.setEnumValues(announcement.fileId);
					} break;
				default: break;
			}
		});
	},

	updateUi: function() {
		if (!this.fieldData) { return; }

		this.displayCorrectUiComponents();

		var getById = document.getElementById.bind(document);
		getById('field-type-select').value = this.fieldData.get('type');
		getById('enum-value-select').value = this.fieldData.get('enumValue');

		getById('def-date-field').value = this.fieldData.get('defDate');
		getById('min-date-field').value = this.fieldData.get('minDate');
		getById('max-date-field').value = this.fieldData.get('maxDate');

		getById('ref-soft-radio').checked = this.fieldData.get('refType') === 'soft';
		getById('ref-hard-radio').checked = this.fieldData.get('refType') === 'hard';
		getById('def-value-checkbox').checked = this.fieldData.get('defValueBool');
		getById('optional-checkbox').checked = this.fieldData.get('optional');
		getById('array-checkbox').checked =  this.fieldData.get('array');
		getById('context-id-checkbox').checked =  this.fieldData.get('contextId');
		this.updateAllSelect();
	},

	saveUiToGoogle: function() {
		var fieldIndex;
		for (var i = 0, len = this.gFields.length; i<len; i++) {
			if (this.gFields.get(i).id === this.fieldData.id) {
				fieldIndex = i;
				break;
			}
		}

		var getById = document.getElementById.bind(document);
		this.fieldData.set('type', getById('field-type-select').value);
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

		this.fieldData.get('defDate').setText(getById('def-date-field').value));
		this.fieldData.get('minDate').setText(getById('min-date-field').value));
		this.fieldData.get('maxDate').setText(getById('max-date-field').value));

		this.fieldData.set('defValueBool', getById('def-value-checkbox').checked);
		this.fieldData.set('optional', getById('optional-checkbox').checked);
		this.fieldData.set('array', getById('array-checkbox').checked);
		this.fieldData.set('contextId', getById('context-id-checkbox').checked);
		this.gFields.set(fieldIndex, this.fieldData);
	},

	displayCorrectUiComponents: function(fieldType) {
		fieldType = fieldType || this.fieldData.get('type');
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
		if (!this.gModel || !this.fieldData) { return; } //if field not selected, validation doesn't make sense

		var validateField = this.validateField;
		fieldType = fieldType || this.fieldData.get('type');
		$('.validated-input:visible').each(function() {
			validateField(this, fieldType);
		});
	},

	enforceSingleFieldValidation: function(e) {
		if (!this.gModel || !this.fieldData) { return; } //if google model not connected, validation doesn't make sense

		this.validateField(e.currentTarget, this.fieldData.get('type'));
	},

	validateField: function(targetField, fieldType) {
		var $targetField = $(targetField);
		var errorMessage = this.setErrorMessage(targetField, fieldType);

		var $fieldLabel = $targetField.next('label');

		if (errorMessage) {
			$targetField.addClass('invalid-input');
			if ($fieldLabel.tooltipster('content') !== errorMessage) {
				$fieldLabel.tooltipster('content', errorMessage);
			}
			$fieldLabel.tooltipster('show');
			//$targetField.focus(); //force user to fix
		} else if ($targetField.hasClass('invalid-input')) {
			$targetField.removeClass('invalid-input');
			$fieldLabel.tooltipster('show'); // show before hide to ensure tooltipster can be hidden
			$fieldLabel.tooltipster('hide');
		}
	},

	setErrorMessage: function(targetField, fieldType) {
		var $targetField = $(targetField);
		var fieldVal = $targetField.val();
		var errorMessage = '';
		var fieldId = targetField.id;

		if (!errorMessage && $targetField.prop('required') && !fieldVal) {
			errorMessage += 'This is a required field. ';
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
		if (fieldType === 'datetime') {
			dateFormat = 'MM/DD/YYYY HH:mm:ss:SSS'
		} else if (fieldType === 'date') {
			dateFormat = 'MM/DD/YYYY'
		} else if (fieldType === 'time') {
			dateFormat = 'HH:mm:ss:SSS'
		}
		var parseDate = function(dateVal) {return moment(dateVal, dateFormat)};
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
		if (!errorMessage && fieldId === 'max-value-field' && !isNaN($('#min-value-field').val())
		 	&& parseFloat(fieldVal) < parseFloat($('#min-value-field').val())) {
			errorMessage += 'Max value should be greater than or equal to min value. ';
			$('#min-value-field').addClass('invalid-input');
		}
		//the max length field must be >= the min length field
		if (!errorMessage && fieldId === 'max-str-len-field' && !isNaN($('#min-str-len-field').val())
		 	&& parseFloat(fieldVal) < parseFloat($('#min-str-len-field').val())) {
			errorMessage += 'Max string length should be greater than or equal to min string length. ';
			$('#min-str-len-field').addClass('invalid-input');
		}

		//the max date field must be >= the min date field
		if (!errorMessage && fieldId === 'max-date-field' && $('#min-date-field').val()
		 	&& parseDate(fieldVal).isBefore(parseDate($('#min-date-field').val()))) {
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
			if (!isNaN($('#max-str-len-field').val()) && fieldVal.length > parseInt($('#max-value-field').val(), 10)) {
				errorMessage += 'Default value should be within defined maximum length. ';
			}
		}
		//default-value field for dates has a user-defined range
		if (!errorMessage && fieldId === 'def-date-field') {
			if ($('#max-date-field').val()
			    && parseDate(fieldVal).isAfter(parseDate($('#max-date-field').val()))) {
				errorMessage += 'Default date should not be after defined maximum date. ';
			}
			if (!isNaN($('#min-date-field').val()) 
			    && parseDate(fieldVal).isBefore(parseDate($('#min-date-field').val()))) {
				errorMessage += 'Default date should not be before defined minimum date. ';
			}
		}

		//can't store strings or sequences of non-positive length
		if (!errorMessage && (targetField.id === 'array-len-field' || 
		    						 targetField.id === 'min-str-len-field' ||
		    						 targetField.id === 'max-str-len-field') && 
			parseInt(fieldVal, 10) <= 0) {
			errorMessage += 'Please enter a positive integer. ';
		}

		return errorMessage;
	},

	alignAllLabels: function() {
		$('input').each(function(index, element) {
			var $element = $(element);
			if ($element.val() !== '') {
				$element.next('label').addClass('active');
			} else {
				$element.next('label').removeClass('active');
			}
		});
	},

	onFieldSelected: function(data) {
		this.fieldData = null; //clear and get again
		this.fieldDataId = null;
		if (data.fieldCount === 0) {
			this.fieldSelected = false;
			$('form').addClass('hide');
			return false;
		}
		
		this.fieldSelected = true;
		$('form').removeClass('hide');

		var that = this;
		var selectedFieldId = data.selectedFieldId;
		for (var i = 0, len = this.gFields.length; i<len; i++) {
			if (this.gFields.get(i).id === selectedFieldId) {
				this.fieldData = this.gFields.get(i);
				this.fieldDataId = selectedFieldId;

				//* if old model, must update model*/
				this.updateOldModel();

				this.updateUi();
				this.setSelectOptions();
				this.rebindStrings();
				this.alignAllLabels();
				this.setEnumValues(this.fieldData.get('enumId'));
				this.enforceValidation();
				break;
			}
		}
	},

	updateOldModel: function() {
		if (!this.fieldData.has('maxStrLen')) {
			this.fieldData.set('maxStrLen', this.fieldData.get('strLen'));
			this.fieldData.set('minStrLen', this.gModel.createString(''));
		}

		if (!this.fieldData.has('defDate')) {
			this.fieldData.set('defDate', this.gModel.createString(''));
			this.fieldData.set('minDate', this.gModel.createString(''));
			this.fieldData.set('maxDate', this.gModel.createString(''));
		}
	},

	rebindStrings: function() {
		var bindString = gapi.drive.realtime.databinding.bindString;
		var TextInsertedEvent = gapi.drive.realtime.EventType.TEXT_INSERTED;
		var TextDeletedEvent = gapi.drive.realtime.EventType.TEXT_DELETED;
		var getById = document.getElementById.bind(document);
		var that = this;

		var alignLabel = function(evt, $label) {
			if (evt.isLocal) { return; } //if the event was called by self, don't worry about labels
			if (evt.target.length) { //if the string isn't empty
				$label.addClass('active');
			} else {
				$label.removeClass('active');
			}
		};

		var setGBinding = function(stringToBind, field) {
			var $label = $('label[for="'+field.id+'"]');
			stringToBind.addEventListener(TextInsertedEvent, function(evt) {alignLabel(evt, $label);});
			stringToBind.addEventListener(TextDeletedEvent, function(evt) {alignLabel(evt, $label);});
			that.gBindings.push(bindString(stringToBind, field));
		};

		for (var i = 0, len = this.gBindings.length; i<len; i++) {
			this.gBindings[i].unbind(); //unbind the previous strings
		}

		setGBinding(this.fieldData.get('name'), getById('name-field'));
		setGBinding(this.fieldData.get('description'), getById('description-field'));
		
		setGBinding(this.fieldData.get('defValue'), getById('def-value-field'));
		setGBinding(this.fieldData.get('minValue'), getById('min-value-field'));
		setGBinding(this.fieldData.get('maxValue'), getById('max-value-field'));

		setGBinding(this.fieldData.get('minStrLen'), getById('min-str-len-field'));
		setGBinding(this.fieldData.get('maxStrLen'), getById('max-str-len-field'));

		setGBinding(this.fieldData.get('arrayLen'), getById('array-len-field'));
	},

	updateAllSelect: function() {
		var that = this;
		$('#field-type-select').material_select(function() {
			that.onFieldTypeChanged($('#field-type-dropdown').find('input.select-dropdown').val());
		});
		this.updateRefNameSelectOptions();
		this.updateEnumNameSelectOptions();
	},

	onFieldTypeChanged: function(newFieldType) {
		if (newFieldType === 'enum') {
			this.setEnumValues(this.fieldData.get('enumId'));
		}
		GDriveService.resetFieldData(this.fieldData);
		this.alignAllLabels();
		this.displayCorrectUiComponents(newFieldType);
		this.enforceValidation(newFieldType);
		this.saveUiToGoogle();
	},

	onRefTypeChanged: function(newRefName) {
		this.fieldData.set('refName', newRefName);
		this.saveUiToGoogle();
	},

	onEnumTypeChanged: function(newEnumName) {
		this.fieldData.set('enumName', newEnumName);
		var newEnumId = '';
		var that = this;
		$('#enum-name-dropdown').find('span').each(function(index, element) {
			var $element = $(element);
			if ($element.text() === newEnumName) {
				newEnumId = $element.attr('data-file-id');
				that.fieldData.set('enumId', newEnumId);
				that.setEnumValues(newEnumId);
				return false;
			}
		});
		this.saveUiToGoogle();
	},

	loadDataFiles: function() {
		var objectsToGet = { //only need the dmx types
			persistentData: true,
			enum: true,
			snippet: true,
			event: true,
			flow: false
		};
		GDriveService.getProjectObjects(this.props.projectFolderFileId, '', objectsToGet, this.onFilesLoaded);
	},

	onFilesLoaded: function(fileObjects) {
		this.refs = [];
		this.enums = [];
		var fileObject;
		for (var i = 0, len = fileObjects.length; i<len; i++) {
			fileObject = {
				id: fileObjects[i].id,
				title: fileObjects[i].title,
				fileType: fileObjects[i].description 
			};
			//the drive file description contains the object type
			switch (fileObjects[i].description) {
				case GDriveConstants.ObjectType.PERSISTENT_DATA:
				case GDriveConstants.ObjectType.SNIPPET:
				case GDriveConstants.ObjectType.EVENT:
					this.refs.push(fileObject);
					break;
				case GDriveConstants.ObjectType.ENUM:
					this.enums.push(fileObject);
					break;
				default: break;
			}
		}
		this.setSelectOptions();
	},

	setSelectOptions: function() {
		var that = this;
		if (!this.refs || !this.enums) { return; }

		var refs = this.refs;
		var $refNameSelect = $('#ref-name-select');
		var refOptions = "<option disabled value='default'>select a ref</option>";
		for (i = 0, len = refs.length; i<len; i++) {
			refOptions += '<option data-file-type = "'+refs[i].fileType+'" data-file-id = "'+refs[i].id+'" value = "'+refs[i].id+'">'+refs[i].title+'</option>';
		}
		$refNameSelect.html(refOptions);
		if (this.fieldData) { $refNameSelect.val(this.fieldData.get('refId')); } 
		else { $refNameSelect.val('default'); }
		$refNameSelect.material_select(function() {
			that.onRefTypeChanged($('#ref-name-dropdown').find('.select-dropdown').val());
		});
		$('#ref-name-dropdown').find('span').each(function(index, element) {
			var $element = $(element);
			for (i = 0, len = refs.length; i<len; i++) {
				if ($element.text() === '' + refs[i].title) {
					$element.attr('data-file-id', refs[i].id).attr('data-file-type', refs[i].fileType);
					break;
				}
			}
		});

		var enums = this.enums;
		var $enumNameSelect = $('#enum-name-select');
		if (enums.length) {
			var enumOptions = "<option disabled value='default'>select an enum</option>";
			for (i = 0, len = enums.length; i<len; i++) {
				enumOptions += '<option data-file-type = "'+enums[i].fileType+'" data-file-id = "'+enums[i].id+'" value = "'+enums[i].id+'">'+enums[i].title+'</option>';
			}
			$enumNameSelect.html(enumOptions);
			if (this.fieldData) { $enumNameSelect.val(this.fieldData.get('enumId')); }
			else { $enumNameSelect.val('default'); }
			
			$enumNameSelect.material_select(function() {
				that.onEnumTypeChanged($('#enum-name-dropdown').find('.select-dropdown').val());
			});
			$('#enum-name-dropdown').find('span').each(function(index, element) {
				var $element = $(element);
				for (i = 0, len = enums.length; i<len; i++) {
					if ($element.text() === '' + enums[i].title) {
						$element.attr('data-file-id', enums[i].id).attr('data-file-type', enums[i].fileType);
						break;
					}
				}
			});
		} else {
			$enumNameSelect.material_select(function() {
				that.onEnumTypeChanged($('#enum-name-dropdown').find('.select-dropdown').val());
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
		var that = this;
		var $enumValueSelect = $('#enum-value-select');
		$enumValueSelect.html('<option value="default" disabled>loading enum values...</option>');
		$enumValueSelect.material_select();
		if (!enumId || enumId === 'default') {
			$enumValueSelect.html('<option value="default" disabled>select default value</option>');
			$enumValueSelect.prop('disabled', true);
			$enumValueSelect.material_select();
			return;
		}
		gapi.drive.realtime.load(enumId, function(doc) {
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
			$enumValueSelect.material_select(that.saveUiToGoogle);
			that.updateEnumValueSelectOptions();
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

	getFormContents: function() {
		var inputHandler = this.enforceSingleFieldValidation; //only check current field to save time
		return (
			<form id = 'dmx-form' className='hide col s12' action='#!'>
				<div className='row'>
					<div className='input-field col s4'>
						<input type='text' id='name-field' className='text-input validated-input'
						 onInput={inputHandler} required />
						<label htmlFor='name-field' className='error-tooltipped'>name *</label>
					</div>
				</div>

				<div className='row'>
					<div className='input-field col s12'>
						<textarea id='description-field' className='materialize-textarea text-input' />
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
						<input type='text' id='def-value-field' className='text-input validated-input' />
						<label htmlFor='def-value-field' className='error-tooltipped'>default value</label>
					</div>
					<div className='col s4 input-field type-specific-field date-specific-field datetime-specific-field time-specific-field'>
						<input type='text' id='def-date-field' className='date-input validated-input' onChange={this.saveUiToGoogle} />
						<label htmlFor='def-date-field' className='error-tooltipped'>default value</label>
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
							<input type='text' id='min-str-len-field' className='text-input number-input integer-input validated-input' />
							<label htmlFor='min-str-len-field' className='error-tooltipped'>min string length</label>
						</div>
						<div className='input-field col s4'>
							<input type='text' id='max-str-len-field' className='text-input number-input integer-input validated-input' />
							<label htmlFor='max-str-len-field' className='error-tooltipped'>max string length</label>
						</div>
					</div>
					<div className='type-specific-field double-specific-field float-specific-field byte-specific-field
					     integer-specific-field long-specific-field short-specific-field'>
						<div className='input-field col s4'>
							<input type='text' id='min-value-field' className='text-input number-input validated-input' />
							<label htmlFor='min-value-field' className='error-tooltipped'>min value</label>
						</div>
						<div className='input-field col s4'>
							<input type='text' id='max-value-field' className='text-input number-input validated-input' />
							<label htmlFor='max-value-field' className='error-tooltipped'>max value</label>
						</div>
					</div>
					<div className='type-specific-field date-specific-field datetime-specific-field time-specific-field'>
						<div className='input-field col s4'>
							<input type='text' id='min-date-field' className='date-input validated-input' />
							<label htmlFor='min-date-field' className='error-tooltipped'>min date</label>
						</div>
						<div className='input-field col s4'>
							<input type='text' id='max-date-field' className='date-input validated-input' />
							<label htmlFor='max-date-field' className='error-tooltipped'>max date</label>
						</div>
					</div>

					<div id='array-len-wrapper' className='input-field col type-specific-field s4 right'>
						<input type='text' id='array-len-field' className='text-input validated-input number-input integer-input' 
							   onInput={inputHandler} required />
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
