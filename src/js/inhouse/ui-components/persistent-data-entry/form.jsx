var EventType=require('../../constants/event-type.js');
var GDriveConstants=require('../../constants/google-drive-constants.js');
var DefaultValueConstants=require('../../constants/default-value-constants.js');
var googleDriveService=require('../../services/google-drive-service.js');
var DefaultFields=DefaultValueConstants.DefaultFieldAttributes;
;
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
		this.model.refs=[];
		this.model.enumNames=[];
		this.firstRefLoad=true;

		Bullet.on(EventType.PersistentDataEntry.GAPI_FILE_LOADED, 'form.jsx>>onGapiFileLoaded', this.onGapiFileLoaded); 
		Bullet.on(EventType.PersistentDataEntry.METADATA_MODEL_LOADED, 'form.jsx>>onMetadataModelLoaded', this.onMetadataModelLoaded); 
		Bullet.on(EventType.PersistentDataEntry.FIELD_SELECTED, 'form.jsx>>onFieldSelected', this.onFieldSelected);
	}, 

	componentDidMount: function() {
		$('#ref-name-dropdown').mouseenter(function(){
			this.getRefs();
		}.bind(this));

		$('#ref-name-select').material_select();
	}, 

	componentWillUnmount: function() {
		Bullet.off(EventType.PersistentDataEntry.GAPI_FILE_LOADED, 'form.jsx>>onGapiFileLoaded');
		Bullet.off(EventType.PersistentDataEntry.METADATA_MODEL_LOADED, 'form.jsx>>onMetadataModelLoaded');
		Bullet.off(EventType.PersistentDataEntry.FIELD_SELECTED, 'form.jsx>>onFieldSelected');
	}, 

	/* ******************************************
			   NON LIFE CYCLE FUNCTIONS
	****************************************** */

	onGapiFileLoaded: function(doc) {
		this.getRefs();

		var key=GDriveConstants.CustomObjectKey.PERSISTENT_DATA;
		this.model.gModel=doc.getModel().getRoot().get(key);
		this.model.gModel.fields.addEventListener(gapi.drive.realtime.EventType.VALUES_ADDED, this.updateUi);
		this.model.gModel.fields.addEventListener(gapi.drive.realtime.EventType.VALUES_REMOVED, this.updateUi);
		this.model.gModel.fields.addEventListener(gapi.drive.realtime.EventType.VALUES_SET, this.updateUi);
		this.updateUi();
		this.connectUi();
	}, 

	onMetadataModelLoaded: function(metadataModel) {
		googleDriveService.registerAnnouncement(metadataModel, function() {
			var announcement=metadataModel.announcement.get(0);
			if (announcement.action==='renameFile') {
				if (announcement.fileType==='persistentData' || announcement.fileType==='event') {
					this.updateRefNames(announcement);
				}
			}
		}.bind(this));
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

	keyUpHandler: function(e) {
		var $currFieldAttr=$(e.target);
		var code=(e.keyCode);	
		var nonInputKeys=[9,16,17,18,19,20,27,33,34,35,36,37,38,39,40,45,46,91,92,93,112,113,114,115,116, 
							117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,134,135,144,145];
		if (nonInputKeys.indexOf(code)>=0) {
			return false;
		}
		this.model.currFieldAttr.attr=$currFieldAttr;
		this.model.currFieldAttr.pos=$currFieldAttr[0].selectionStart;
		this.saveUiToGoogle();
	}, 

	saveUiToGoogle: function() {
		var fields=this.model.gModel.fields.asArray();
		var fieldIndex;
		for (i=0, len=fields.length; i<len; i+=1) {
			if (fields[i].ID==this.model.fieldData.ID) {
				fieldIndex=i;
				break;
			}
		}
		var newField={};
		newField.ID=this.model.fieldData.ID;
		newField.name=$('#name-field').val();
		newField.type=$('#field-type-select').val();
		newField.description=$('#description-field').val();
		newField.refId=$('#ref-name-select').val();
		newField.enumName=$('#enum-name-select').val();
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

	updateUi: function() {
		this.displayCorrectUiComponents();
		$('#name-field').val(this.model.fieldData.name);
		$('#field-type-select').val(this.model.fieldData.type);
		$('#description-field').val(this.model.fieldData.description);
		$('#def-value-field').val(this.model.fieldData.defValue);
		$('#min-value-field').val(this.model.fieldData.minValue);
		$('#max-value-field').val(this.model.fieldData.maxValue);
		$('#string-len-field').val(this.model.fieldData.stringLen);
		$('#ref-name-select').val(this.model.fieldData.refId);
		$('#enum-name-select').val(this.model.fieldData.enumName);
		$('#ref-soft-radio').prop('checked', this.model.fieldData.refType==='soft');
		$('#ref-hard-radio').prop('checked', this.model.fieldData.refType==='hard');
		$('#def-value-checkbox').prop('checked', this.model.fieldData.defValueBool);		
		$('#read-only-checkbox').prop('checked', this.model.fieldData.readOnly);
		$('#optional-checkbox').prop('checked', this.model.fieldData.optional);
		$('#array-checkbox').prop('checked', this.model.fieldData.array);
		$('#context-id-checkbox').prop('checked', this.model.fieldData.contextId);
		this.setCursorPos();
		this.updateAllSelect();
	}, 

	displayCorrectUiComponents: function() {
		$('.type-specific-field').addClass('hide');
		$('.'+this.model.fieldData.type+'-specific-field').removeClass('hide');
	}, 

	setCursorPos: function() {
		if (this.model.currFieldAttr.attr) {
			this.model.currFieldAttr.attr[0].setSelectionRange(this.model.currFieldAttr.pos, this.model.currFieldAttr.pos);
		} else {
			return false;
		}
	}, 

	realignLabels: function() {
		$('.text-input').each(function(index, element) {
			if ($(this).val()!='') {
				$(this).next('label').addClass('active');
			} else {
				$(this).next('label').removeClass('active');
			}
		});
	}, 

	updateAllSelect: function() {
		this.updateTypeSelect();
		this.updateRefSelect();
		this.updateEnumSelect();
	}, 

	updateTypeSelect: function() {
		$('#field-type-select').material_select(function(){
			this.onFieldTypeChanged($('#field-type-dropdown input.select-dropdown').val())
		}.bind(this));
	}, 

	updateRefSelect: function() {
		$('#ref-name-select').val(this.model.fieldData.refId);
		this.updateRefSelectOptions();
	}, 

	updateEnumSelect: function() {	
		$('#enum-name-select').material_select(function(){
			this.onEnumTypeChanged($('#enum-name-dropdown input.select-dropdown').val())
		}.bind(this));
	}, 

	getRefs: function() {
		googleDriveService.getProjectObjects(
			this.props.projectFolderFileId, 
			"", true, false, true, false, //only load persistent and event data
			this.onRefsLoaded);
	}, 

	onRefsLoaded: function(refObjects) {
		this.model.refs=[];
		for (i=0, len=refObjects.length; i<len; i+=1) {
			this.model.refs.push({
				id: refObjects[i].id, 
				title: refObjects[i].title});
		}
		if (this.firstRefLoad){
			this.firstRefLoad=false;
			this.setRefSelectOptions();
		}
	}, 

	updateRefNames: function(announcement) {
		var refs=this.model.refs;
		var len=refs.length;
		for (i=0; i<len; i+=1) {
			if (refs[i].id===announcement.fileId) {
				refs[i]={
					id: announcement.fileId, 
					title: announcement.fileNewName}
				break;
			}
		}
		this.updateRefSelectOptions();
	}, 

	setRefSelectOptions: function() {
		var refs=this.model.refs;
		if (refs!==[]) {
			$('#ref-name-select').empty();
			var len=refs.length;
			for (i=0; i<len; i+=1) {
				$('#ref-name-select').append("<option data-file-id='"+refs[i].id+"' value='"+refs[i].id+"'>"+refs[i].title+"</option>");	
			}

			if (typeof this.model.fieldData.refId != 'undefined') {
				$('#ref-name-select').val(this.model.fieldData.refId)
			}
			$('#ref-name-select').material_select(function(){
				this.onRefTypeChanged($('#ref-name-dropdown input.select-dropdown').val())
			}.bind(this));
		}

		$('#ref-name-dropdown').find('span').each(function(index, element) {
			for(i=0; i<len; i+=1) {
				if ($(this).text()===""+refs[i].title) {
					$(this).attr('data-file-id', refs[i].id);
					break;
				}
			}
		});
	}, 

	updateRefSelectOptions: function() {
		var refs=this.model.refs;
		var len=refs.length;
		var that=this;

		if (typeof this.model.fieldData.refId != 'undefined') {
			$('#ref-name-select').val(this.model.fieldData.refId)
		}
		$('#ref-name-dropdown').find('span').each(function(index, element) {
			for(i=0; i<len; i+=1) {
				if ($(this).attr('data-file-id')===refs[i].id && $(this).text()!==refs[i].title) {
					$(this).text(refs[i].title);
					if (refs[i].id===that.model.fieldData.refId) {
						$('#ref-name-dropdown .select-dropdown').val(refs[i].title);
					}
					break;
				}
			}
		});
	}, 

	setEnumSelectOptions: function() {
		var enumNames=this.model.enumNames;
		if (enumNames!==[]) {
			var len=enumNames.length;
			for (i=0; i<len; i+=1) {
				$('#enum-name-select').append('<option value="'+enumNames[i]+'">'+enumNames[i]+'</option>')
			}
			this.updateEnumSelect();
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
		this.setRefSelectOptions();
		this.setEnumSelectOptions();
		this.realignLabels();
	}, 

	onFieldTypeChanged: function(newFieldType) {
		this.model.fieldData.type=newFieldType;
		this.saveUiToGoogle();
	}, 

	onRefTypeChanged: function(newRefId) {
		this.model.fieldData.refId=newRefId;
		this.saveUiToGoogle();
	}, 

	onEnumTypeChanged: function(newEnumName) {
		this.model.fieldData.enumName=newEnumName;
		this.saveUiToGoogle();
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
				<div className='row type-specific-field string-specific-field'>
					<div className='input-field col s4'>
						<input type='text' id='string-len-field' className='text-input' />
						<label htmlFor='string-len-field' id='string-len-label'>length</label>
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
	}
});
