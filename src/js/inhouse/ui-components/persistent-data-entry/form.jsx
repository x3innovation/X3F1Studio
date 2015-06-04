var EventType=require('../../constants/event-type.js');
var GDriveConstants = require('../../constants/google-drive-constants.js');
var DefaultValueCons=require('../../constants/default-value-constants.js');
var DefaultFields=DefaultValueCons.DefaultFieldAttributes;

module.exports=React.createClass({
	/* ******************************************
                LIFE CYCLE FUNCTIONS
    ****************************************** */
    componentWillMount: function() {
    	this.model={};
    	this.model.gModel=null;
    	this.model.fieldData={};

        Bullet.on(EventType.PersistentDataEntry.GAPI_FILE_LOADED, 'form.jsx>>onGapiFileLoaded', this.onGapiFileLoaded); 
    },

	componentDidMount: function() {
		$('select').material_select(function(){
			this.onFieldTypeChanged($('#field-type-dropdown input.select-dropdown').val());
		}.bind(this));

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
        $('#name-field').keyup(this.saveUiToGoogle);
        $('#type-field').keyup(this.saveUiToGoogle);
        $('#description-field').keyup(this.saveUiToGoogle);
        $('#read-only-checkbox').change(this.saveUiToGoogle);
        $('#optional-checkbox').change(this.saveUiToGoogle);
        $('#array-checkbox').change(this.saveUiToGoogle);
        $('#context-id-checkbox').change(this.saveUiToGoogle);
		this.reconnectUi();
    },

    reconnectUi: function() {
    	if (this.model.fieldData.type === 'boolean') {
        	$('#def-value-field').change(this.saveUiToGoogle);
    	} else {    		
    		$('#def-value-field').keyup(this.saveUiToGoogle);
    	}

    	if (['double','integer','long','short','float'].indexOf(this.model.fieldData.type) >= 0) {
    		$('#min-value-field').keyup(this.model.fieldData.minValue);
    		$('#max-value-field').keyup(this.model.fieldData.maxValue);
    	} else if (this.model.fieldData.type === 'string') {
			$('#string-len-field').keyup(this.model.fieldData.stringLen);
		}
    },

    updateUi: function() {
    	$('#name-field').val(this.model.fieldData.name);
    	$('#type-field').val(this.model.fieldData.type);
    	$('#description-field').val(this.model.fieldData.description);
    	$('#read-only-checkbox').prop('checked', this.model.fieldData.readOnly);
    	$('#optional-checkbox').prop('checked', this.model.fieldData.optional);
    	$('#array-checkbox').prop('checked', this.model.fieldData.array);
    	$('#context-id-checkbox').prop('checked', this.model.fieldData.contextId);

    	if (this.model.fieldData.type === 'boolean') {
    		$('#def-value-field').prop('checked', this.model.fieldData.defValue);
    	} else {    		
    		$('#def-value-field').val(this.model.fieldData.defValue);
    	}

    	if (['double','integer','long','short','float'].indexOf(this.model.fieldData.type) >= 0) {
    		$('#min-value-field').val(this.model.fieldData.minValue);
    		$('#max-value-field').val(this.model.fieldData.maxValue);
    	} else if (this.model.fieldData.type === 'string') {
			$('#string-len-field').val(this.model.fieldData.stringLen);
		}
		this.reconnectUi();
    },

    saveUiToGoogle: function() {
    	if (!this.model.fieldData.name) {
    		return;
    	}
    	var fields = this.model.gModel.fields.asArray();
    	var index;
    	for (i = 0, len = fields.length; i<len; i++) {
    		if (fields[i].name == this.model.fieldData.name) {
    			index = i;
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

    	if (newField.type === 'boolean') {
    		newField.defValue=$('#def-value-field').prop('checked');
    	} else {    		
    		newField.defValue=$('#def-value-field').val();
    	}

    	var fieldType = this.model.fieldData.type;
    	if (['double','integer','long','short','float'].indexOf(fieldType) >= 0) {
    		newField.minValue = $('#min-value-field').val();
    		newField.maxValue = $('#max-value-field').val();
    	} else if (fieldType === 'string') {
			newField.stringLen = $('#string-len-field').val();
		}
		this.model.fieldData = newField;
		this.model.gModel.fields.set(index, this.model.fieldData);
    },

    onFieldSelected: function(selectedField) {
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
        this.saveUiToGoogle();
    	this.forceUpdate();
    },

	makeNameInput: function() {
		return (
			<div className='input-field col s4'>
				<input type='text' id='name-field'/>
				<label htmlFor='name-field'>name</label>
		   	</div>
		);
	},

	makeFieldTypeInput: function() {
		return(
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
		  		<label htmlFor='type-field'>type</label>
		 	</div>
		 );
	},

	makeDescriptInput: function() {
		return(
			<div className='input-field col s12'>
				<textarea id='description-field' className='materialize-textarea'></textarea>
				<label htmlFor='description-field'>description</label>
		  	</div>
		); 
	},

    makeDefValueInput: function() {
		if (this.model.fieldDataType!=='boolean') {
			return(
				<div className='col s4 input-field'>
					<input type='text' id='def-value-field' className='def-value-field'/>
					<label htmlFor='def-value-field'>default value</label>
 	  			</div>
 	  		)
		} else {
			return(
				<div className='col s4'>
					<input type='checkbox' id='def-value-field' className='filled-in'/>
					<label htmlFor='def-value-field'>default value</label>
				</div>
			)
		}
	},

	makeCheckboxes: function() {
		return(
			<div className='col s4 offset-s4'>
				<input type='checkbox' id='read-only-checkbox' className='filled-in'/>
				<label htmlFor='read-only-checkbox'>read only</label>
				<br></br>
				<input type='checkbox' id='optional-checkbox' className='filled-in'/>
				<label htmlFor='optional-checkbox'>optional</label>
				<br></br>
				<input type='checkbox' id='array-checkbox' className='filled-in'/>
				<label htmlFor='array-checkbox'>array</label>
			</div>
		);
	},

	makeContextIdentifier: function() {
		return(
			<div className='col s12'>
				<input type='checkbox' id='context-id-checkbox' className='filled-in'/>
				<label htmlFor='context-id-checkbox'>context identifier</label>
			</div>
		);
	},

	render: function() {
		var nameInput=this.makeNameInput();
		var fieldTypeInput=this.makeFieldTypeInput();
		var descriptInput=this.makeDescriptInput();
		var defValueInput= this.makeDefValueInput();
		var checkboxes=this.makeCheckboxes();
		var contextIdentifier=this.makeContextIdentifier();

		return(
			<div className='row'>
    			<form className='col s12' action='#!'>
					<div className='row'>
						{nameInput}
						{fieldTypeInput}
					</div>
					<div className='row'>
						{descriptInput}
					</div>
					<div className='row'>
						{defValueInput}
						{checkboxes}
					</div>
					<OptionalInput fieldType={this.model.fieldData.type} />
					<div className='row'>
						{contextIdentifier}
					</div>
				</form>
			</div>
		);
	}
}); 

OptionalInput=React.createClass({
	render: function() {
		if (this.props.fieldType==='string'){
			return(
				<div className='row'>
					<div className='input-field col s4'>
						<input type='text' id='string-len-field'/>
						<label htmlFor='string-len-field'>length</label>
					</div>
				</div>
			);
		} else if (['double','integer','long','short','float'].indexOf(this.props.fieldType)!==-1) {
			return(
				<div className='row'>
					<div className='input-field col s4'>
						<input type='text' id='min-field'/>
						<label htmlFor='min-field'>min value</label>
					</div>
					<div className='input-field col s4'>
						<input type='text' id='max-field'/>
						<label htmlFor='max-field'>max value</label>
					</div>
				</div>
			);
		} else {
			return(
				<div className='row'></div>
			);
		}
	}
});