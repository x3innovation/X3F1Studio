var EventType = require('../../constants/event-type.js');
var AnnouncementType = require('../../constants/announcement-type.js');
var GDriveConstants = require('../../constants/google-drive-constants.js');

var GDriveService = require('../../services/google-drive-service.js');

module.exports = React.createClass({
	/* ******************************************
				LIFE CYCLE FUNCTIONS
	****************************************** */
	componentWillMount: function() {
		this.gModel = null;
		this.gFields = null;
		this.fieldSelected = false;
		this.fieldData = {};
		this.elements = {};
		this.gBindings = {};

		Bullet.on(EventType.EntryForm.GAPI_FILE_LOADED, 'form.jsx>>onGapiFileLoaded', this.onGapiFileLoaded);
		Bullet.on(EventType.EntryForm.METADATA_MODEL_LOADED, 'form.jsx>>onMetadataModelLoaded', this.onMetadataModelLoaded);
		Bullet.on(EventType.EntryForm.FIELD_SELECTED, 'form.jsx>>onFieldSelected', this.onFieldSelected);
	},

	componentDidMount: function() {
		this.setElements();
	},

	componentWillUnmount: function() {
		Bullet.off(EventType.EntryForm.GAPI_FILE_LOADED, 'form.jsx>>onGapiFileLoaded');
		Bullet.off(EventType.EntryForm.METADATA_MODEL_LOADED, 'form.jsx>>onMetadataModelLoaded');
		Bullet.off(EventType.EntryForm.FIELD_SELECTED, 'form.jsx>>onFieldSelected');
	},

	/* ******************************************
			   NON LIFE CYCLE FUNCTIONS
	****************************************** */
	setElements: function () { //so jquery calls are less frequent
		this.elements.nameField = $('#name-field');
		this.elements.descriptionField = $('#description-field');
		this.elements.defValueField = $('#def-value-field');
		this.elements.minValueField = $('#min-value-field');
		this.elements.maxValueField = $('#max-value-field');
		this.elements.strLenField = $('#str-len-field');
		this.elements.arrayLenField = $('#array-len-field');
		this.elements.fieldTypeSelect = $('#field-type-select');
		this.elements.refNameSelect = $('#ref-name-select');
		this.elements.enumNameSelect = $('#enum-name-select');
		this.elements.enumValueSelect = $('#enum-value-select');
		this.elements.refSoftRadio = $('#ref-soft-radio');
		this.elements.refHardRadio = $('#ref-hard-radio');
		this.elements.defValueCheckbox = $('#def-value-checkbox');
		this.elements.readOnlyCheckbox = $('#read-only-checkbox');
		this.elements.optionalCheckbox = $('#optional-checkbox');
		this.elements.arrayCheckbox = $('#array-checkbox');
		this.elements.contextIdCheckbox = $('#context-id-checkbox');
	},

	onGapiFileLoaded: function(doc) {
		this.loadDataFiles();

		this.gModel = doc.getModel();
		this.gFields = this.gModel.getRoot().get(this.props.gapiKey).fields;
		this.gFields.addEventListener(gapi.drive.realtime.EventType.VALUES_SET, this.updateUi);
		this.connectUi();
	},

	onMetadataModelLoaded: function(metadataModel) {
		var that = this;
		GDriveService.registerAnnouncement(metadataModel, function() {
			var announcement = metadataModel.announcement.get(0);
			if (announcement.action === AnnouncementType.ADD_FILE) {
				if (announcement.fileId === that.props.fileId) { return; }
				if (announcement.fileType === GDriveConstants.ObjectType.PERSISTENT_DATA) {
					that.addToRefs(announcement);
				} else if (announcement.fileType === GDriveConstants.ObjectType.ENUM) {
					that.addToEnums(announcement);
				} else if (announcement.fileType === GDriveConstants.ObjectType.SNIPPET) {
					that.addToRefs(announcement);
				} else if (announcement.fileType === GDriveConstants.ObjectType.EVENT) {
					that.addToRefs(announcement);
				}
			} else if (announcement.action === AnnouncementType.RENAME_FILE) {
				if (announcement.fileType === GDriveConstants.ObjectType.PERSISTENT_DATA) {
					that.updateRefNames(announcement);
				} else if (announcement.fileType === GDriveConstants.ObjectType.ENUM) {
					that.updateEnums(announcement);
				} else if (announcement.fileType === GDriveConstants.ObjectType.SNIPPET) {
					that.updateRefNames(announcement);
				} else if (announcement.fileType === GDriveConstants.ObjectType.EVENT) {
					that.updateRefNames(announcement);
				}
			} else if (announcement.action === AnnouncementType.ADD_ENUM) {
				if (announcement.fileId === that.fieldData.get('enumId')) {
					that.setEnumValues(announcement.fileId);
				}
			} else if (announcement.action === AnnouncementType.DELETE_ENUM) {
				if (announcement.fileId === that.fieldData.get('enumId')) {
					that.setEnumValues(announcement.fileId);
				}
			} else if (announcement.action === AnnouncementType.RENAME_ENUM) {
				if (announcement.fileId === that.fieldData.get('enumId')) {
					that.setEnumValues(announcement.fileId);
				}
			}
		});
	},


	updateUi: function() {
		if (Object.keys(this.fieldData).length === 0) { return;	}
		this.displayCorrectUiComponents();
		this.elements.fieldTypeSelect.val(this.fieldData.get('type'));
		this.elements.enumValueSelect.val(this.fieldData.get('enumValue'));
		var refType = this.fieldData.get('refType');
		this.elements.refSoftRadio.prop('checked', refType === 'soft');
		this.elements.refHardRadio.prop('checked', refType === 'hard');
		this.elements.defValueCheckbox.prop('checked', this.fieldData.get('defValueBool'));
		this.elements.readOnlyCheckbox.prop('checked', this.fieldData.get('readOnly'));
		this.elements.optionalCheckbox.prop('checked', this.fieldData.get('optional'));
		this.elements.arrayCheckbox.prop('checked', this.fieldData.get('array'));
		this.elements.contextIdCheckbox.prop('checked', this.fieldData.get('contextId'));
		this.updateAllSelect();
	},

	connectUi: function() {
		this.elements.defValueCheckbox.change(this.saveUiToGoogle);
		this.elements.readOnlyCheckbox.change(this.saveUiToGoogle);
		this.elements.optionalCheckbox.change(this.saveUiToGoogle);
		this.elements.arrayCheckbox.change(this.saveUiToGoogle);
		this.elements.contextIdCheckbox.change(this.saveUiToGoogle);
		this.elements.refSoftRadio.change(this.saveUiToGoogle);
		this.elements.refHardRadio.change(this.saveUiToGoogle);
	},

	saveUiToGoogle: function() {
		var fieldIndex;
		for (var i = 0, len = this.gFields.length; i<len; i++) {
			if (this.gFields.get(i).get('ID') === this.fieldData.get('ID')) {
				fieldIndex = i;
				break;
			}
		}
		this.fieldData.set('type',this.elements.fieldTypeSelect.val());
		this.fieldData.set('refId', this.elements.refNameSelect.val());
		var newRefType = '';
		if (this.elements.refSoftRadio.prop('checked')) {
			newRefType = 'soft';
		} else if (this.elements.refHardRadio.prop('checked')) {
			newRefType = 'hard';
		}
		this.fieldData.set('refType', newRefType);
		this.fieldData.set('enumId', this.elements.enumNameSelect.val());
		this.fieldData.set('enumValue', this.elements.enumValueSelect.val());
		this.fieldData.set('defValueBool', this.elements.defValueCheckbox.prop('checked'));
		this.fieldData.set('readOnly', this.elements.readOnlyCheckbox.prop('checked'));
		this.fieldData.set('optional', this.elements.optionalCheckbox.prop('checked'));
		this.fieldData.set('array', this.elements.arrayCheckbox.prop('checked'));
		this.fieldData.set('contextId', this.elements.contextIdCheckbox.prop('checked'));
		this.gFields.set(fieldIndex, this.fieldData);
	},

	displayCorrectUiComponents: function() {
		$('.type-specific-field').addClass('hide');
		$('.'+this.fieldData.get('type')+'-specific-field').removeClass('hide');
		if (this.fieldData.get('array')) {
			$('#array-len-wrapper').removeClass('hide');
		}
	},

	alignAllLabels: function() {
		$('.text-input').each(function(index, element) {
			var $element = $(element);
			if ($element.val() !== '') {
				$element.next('label').addClass('active');
			} else {
				$element.next('label').removeClass('active');
			}
		});
	},

	onFieldSelected: function(data) {
		if (data.fieldCount === 0) {
			this.fieldSelected = false;
			$('form').addClass('hide');
			this.forceUpdate();
			return false;
		}

		if (!this.fieldSelected) {
			this.fieldSelected = true;
			$('form.hide').removeClass('hide');
		}

		var selectedField = data.selectedField;
		for (var i = 0, len = this.gFields.length; i<len; i++) {
			if (this.gFields.get(i).get('name').toString() === selectedField) {
				this.fieldData = this.gFields.get(i);
				this.updateUi();
				this.rebindStrings();
				this.alignAllLabels();
				this.setEnumValues(this.fieldData.get('enumId'));
				break;
			}
		}
	},

	rebindStrings: function() {
		for (var prevBoundObj in this.gBindings) {
			this.gBindings[prevBoundObj].unbind(); //unbind the previous strings
		}
		var that = this;
		var bindString = gapi.drive.realtime.databinding.bindString;
		var TextInsertedEvent = gapi.drive.realtime.EventType.TEXT_INSERTED;
		var TextDeletedEvent = gapi.drive.realtime.EventType.TEXT_DELETED;

		var alignLabel = function(evt, elementName) {
			if (evt.isLocal) { return; } //local users don't need to worry with label alignment changing
			if (evt.target.length) { //if the calling string isn't empty
				$('#'+elementName+'-label').addClass('active');
			} else {
				$('#'+elementName+'-label').removeClass('active');
			}
		};

		var nameString = this.fieldData.get('name'); //getting each collaborative string
		nameString.addEventListener(TextInsertedEvent, function(evt) {alignLabel(evt, 'name');});
		nameString.addEventListener(TextDeletedEvent, function(evt) {alignLabel(evt, 'name');});
		this.gBindings.name = bindString(nameString, this.elements.nameField[0]);

		var descriptionString = this.fieldData.get('description');
		descriptionString.addEventListener(TextInsertedEvent, function(evt) {alignLabel(evt, 'description');});
		descriptionString.addEventListener(TextDeletedEvent, function(evt) {alignLabel(evt, 'description');});
		this.gBindings.description = bindString(descriptionString, this.elements.descriptionField[0]);

		var defValueString = this.fieldData.get('defValue');
		defValueString.addEventListener(TextInsertedEvent, function(evt) {alignLabel(evt, 'def-value');});
		defValueString.addEventListener(TextDeletedEvent, function(evt) {alignLabel(evt, 'def-value');});
		this.gBindings.defValue = bindString(defValueString, this.elements.defValueField[0]);

		var minValueString = this.fieldData.get('minValue');
		minValueString.addEventListener(TextInsertedEvent, function(evt) {alignLabel(evt, 'min-value');});
		minValueString.addEventListener(TextDeletedEvent, function(evt) {alignLabel(evt, 'min-value');});
		this.gBindings.minValue = bindString(minValueString, this.elements.minValueField[0]);

		var maxValueString = this.fieldData.get('maxValue');
		maxValueString.addEventListener(TextInsertedEvent, function(evt) {alignLabel(evt, 'max-value');});
		maxValueString.addEventListener(TextDeletedEvent, function(evt) {alignLabel(evt, 'max-value');});
		this.gBindings.maxValue = bindString(maxValueString, this.elements.maxValueField[0]);

		var strLenString = this.fieldData.get('strLen');
		strLenString.addEventListener(TextInsertedEvent, function(evt) {alignLabel(evt, 'str-len');});
		strLenString.addEventListener(TextDeletedEvent, function(evt) {alignLabel(evt, 'str-len');});
		this.gBindings.strLen = bindString(strLenString, this.elements.strLenField[0]);

		var arrayLenString = this.fieldData.get('arrayLen');
		arrayLenString.addEventListener(TextInsertedEvent, function(evt) {alignLabel(evt, 'array-len');});
		arrayLenString.addEventListener(TextDeletedEvent, function(evt) {alignLabel(evt, 'array-len');});
		this.gBindings.arrayLen = bindString(arrayLenString, this.elements.arrayLenField[0]);
	},

	updateAllSelect: function() {
		var that = this;
		this.elements.fieldTypeSelect.material_select(function() {
			that.onFieldTypeChanged($('#field-type-dropdown').find('input.select-dropdown').val());
		});
		this.updateRefSelectOptions();
		this.updateEnumSelectOptions();
	},

	onFieldTypeChanged: function(newFieldType) {
		if (newFieldType === 'ref') {
		}
		else if (newFieldType === 'enum') {
			this.setEnumValues(this.fieldData.get('enumId'));
		}
		this.saveUiToGoogle();
	},

	onRefTypeChanged: function(newRefName) {
		this.saveUiToGoogle();
	},

	onEnumTypeChanged: function(newEnumName) {
		var newEnumId = '';
		var that = this;
		$('#enum-name-dropdown').find('span').each(function(index, element) {
			var $element = $(element);
			if ($element.text() === newEnumName) {
				newEnumId = $element.attr('data-file-id');
				that.fieldData.set('enumId', newEnumId);
				that.setEnumValues(newEnumId);
			}
		});
		this.saveUiToGoogle();
	},

	loadDataFiles: function() {
		GDriveService.getProjectObjects(
			this.props.projectFolderFileId,
			'', true, true, true, true, false, //don't need to load flow data
			this.onFilesLoaded);
	},

	onFilesLoaded: function(fileObjects) {
		this.refs = [];
		this.enums = [];
		for (var i = 0, len = fileObjects.length; i<len; i++) {
			//the drive file description contains the object type
			if (fileObjects[i].description === GDriveConstants.ObjectType.PERSISTENT_DATA) {
				this.refs.push({
					id: fileObjects[i].id,
					title: fileObjects[i].title,
					fileType: fileObjects[i].description 
				});
			} else if (fileObjects[i].description === GDriveConstants.ObjectType.ENUM) {
				this.enums.push({
					id: fileObjects[i].id,
					title: fileObjects[i].title,
					fileType: fileObjects[i].description
				});
			} else if (fileObjects[i].description === GDriveConstants.ObjectType.SNIPPET) {
				this.refs.push({
					id: fileObjects[i].id,
					title: fileObjects[i].title,
					fileType: fileObjects[i].description
				});
			} else if (fileObjects[i].description === GDriveConstants.ObjectType.EVENT) {
				this.refs.push({
					id: fileObjects[i].id,
					title: fileObjects[i].title,
					fileType: fileObjects[i].description
				});
			}
		}
		this.setSelectOptions();
	},

	setSelectOptions: function() {
		var that = this;

		var refs = this.refs;
		this.elements.refNameSelect.empty();
		var refOptions = "";
		for (i = 0, len = refs.length; i<len; i++) {
			refOptions += '<option data-file-type = "'+refs[i].fileType+'" data-file-id = "'+refs[i].id+'" value = "'+refs[i].id+'">'+refs[i].title+'</option>';
		}
		this.elements.refNameSelect.html(refOptions);
		this.elements.refNameSelect.material_select(function() {
			that.onRefTypeChanged($('#ref-name-dropdown').find('.select-dropdown').val());
		});
		if (Object.keys(this.fieldData).length > 0) {
			this.elements.refNameSelect.val(this.fieldData.get('refId'));
		}
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
		if (enums.length) {
			this.elements.enumNameSelect.empty();
			var enumOptions = "";
			for (i = 0, len = enums.length; i<len; i++) {
				enumOptions += '<option data-file-type = "'+enums[i].fileType+'" data-file-id = "'+enums[i].id+'" value = "'+enums[i].id+'">'+enums[i].title+'</option>';
			}
			this.elements.enumNameSelect.html(enumOptions);
			this.elements.enumNameSelect.material_select(function() {
				that.onEnumTypeChanged($('#enum-name-dropdown').find('.select-dropdown').val());
			});
			if (Object.keys(this.fieldData).length > 0) {
				this.elements.refNameSelect.val(this.fieldData.get('enumId'));
			}
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
			this.elements.enumNameSelect.material_select(function() {
				that.onEnumTypeChanged($('#enum-name-dropdown').find('.select-dropdown').val());
			});
		}
	},

	setEnumValues: function(enumId) {
		var that = this;
		that.elements.enumValueSelect.html('<option value="default" disabled>loading enum values...</option>');
		that.elements.enumValueSelect.material_select();
		if (!enumId) {
			that.elements.enumValueSelect.html('<option value="default" disabled>select an enum type</option>');
			that.elements.enumValueSelect.material_select();
			return;
		}
		gapi.drive.realtime.load(enumId, function(doc) {
			var enumValues = doc.getModel().getRoot().get(GDriveConstants.CustomObjectKey.ENUM).fields.asArray();
			if (enumValues.length) {
				var enumValueOptions = "";
				for (var i = 0, len = enumValues.length; i<len; i++) {
					enumValueOptions += '<option data-enum-index = "'+enumValues[i].index+'" value = "'+enumValues[i].name+'">'+enumValues[i].name+'</option>';
				}
				that.elements.enumValueSelect.html(enumValueOptions);
			} else {
				that.elements.enumValueSelect.html('<option value = "default">no enums defined</option>');
			}
			that.elements.enumValueSelect.material_select(that.saveUiToGoogle);
			that.updateEnumValueSelect();
		});
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
		this.elements.refNameSelect.append('<option data-file-type = "'+fileType+'" data-file-id = "'+id+'" value = "'+id+'">'+title+'</option>');
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
		this.updateRefSelectOptions();
	},

	updateRefSelectOptions: function() {
		var refs = this.refs;
		var refId;
		if (Object.keys(this.fieldData).length > 0) {
			refId = this.fieldData.get('refId');
			this.elements.refNameSelect.val(refId);
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
		this.elements.enumNameSelect
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
		this.updateEnumSelectOptions();
	},

	updateEnumSelectOptions: function() {
		var enums = this.enums;
		if (Object.keys(this.fieldData).length > 0) {
			var enumId = this.fieldData.get('enumId');
			if (this.elements.enumNameSelect.val() !== enumId){
				this.elements.enumNameSelect.val(enumId);
				this.setEnumValues(enumId);
			} else {
				this.updateEnumValueSelect();
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

	updateEnumValueSelect: function() {
		var enumValue = this.fieldData.get('enumValue');
		$('#enum-value-dropdown').find('span').each(function(index, element) {
			var $element = $(element);
			if ($element.text() === enumValue) {
				$('#enum-value-dropdown').find('.select-dropdown').val(enumValue);
			}
		});
	},

	render: function() {
		return (
			<div className='row'>
				<form className='hide col s12' action='#!'>
					<div className='row'>
						<div className='input-field col s4'>
							<input type='text' id='name-field' className='text-input' />
							<label htmlFor='name-field' id='name-label'>name</label>
						</div>
						<div id='field-type-dropdown' className='input-field col s4 offset-s4'>
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
							</select>
							<label htmlFor='field-type-select' id='type-label'>type</label>
						</div>
					</div>
					<div className='row'>
						<div className='input-field col s12'>
							<textarea id='description-field' className='materialize-textarea text-input' />
							<label htmlFor='description-field' id='description-label'>description</label>
						</div>
					</div>
					<div className='row type-specific-field ref-specific-field'>
						<div id='ref-name-dropdown' className='input-field col s4'>
							<select id='ref-name-select' className='ref-name-selector form-select' value='default'>
								<option value='default' disabled>loading refs...</option>
							</select>
							<label htmlFor='ref-name-select' id='ref-name-label'>ref</label>
						</div>
						<div className='col s4'>
							<br />
							<input name="ref-group" className='with-gap' type="radio" id="ref-soft-radio" />
							<label htmlFor="ref-soft-radio" className='ref-radio-label'>soft</label>
							<input name="ref-group" className='with-gap' type="radio" id="ref-hard-radio" />
							<label htmlFor="ref-hard-radio" className='ref-radio-label'>hard</label>
						</div>
					</div>
					<div className='row type-specific-field enum-specific-field'>
						<div id='enum-name-dropdown' className='input-field col s4'>
							<select id='enum-name-select' className='enum-name-selector form-select' value='default'>
								<option value='default' disabled>no enums defined</option>
							</select>
							<label htmlFor='enum-name-select' id='enum-name-label'>enum type</label>
						</div>
					</div>
					<div className='row'>
						<div className='col s4 input-field type-specific-field double-specific-field float-specific-field byte-specific-field
							integer-specific-field long-specific-field short-specific-field string-specific-field ref-specific-field'>
							<input type='text' id='def-value-field' className='text-input' />
							<label htmlFor='def-value-field' id='def-value-label'>default value</label>
						</div>
						<div className='col s4 type-specific-field boolean-specific-field'>
							<br />
							<input type='checkbox' id='def-value-checkbox' className='filled-in' />
							<label htmlFor='def-value-checkbox' id='def-value-bool-label'>default value</label>
						</div>
						<div className='input-field col s4 type-specific-field enum-specific-field'>
							<div id='enum-value-dropdown'>
								<select id='enum-value-select' className='enum-value-selector form-select' value='default'>
									<option value='default' disabled>loading enum values...</option>
								</select>
								<label htmlFor='enum-value-select' id='enum-value-label'>enum value</label>
							</div>
							</div>
						<div id='checkbox-field' className='col s3 offset-s1'>
							<input type='checkbox' id='read-only-checkbox' className='filled-in' />
							<label htmlFor='read-only-checkbox' id='read-only-label'>read only</label>
							<br />
							<input type='checkbox' id='optional-checkbox' className='filled-in' />
							<label htmlFor='optional-checkbox' id='optional-label'>optional</label>
							<br />
							<input type='checkbox' id='array-checkbox' className='filled-in' />
							<label htmlFor='array-checkbox' id='array-label'>array</label>
						</div>
						<div id='array-len-wrapper' className='input-field col type-specific-field s4'>
							<input type='text' id='array-len-field' className='text-input' />
							<label htmlFor='array-len-field' id='array-len-label'>array length</label>
						</div>
					</div>
					<div className='row type-specific-field string-specific-field'>
						<div className='input-field col s4'>
							<input type='text' id='str-len-field' className='text-input' />
							<label htmlFor='str-len-field' id='str-len-label'>string length</label>
						</div>
					</div>
					<div className='row type-specific-field double-specific-field float-specific-field byte-specific-field
					     integer-specific-field long-specific-field short-specific-field'>
						<div className='input-field col s4'>
							<input type='text' id='min-value-field' className='text-input' />
							<label htmlFor='min-value-field' id='min-value-label'>min value</label>
						</div>
						<div className='input-field col s4'>
							<input type='text' id='max-value-field' className='text-input' />
							<label htmlFor='max-value-field' id='max-value-label'>max value</label>
						</div>
					</div>
					<div className='row'>
						<br />
						<div className='col s12'>
							<input type='checkbox' id='context-id-checkbox' className='filled-in' />
							<label htmlFor='context-id-checkbox' id='context-id-label'>context identifier</label>
						</div>
					</div>
				</form>
			</div>
		);
	}
});
