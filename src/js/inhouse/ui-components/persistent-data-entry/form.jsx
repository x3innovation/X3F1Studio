var EventType=require('../../constants/event-type.js');
var GDriveConstants = require('../../constants/google-drive-constants.js');
var DefaultValueCons=require('../../constants/default-value-constants.js');
var DefaultFields=DefaultValueCons.DefaultFieldAttributes;

module.exports=React.createClass({

	model: {},

	/* ******************************************
				LIFE CYCLE FUNCTIONS
	****************************************** */
	componentWillMount: function() {
		this.model.gModel=null;
		this.model.fieldSelected=false;
		this.model.currentFieldAttribute=null;
		this.model.currentFieldAttributePosition=null;
		this.model.fieldData={};

		Bullet.on(EventType.PersistentDataEntry.GAPI_FILE_LOADED, 'form.jsx>>onGapiFileLoaded', this.onGapiFileLoaded); 
	},

	componentDidMount: function() {
		this.initializeSelect();

		Bullet.on(EventType.PersistentDataEntry.FIELD_SELECTED, 'form.jsx>>fieldSelected', function(data) {
			this.onFieldSelected(data.selectedField);
		}.bind(this));
	},

	componentWillUnmount: function() {
		Bullet.off(EventType.PersistentDataEntry.GAPI_FILE_LOADED, 'form.jsx>>onGapiFileLoaded');
		Bullet.off(EventType.PersistentDataEntry.FIELD_SELECTED, 'form.jsx>>fieldSelected');
	},

	/* ******************************************
			   NON LIFE CYCLE FUNCTIONS
	****************************************** */

	initializeSelect: function() {
		$('select').material_select(function(){
			this.onFieldTypeChanged($('#field-type-dropdown input.select-dropdown').val());
		}.bind(this));
	},

	onGapiFileLoaded: function(doc) {
		var key = GDriveConstants.CustomObjectKey.PERSISTENT_DATA;
		this.model.gModel = doc.getModel().getRoot().get(key);
		this.model.gModel.fields.addEventListener(gapi.drive.realtime.EventType.VALUES_ADDED, this.updateUi);
		this.model.gModel.fields.addEventListener(gapi.drive.realtime.EventType.VALUES_REMOVED, this.updateUi);
		this.model.gModel.fields.addEventListener(gapi.drive.realtime.EventType.VALUES_SET, this.updateUi);
		this.updateUi();
		this.connectUi();
	},

	connectUi: function() {
		$('#name-field').keyup(this.keyupSaveHandler);
		$('#description-field').keyup(this.keyupSaveHandler);
		$('#def-value-field').keyup(this.keyupSaveHandler);
		$('#min-value-field').keyup(this.keyupSaveHandler);
		$('#max-value-field').keyup(this.keyupSaveHandler);
		$('#string-len-field').keyup(this.keyupSaveHandler);
		$('#def-value-checkbox').change(this.saveUiToGoogle);
		$('#read-only-checkbox').change(this.saveUiToGoogle);
		$('#optional-checkbox').change(this.saveUiToGoogle);
		$('#array-checkbox').change(this.saveUiToGoogle);
		$('#context-id-checkbox').change(this.saveUiToGoogle);
	},

	keyupSaveHandler: function(e) {
		var code = (e.keyCode || e.which);
		var nonInputKeys = [9,16,17,18,19,20,27,33,34,35,36,37,38,39,40,45,46,91,92,93,112,113,114,115,116,117,118,119,120,121,122,123,144,145];

    	if(nonInputKeys.indexOf(code)>=0) {
    	    return false;
    	} else {
    		this.saveUiToGoogle();
    	}
	},

	displayCorrectUiComponents: function() {
		var fieldType=this.model.fieldData.type;
		$('.type-specific').addClass('hide');
		$('.'+fieldType+'-field').removeClass('hide');
	},

	updateUi: function() {
		this.displayCorrectUiComponents();
		$('#name-field').val(this.model.fieldData.name);
		$('#type-field').val(this.model.fieldData.type);
		$('#description-field').val(this.model.fieldData.description);
		$('#def-value-field').val(this.model.fieldData.defValue);
		$('#min-value-field').val(this.model.fieldData.minValue);
		$('#max-value-field').val(this.model.fieldData.maxValue);
		$('#string-len-field').val(this.model.fieldData.stringLen);
		$('#def-value-checkbox').prop('checked', this.model.fieldData.defValueBool);		
		$('#read-only-checkbox').prop('checked', this.model.fieldData.readOnly);
		$('#optional-checkbox').prop('checked', this.model.fieldData.optional);
		$('#array-checkbox').prop('checked', this.model.fieldData.array);
		$('#context-id-checkbox').prop('checked', this.model.fieldData.contextId);
		this.initializeSelect(); //Materialize requires reinitializing dynamic components when changed programmatically
		this.forceUpdate();

		// realign the labels with each update
        $('.text-input').each(function(index, element) {
            if ($(this).val() != '') {
                $(this).next('label').addClass('active');
            } else {
                $(this).next('label').removeClass('active');
            }
        });
	},

	saveUiToGoogle: function(newFieldType) {
		var fields = this.model.gModel.fields.asArray();
		var fieldIndex;
		for (i = 0, len = fields.length; i<len; i++) {
			if (fields[i].name == this.model.fieldData.name) {
				fieldIndex = i;
				break;
			}
		}
		var newField = {};

		newField.name=$('#name-field').val();
		newField.type=$('#type-field').val();
		newField.description=$('#description-field').val();
		newField.readOnly=$('#read-only-checkbox').prop('checked');
		newField.optional=$('#optional-checkbox').prop('checked');
		newField.array=$('#array-checkbox').prop('checked');
		newField.contextId=$('#context-id-checkbox').prop('checked');
		newField.defValue=$('#def-value-field').val();
		newField.defValueBool=$('#def-value-checkbox').prop('checked');
		newField.minValue = $('#min-value-field').val();
		newField.maxValue = $('#max-value-field').val();
		newField.stringLen = $('#string-len-field').val();

		this.model.fieldData = newField;
		this.model.gModel.fields.set(fieldIndex, this.model.fieldData);
	},

	onFieldSelected: function(selectedField) {
		if (!this.model.fieldSelected) {
			this.model.fieldSelected = true;
			$('form.hide').removeClass('hide');
			this.forceUpdate();
		}
		var fields=this.model.gModel.fields.asArray();
		for (i = 0, len=fields.length; i<len; i++) {
			if (fields[i].name===selectedField) {
				this.model.fieldData = this.model.gModel.fields.get(i);
				break;
			}
		}
		this.updateUi();
	},

	onFieldTypeChanged: function(newFieldType) {
		this.model.fieldData.type=newFieldType;
		this.saveUiToGoogle(newFieldType);
		this.forceUpdate();
	},

	getFormContent: function() {
		return(
			<form className='hide col s12' action='#!'>
				<div className='row'>
					<div className='input-field col s4'>
						<input type='text' id='name-field' className='text-input' />
						<label htmlFor='name-field' id='name-field-label'>name</label>
					</div>
					<div id='field-type-dropdown' className='input-field col s4 offset-s4'>
						<select id='type-field' className='type-selector' value='double'>
							<option value='double'>double</option>
							<option value='float'>float</option>
							<option value='short'>short</option>
							<option value='integer'>integer</option>
							<option value='long'>long</option>
							<option value='string'>string</option>
							<option value='boolean'>boolean</option>
						</select>
						<label htmlFor='type-field' id='type-selector-label'>type</label>
					</div>
				</div>
				<div className='row'>
					<div className='input-field col s12'>
						<textarea id='description-field' className='materialize-textarea text-input'></textarea>
						<label htmlFor='description-field' id='description-field-label'>description</label>
					</div>
				</div>
				<div className='row'>
					<div className='col s4 input-field type-specific double-field float-field integer-field long-field short-field string-field'>
							<input type='text' id='def-value-field' className = 'text-input' />
							<label htmlFor='def-value-field' id='def-value-field-label'>default value</label>
					</div>
					<div className='col s4 type-specific boolean-field'>
							<input type='checkbox' id='def-value-checkbox' className='filled-in' />
							<label htmlFor='def-value-checkbox' id='def-value-checkbox-label'>default value</label>
					</div>
					<div className='col s4 offset-s4'>
						<input type='checkbox' id='read-only-checkbox' className='filled-in' />
						<label htmlFor='read-only-checkbox' id='read-only-checkbox-label'>read only</label>
						<br></br>
						<input type='checkbox' id='optional-checkbox' className='filled-in' />
						<label htmlFor='optional-checkbox' id='optional-checkbox-label'>optional</label>
						<br></br>
						<input type='checkbox' id='array-checkbox' className='filled-in' />
						<label htmlFor='array-checkbox' id='array-checkbox-label'>array</label>
					</div>
				</div>
				<div className='row type-specific string-field'>
					<div className='input-field col s4'>
						<input type='text' id='string-len-field' className='text-input' />
						<label htmlFor='string-len-field' id='string-len-field-label'>length</label>
					</div>
				</div>
				<div className='row type-specific double-field float-field integer-field long-field short-field'>
					<div className='input-field col s4'>
						<input type='text' id='min-value-field' className='text-input' />
						<label htmlFor='min-field' id='min-value-field-field'>min value</label>
					</div>
					<div className='input-field col s4'>
						<input type='text' id='max-value-field' className='text-input' />
						<label htmlFor='max-value-field'>max value</label>
					</div>
				</div>
				<div className='row'>
					<div className='col s12'>
							<input type='checkbox' id='context-id-checkbox' className='filled-in' />
						<label htmlFor='context-id-checkbox' id='context-id-checkbox-label'>context identifier</label>
					</div>
				</div>
			</form>
		);
	},

	render: function() {
		var content=this.getFormContent();
		return <div className='row'>{content}</div>
	}
}); 
