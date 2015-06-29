var EventType = require('../../constants/event-type.js');
var AnnouncementType = require('../../constants/announcement-type.js');
var GDriveConstants = require('../../constants/google-drive-constants.js');

var GDriveService = require('../../services/google-drive-service.js');

module.exports = React.createClass({
	/* ******************************************
				LIFE CYCLE FUNCTIONS
	****************************************** */
	componentWillMount: function() {
		this.gFields = null;
		this.fieldSelected = false;
		this.fieldData = {};
		this.refs = [];
		this.enum = [];
		this.currFieldAttr = {};

		Bullet.on(EventType.EntryForm.GAPI_FILE_LOADED, 'form.jsx>>onGapiFileLoaded', this.onGapiFileLoaded);
		Bullet.on(EventType.EntryForm.METADATA_MODEL_LOADED, 'form.jsx>>onMetadataModelLoaded', this.onMetadataModelLoaded);
		Bullet.on(EventType.EntryForm.FIELD_SELECTED, 'form.jsx>>onFieldSelected', this.onFieldSelected);
	},

	componentDidMount: function() {
		$('#ref-name-select').material_select();
	},

	componentWillUnmount: function() {
		Bullet.off(EventType.EntryForm.GAPI_FILE_LOADED, 'form.jsx>>onGapiFileLoaded');
		Bullet.off(EventType.EntryForm.METADATA_MODEL_LOADED, 'form.jsx>>onMetadataModelLoaded');
		Bullet.off(EventType.EntryForm.FIELD_SELECTED, 'form.jsx>>onFieldSelected');
	},

	/* ******************************************
			   NON LIFE CYCLE FUNCTIONS
	****************************************** */
	onGapiFileLoaded: function(doc) {
		this.loadRefs();
		this.loadEnums();

		var key = this.props.gapiKey;
		this.gFields = doc.getModel().getRoot().get(key).fields;
		this.gFields.addEventListener(gapi.drive.realtime.EventType.VALUES_ADDED, this.updateUi);
		this.gFields.addEventListener(gapi.drive.realtime.EventType.VALUES_REMOVED, this.updateUi);
		this.gFields.addEventListener(gapi.drive.realtime.EventType.VALUES_SET, this.updateUi);
		this.updateUi();
		this.connectUi();
	},

	onMetadataModelLoaded: function(metadataModel) {
		var _this = this;
		GDriveService.registerAnnouncement(metadataModel, function() {
			var announcement = metadataModel.announcement.get(0);
			if (announcement.action === AnnouncementType.ADD_FILE) {
				if (announcement.fileType === GDriveConstants.ObjectType.PERSISTENT_DATA) {
					_this.addToRefs(announcement);
				} else if (announcement.fileType === GDriveConstants.ObjectType.ENUM) {
					_this.addToEnums(announcement);
				} else if (announcement.fileType === GDriveConstants.ObjectType.EVENT) {
					_this.addToRefs(announcement);
				}
			} else if (announcement.action === AnnouncementType.RENAME_FILE) {
				if (announcement.fileType === GDriveConstants.ObjectType.PERSISTENT_DATA) {
					_this.updateRefNames(announcement);
				} else if (announcement.fileType === GDriveConstants.ObjectType.ENUM) {
					_this.updateEnumNames(announcement);
				} else if (announcement.fileType === GDriveConstants.ObjectType.EVENT) {
					_this.updateRefNames(announcement);
				}
			}
		});
	},

	connectUi: function() {
		$('#name-field').keyup(this.keyUpHandler);
		$('#description-field').keyup(this.keyUpHandler);
		$('#def-value-field').keyup(this.keyUpHandler);
		$('#min-value-field').keyup(this.keyUpHandler);
		$('#max-value-field').keyup(this.keyUpHandler);
		$('#string-len-field').keyup(this.keyUpHandler);
		$('#array-len-field').keyup(this.keyUpHandler);
		$('#def-value-checkbox').change(this.saveUiToGoogle);
		$('#read-only-checkbox').change(this.saveUiToGoogle);
		$('#optional-checkbox').change(this.saveUiToGoogle);
		$('#array-checkbox').change(this.saveUiToGoogle);
		$('#context-id-checkbox').change(this.saveUiToGoogle);
		$('#ref-soft-radio').change(this.saveUiToGoogle);
		$('#ref-hard-radio').change(this.saveUiToGoogle);
	},

	keyUpHandler: function(e) {
		var $currFieldAttr = $(e.target);
		var code = (e.keyCode);
		var arrowKeyCodes = [37, 38, 39, 40];
		if (arrowKeyCodes.indexOf(code) >= 0) {
			return false;
		}
		this.currFieldAttr.attr = $currFieldAttr;
		this.currFieldAttr.pos = $currFieldAttr[0].selectionStart;
		this.saveUiToGoogle();
	},

	saveUiToGoogle: function() {
		var fields = this.gFields.asArray();
		var fieldIndex;
		for (var i = 0, len = fields.length; i < len; i += 1) {
			if (fields[i].ID === this.fieldData.ID) {
				fieldIndex = i;
				break;
			}
		}
		var newField = {};
		newField.ID = this.fieldData.ID;
		newField.name = $('#name-field').val();
		newField.type = $('#field-type-select').val();
		newField.description = $('#description-field').val();
		newField.refId = $('#ref-name-select').val();
		newField.refType = '';
		if ($('#ref-soft-radio').prop('checked')) {
			newField.refType = 'soft';
		} else if ($('#ref-hard-radio').prop('checked')) {
			newField.refType = 'hard';
		}
		newField.enumName = $('#enum-name-select').val();
		newField.readOnly = $('#read-only-checkbox').prop('checked');
		newField.optional = $('#optional-checkbox').prop('checked');
		newField.array = $('#array-checkbox').prop('checked');
		newField.arrayLen = $('#array-len-field').val();
		newField.contextId = $('#context-id-checkbox').prop('checked');
		newField.defValue = $('#def-value-field').val();
		newField.defValueBool = $('#def-value-checkbox').prop('checked');
		newField.minValue = $('#min-value-field').val();
		newField.maxValue = $('#max-value-field').val();
		newField.stringLen = $('#string-len-field').val();
		this.fieldData = newField;
		this.gFields.set(fieldIndex, this.fieldData);
	},

	updateUi: function(e) {
		this.displayCorrectUiComponents();
		$('#name-field').val(this.fieldData.name);
		$('#field-type-select').val(this.fieldData.type);
		$('#description-field').val(this.fieldData.description);
		$('#def-value-field').val(this.fieldData.defValue);
		$('#min-value-field').val(this.fieldData.minValue);
		$('#max-value-field').val(this.fieldData.maxValue);
		$('#string-len-field').val(this.fieldData.stringLen);
		$('#array-len-field').val(this.fieldData.arrayLen);
		$('#ref-name-select').val(this.fieldData.refId);
		$('#enum-name-select').val(this.fieldData.enumId);
		$('#ref-soft-radio').prop('checked', this.fieldData.refType === 'soft');
		$('#ref-hard-radio').prop('checked', this.fieldData.refType === 'hard');
		$('#def-value-checkbox').prop('checked', this.fieldData.defValueBool);
		$('#read-only-checkbox').prop('checked', this.fieldData.readOnly);
		$('#optional-checkbox').prop('checked', this.fieldData.optional);
		$('#array-checkbox').prop('checked', this.fieldData.array);
		$('#context-id-checkbox').prop('checked', this.fieldData.contextId);
		this.setCursorPos();
		this.updateAllSelect();
	},

	displayCorrectUiComponents: function() {
		$('.type-specific-field').addClass('hide');
		$('.'+this.fieldData.type+'-specific-field').removeClass('hide');
		if (this.fieldData.array) {
			$('#array-len-wrapper').removeClass('hide');
		}
	},

	setCursorPos: function() {
		if (this.currFieldAttr.attr) {
			this.currFieldAttr.attr[0].setSelectionRange(this.currFieldAttr.pos, this.currFieldAttr.pos);
		} else {
			return false;
		}
	},

	realignLabels: function() {
		$('.text-input').each(function(index, element) {
			var $element = $(element);
			if ($element.val() !== '') {
				$element.next('label').addClass('active');
			} else {
				$element.next('label').removeClass('active');
			}
		});
	},

	updateAllSelect: function() {
		this.updateTypeSelect();
		this.updateRefSelect();
		this.updateEnumSelect();
	},

	updateTypeSelect: function() {
		var _this = this;
		$('#field-type-select').material_select(function() {
			_this.onFieldTypeChanged($('#field-type-dropdown input.select-dropdown').val());
		});
	},

	updateRefSelect: function() {
		$('#ref-name-select').val(this.fieldData.refId);
		this.updateRefSelectOptions();
	},

	updateEnumSelect: function() {
		var _this = this;
		$('#enum-name-select').material_select(function() {
			_this.onEnumTypeChanged($('#enum-name-dropdown input.select-dropdown').val());
		});
	},

	loadRefs: function() {
		GDriveService.getProjectObjects(
			this.props.projectFolderFileId,
			'', true, false, true, false, //only load persistent and event data
			this.onRefsLoaded);
	},

	onRefsLoaded: function(refObjects) {
		this.refs = [];
		for (var i = 0, len = refObjects.length; i < len; i += 1) {
			this.refs.push({
				id: refObjects[i].id,
				title: refObjects[i].title});
		}
		this.setRefSelectOptions();
	},

	addToRefs: function(announcement) {
		var id = announcement.fileId;
		var title = announcement.fileName;
		this.refs.push({
			id: id,
			title: title
		});
		$('#ref-name-select').append('<option data-file-id = "'+id+'" value = "'+id+'">'+title+'</option>');
		$('#ref-name-dropdown .dropdown-content').append('<li><span data-file-id = "'+id+'">'+title+'</span></li>');
	},

	updateRefNames: function(announcement) {
		var refs = this.refs;
		for (var i = 0, len = refs.length; i < len; i += 1) {
			if (refs[i].id === announcement.fileId) {
				refs[i] = {
					id: announcement.fileId,
					title: announcement.fileNewName
				};
				break;
			}
		}
		this.updateRefSelectOptions();
	},

	setRefSelectOptions: function() {
		var refs = this.refs;
		var _this = this;
		if (refs !== []) {
			$('#ref-name-select').empty();
			for (var i = 0, len = refs.length; i < len; i += 1) {
				$('#ref-name-select').append('<option data-file-id = "'+refs[i].id+'" value = "'+refs[i].id+'">'+refs[i].title+'</option>');
			}

			if (typeof _this.fieldData.refId !== 'undefined') {
				$('#ref-name-select').val(_this.fieldData.refId);
			}
			$('#ref-name-select').material_select(function() {
				_this.onRefTypeChanged($('#ref-name-dropdown .select-dropdown').val());
			});
		}

		$('#ref-name-dropdown').find('span').each(function(index, element) {
			var $element = $(element);
			for(i = 0, len = refs.length; i < len; i += 1) {
				if ($element.text() === '' + refs[i].title) {
					$element.attr('data-file-id', refs[i].id);
					break;
				}
			}
		});
	},

	updateRefSelectOptions: function() {
		var refs = this.refs;
		var _this = this;

		if (typeof this.fieldData.refId !== 'undefined') {
			$('#ref-name-select').val(this.fieldData.refId);
		}
		$('#ref-name-dropdown').find('span').each(function(index, element) {
			var $element = $(element);
			for(var i = 0, len = refs.length; i < len; i += 1) {
				if ($element.attr('data-file-id') === refs[i].id && $element.text() !== refs[i].title) {
					$element.text(refs[i].title);
					if (refs[i].id === _this.fieldData.refId) {
						$('#ref-name-dropdown .select-dropdown').val(refs[i].title);
					}
					break;
				}
			}
		});
	}, 

	loadEnums: function() {
		GDriveService.getProjectObjects(
			this.props.projectFolderFileId,
			'', false, true, false, false, //only load enum data
			this.onEnumsLoaded);
	},

	onEnumsLoaded: function(enumObjects) {
		this.enums = [];
		for (var i = 0, len = enumObjects.length; i < len; i += 1) {
			this.enums.push({
				id: enumObjects[i].id,
				title: enumObjects[i].title});
		}
		this.setRefSelectOptions();
	},

	addToEnums: function(announcement) {
		var id = announcement.fileId;
		var title = announcement.fileName;
		this.enums.push({
			id: id,
			title: title
		});
		$('#enum-name-select').append('<option data-file-id = "'+id+'" value = "'+id+'">'+title+'</option>');
		$('#enum-name-dropdown .dropdown-content').append('<li><span data-file-id = "'+id+'">'+title+'</span></li>');
	},

	updateEnumNames: function(announcement) {
		var enums = this.enums;
		for (var i = 0, len = enums.length; i < len; i += 1) {
			if (enums[i].id === announcement.fileId) {
				enums[i] = {
					id: announcement.fileId,
					title: announcement.fileNewName
				};
				break;
			}
		}
		this.updateEnumSelectOptions();
	},

	setEnumSelectOptions: function() {
		var enums = this.enums;
		var _this = this;
		if (enums !== []) {
			$('#enum-name-select').empty();
			for (var i = 0, len = enums.length; i < len; i += 1) {
				$('#enum-name-select').append('<option data-file-id = "'+enums[i].id+'" value = "'+enums[i].id+'">'+enums[i].title+'</option>');
			}

			if (typeof _this.fieldData.enumId !== 'undefined') {
				$('#enum-name-select').val(_this.fieldData.enumId);
			}
			$('#enum-name-select').material_select(function() {
				_this.onRefTypeChanged($('#enum-name-dropdown .select-dropdown').val());
			});
		}

		$('#enum-name-dropdown').find('span').each(function(index, element) {
			var $element = $(element);
			for(i = 0, len = enums.length; i < len; i += 1) {
				if ($element.text() === '' + enums[i].title) {
					$element.attr('data-file-id', enums[i].id);
					break;
				}
			}
		});
	},

	updateEnumSelectOptions: function() {
		var enums = this.enums;
		var _this = this;

		if (typeof this.fieldData.enumId !== 'undefined') {
			$('#enum-name-select').val(this.fieldData.refId);
		}
		$('#enum-name-dropdown').find('span').each(function(index, element) {
			var $element = $(element);
			for(var i = 0, len = enums.length; i < len; i += 1) {
				if ($element.attr('data-file-id') === enums[i].id && $element.text() !== enums[i].title) {
					$element.text(enums[i].title);
					if (enums[i].id === _this.fieldData.refId) {
						$('#enum-name-dropdown .select-dropdown').val(enums[i].title);
					}
					break;
				}
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
		var fields = this.gFields.asArray();
		for (var i = 0, len = fields.length; i<len; i += 1) {
			if (fields[i].name === selectedField) {
				this.fieldData = this.gFields.get(i);
				break;
			}
		}
		this.updateUi();
		this.setRefSelectOptions();
		this.setEnumSelectOptions();
		this.realignLabels();
	},

	onFieldTypeChanged: function(newFieldType) {
		this.fieldData.type = newFieldType;
		this.saveUiToGoogle();
	},

	onRefTypeChanged: function(newRefId) {
		this.fieldData.refId = newRefId;
		this.saveUiToGoogle();
	},

	onEnumTypeChanged: function(newEnumName) {
		this.fieldData.enumName = newEnumName;
		this.saveUiToGoogle();
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
								<option value='default' disabled>loading enums...</option>
							</select>
							<label htmlFor='enum-name-select' id='enum-name-label'>enum type</label>
						</div>
					</div>
					<div className='row'>
						<div className='col s4 input-field type-specific-field double-specific-field float-specific-field byte-specific-field
							integer-specific-field long-specific-field short-specific-field string-specific-field ref-specific-field enum-specific-field'>
							<input type='text' id='def-value-field' className='text-input' />
							<label htmlFor='def-value-field' id='def-value-label'>default value</label>
						</div>
						<div className='col s4 type-specific-field boolean-specific-field'>
							<br />
							<input type='checkbox' id='def-value-checkbox' className='filled-in' />
							<label htmlFor='def-value-checkbox' id='def-value-bool-label'>default value</label>
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
							<input type='text' id='string-len-field' className='text-input' />
							<label htmlFor='string-len-field' id='string-len-label'>string length</label>
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
