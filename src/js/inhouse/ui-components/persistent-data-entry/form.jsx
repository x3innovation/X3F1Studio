var EventType=require('../../constants/event-type.js');
var GDriveConstants=require('../../constants/google-drive-constants.js');
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
		this.model.fieldData={};
		this.model.currFieldAttr={};

		Bullet.on(EventType.PersistentDataEntry.GAPI_FILE_LOADED, 'form.jsx>>onGapiFileLoaded', this.onGapiFileLoaded); 
	},

	componentDidMount: function() {
		this.setSelectOptions();

		Bullet.on(EventType.PersistentDataEntry.FIELD_SELECTED, 'form.jsx>>fieldSelected', function(data) {
			this.onFieldSelected(data);
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
		var that = this;
		$('select#type-select').material_select(function(){
			that.onFieldTypeChanged($('#field-type-dropdown input.select-dropdown').val());
		});

		$('select#ref-name-select').material_select(function(){
			that.onRefTypeChanged($('#ref-name-dropdown input.select-dropdown').val());
		});

		$('select#enum-name-select').material_select(function(){
			that.onEnumTypeChanged($('#enum-name-dropdown input.select-dropdown').val());
		});
	},

	setSelectOptions: function() {
		/*TODO: LOAD THE LIST OF DATA FILE NAMES*/
		this.initializeSelect();
	},

	onGapiFileLoaded: function(doc) {
		var key=GDriveConstants.CustomObjectKey.PERSISTENT_DATA;
		this.model.gModel=doc.getModel().getRoot().get(key);
		this.model.gModel.fields.addEventListener(gapi.drive.realtime.EventType.VALUES_ADDED, this.updateUi);
		this.model.gModel.fields.addEventListener(gapi.drive.realtime.EventType.VALUES_REMOVED, this.updateUi);
		this.model.gModel.fields.addEventListener(gapi.drive.realtime.EventType.VALUES_SET, this.updateUi);
		this.updateUi();
		this.connectUi();
	},

	connectUi: function() {
		$('#name-field').keyup(this.keyUpHandler);
		$('#description-field').keyup(this.keyUpHandler);
		$('#def-value-field').keyup(this.keyUpHandler);
		$('#min-value-field').keyup(this.keyUpHandler);
		$('#max-value-field').keyup(this.keyUpHandler);
		$('#string-len-field').keyup(this.keyUpHandler);
		$('#def-value-checkbox').change(this.saveUiToGoogle);
		$('#read-only-checkbox').change(this.saveUiToGoogle);
		$('#optional-checkbox').change(this.saveUiToGoogle);
		$('#array-checkbox').change(this.saveUiToGoogle);
		$('#context-id-checkbox').change(this.saveUiToGoogle);
		$('#ref-soft-radio').change(this.saveUiToGoogle);
		$('#ref-hard-radio').change(this.saveUiToGoogle);
	},

	saveUiToGoogle: function() {
		var fields=this.model.gModel.fields.asArray();
		var fieldIndex;
		for (i=0, len=fields.length; i<len; i+=1) {
			if (fields[i].name==this.model.fieldData.name) {
				fieldIndex=i;
				break;
			}
		}
		var newField={};
		newField.ID=this.model.fieldData.ID;
		newField.name=$('#name-field').val();
		newField.type=$('#field-type-dropdown input.select-dropdown').val();
		newField.description=$('#description-field').val();
		newField.refName=$('#ref-name-dropdown input.select-dropdown').val();
		newField.enumName=$('#enum-name-dropdown input.select-dropdown').val();
		newField.readOnly=$('#read-only-checkbox').prop('checked');
		newField.optional=$('#optional-checkbox').prop('checked');
		newField.array=$('#array-checkbox').prop('checked');
		newField.contextId=$('#context-id-checkbox').prop('checked');
		newField.defValue=$('#def-value-field').val();
		newField.defValueBool=$('#def-value-checkbox').prop('checked');
		newField.minValue=$('#min-value-field').val();
		newField.maxValue=$('#max-value-field').val();
		newField.stringLen=$('#string-len-field').val();
		newField.refType='';
		if ($('#ref-soft-radio').prop('checked')) {
			newField.refType='soft';
		} else if ($('#ref-hard-radio').prop('checked')) {
			newField.refType='hard';
		}

		this.model.fieldData=newField;
		this.model.gModel.fields.set(fieldIndex, this.model.fieldData);
	},

	keyUpHandler: function(e) {
		var $currFieldAttr=$(e.target);
		var code=(e.keyCode);
		var nonInputKeys=[9,16,17,18,19,20,27,33,34,35,36,37,38,39,40,45,46,91,92,93,112,113,114,115,116,
					      117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,134,135,144,145];
		if (nonInputKeys.indexOf(code)>=0) {
			return false;
		} else {
			this.model.currFieldAttr.attr=$currFieldAttr;
			this.model.currFieldAttr.pos=$currFieldAttr[0].selectionStart;
			this.saveUiToGoogle();
		}
	},

	updateUi: function() {
		this.displayCorrectUiComponents();
		$('#name-field').val(this.model.fieldData.name);
		$('#type-select').val(this.model.fieldData.type);
		$('#description-field').val(this.model.fieldData.description);
		$('#def-value-field').val(this.model.fieldData.defValue);
		$('#min-value-field').val(this.model.fieldData.minValue);
		$('#max-value-field').val(this.model.fieldData.maxValue);
		$('#string-len-field').val(this.model.fieldData.stringLen);
		$('#ref-name-select').val(this.model.fieldData.refName);
		$('#enum-name-select').val(this.model.fieldData.enumName);
		$('#ref-soft-radio').prop('checked', this.model.fieldData.refType==='soft');
		$('#ref-hard-radio').prop('checked', this.model.fieldData.refType==='hard');
		$('#def-value-checkbox').prop('checked', this.model.fieldData.defValueBool);		
		$('#read-only-checkbox').prop('checked', this.model.fieldData.readOnly);
		$('#optional-checkbox').prop('checked', this.model.fieldData.optional);
		$('#array-checkbox').prop('checked', this.model.fieldData.array);
		$('#context-id-checkbox').prop('checked', this.model.fieldData.contextId);
		this.setCursorPos();
	},

	displayCorrectUiComponents: function() {
		$('.type-specific').addClass('hide');
		$('.'+this.model.fieldData.type+'-specific-field').removeClass('hide');
	},

	setCursorPos: function() {
		if (this.model.currFieldAttr.attr) {
			this.model.currFieldAttr.attr[0].setSelectionRange(this.model.currFieldAttr.pos, this.model.currFieldAttr.pos);
		}
	},

	onFieldSelected: function(data) {
		if (data.fieldCount===0) {
			this.model.fieldSelected=false;
			$('form').addClass('hide');
			this.forceUpdate();
			return false;
		}
		if (!this.model.fieldSelected) {
			this.model.fieldSelected=true;
			$('form.hide').removeClass('hide');
		}

		var selectedField=data.selectedField;
		var fields=this.model.gModel.fields.asArray();
		for (i=0, len=fields.length; i<len; i+=1) {
			if (fields[i].name===selectedField) {
				this.model.fieldData=this.model.gModel.fields.get(i);
				break;
			}
		}
		this.updateUi();
		// realign the labels
        $('.text-input').each(function(index, element) {
            if ($(this).val() != '') {
                $(this).next('label').addClass('active');
            } else {
                $(this).next('label').removeClass('active');
            }
        });
        this.initializeSelect(); //Materialize can't change the type programmatically without reinitializing
	},

	onFieldTypeChanged: function(newFieldType) {
		this.model.fieldData.type=newFieldType;
		this.saveUiToGoogle();
		this.forceUpdate();
	},

	onRefTypeChanged: function(newRefName) {
		this.model.fieldData.refName=newRefName;
		this.saveUiToGoogle();
		this.forceUpdate();
	},

	onEnumTypeChanged: function(newEnumName) {
		this.model.fieldData.enumName=newEnumName;
		this.saveUiToGoogle();
		this.forceUpdate();
	},

	render: function() {
		return <div className='row'>
			<form className='hide col s12' action='#!'>
				<div className='row'>
					<div className='input-field col s4'>
						<input type='text' id='name-field' className='text-input' />
						<label htmlFor='name-field' id='name-label'>name</label>
					</div>
					<div id='field-type-dropdown' className='input-field col s4 offset-s4'>
						<select id='type-select' className='type-selector form-select' value='double'>
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
						<label htmlFor='type-select' id='type-label'>type</label>
					</div>
				</div>
				<div className='row'>
					<div className='input-field col s12'>
						<textarea id='description-field' className='materialize-textarea text-input' />
						<label htmlFor='description-field' id='description-label'>description</label>
					</div>
				</div>
				<div className='row type-specific ref-specific-field'>
					<div id='ref-name-dropdown' className='input-field col s4'>
						<select id='ref-name-select' className='ref-name-selector form-select' value='default'>
							<option value='default' disabled>default</option>
							<option value='filler1'>filler1</option>
							<option value='filler2'>filler2</option>
							<option value='filler3'>filler3</option>
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
				<div className='row type-specific enum-specific-field'>
					<div id='enum-name-dropdown' className='input-field col s4'>
						<select id='enum-name-select' className='enum-name-selector form-select' value='default'>
							<option value='default' disabled>default</option>
							<option value='filler1'>filler1</option>
							<option value='filler2'>filler2</option>
							<option value='filler3'>filler3</option>
						</select>
						<label htmlFor='enum-name-select' id='enum-name-label'>enum type</label>
					</div>
				</div>
				<div className='row'>
					<div className='col s4 input-field type-specific double-specific-field float-specific-field byte-specific-field
						 integer-specific-field long-specific-field short-specific-field string-specific-field ref-specific-field enum-specific-field'>
						<input type='text' id='def-value-field' className='text-input' />
						<label htmlFor='def-value-field' id='def-value-label'>default value</label>
					</div>
					<div className='col s4 type-specific boolean-specific-field'>
						<input type='checkbox' id='def-value-checkbox' className='filled-in' />
						<label htmlFor='def-value-checkbox' id='def-value-bool-label'>default value</label>
					</div>
					<div className='col s4 offset-s4'>
						<input type='checkbox' id='read-only-checkbox' className='filled-in' />
						<label htmlFor='read-only-checkbox' id='read-only-label'>read only</label>
						<br />
						<input type='checkbox' id='optional-checkbox' className='filled-in' />
						<label htmlFor='optional-checkbox' id='optional-label'>optional</label>
						<br />
						<input type='checkbox' id='array-checkbox' className='filled-in' />
						<label htmlFor='array-checkbox' id='array-label'>array</label>
					</div>
				</div>
				<div className='row type-specific string-specific-field'>
					<div className='input-field col s4'>
						<input type='text' id='string-len-field' className='text-input' />
						<label htmlFor='string-len-field' id='string-len-label'>length</label>
					</div>
				</div>
				<div className='row type-specific double-specific-field float-specific-field byte-specific-field 
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
	}
});