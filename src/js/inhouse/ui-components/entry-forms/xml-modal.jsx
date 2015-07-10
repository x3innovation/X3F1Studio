var GDriveConstants = require('../../constants/google-drive-constants.js');
var EventType = require('../../constants/event-type.js')

var GDriveService = require('../../services/google-drive-service.js');
var Configs = require('../../app-config.js');

module.exports = React.createClass({
	/* ******************************************
	            LIFE CYCLE FUNCTIONS
	****************************************** */
	componentWillMount: function() {
		this.gModel = null;

		Bullet.on(EventType.EntryForm.GAPI_FILE_LOADED, 'xml-modal.jsx>>onGapiFileLoaded', this.onGapiFileLoaded);
	},

	componentWillUnmount: function() {
		Bullet.off(EventType.EntryForm.GAPI_FILE_LOADED, 'xml-modal.jsx>>onGapiFileLoaded');
	},

	/* ******************************************
	        	NON LIFE CYCLE FUNCTIONS
	****************************************** */
	onGapiFileLoaded: function(doc) {
		this.gModel = doc.getModel().getRoot().get(this.props.gapiKey);
		$('#xml-btn-wrapper').removeClass('hide');
	},

	highlightAllContent: function(e) {
		var contentField = e.currentTarget;
		var range = document.createRange();
		range.setStartBefore(contentField.firstChild);
		range.setEndAfter(contentField.lastChild);
		var sel = window.getSelection();
		sel.removeAllRanges();
		sel.addRange(range);
	},

	onGenerateXMLBtnClick: function() {
		var XML_VERSION_TAG = '<?xml version=\'1.0\' encoding=\'UTF-8\'?>';
		var x2js = new X2JS();
		var jsonData = this.generateJSONData();
		var xmlData = XML_VERSION_TAG + x2js.json2xml_str(jsonData);
		this.onXMLGenerated(xmlData);
	},

	onXMLGenerated: function(xmlData) {
		var $xmlDisplay = $('#xml-display');
		this.xmlDisplayData = vkbeautify.xml(xmlData);
		$xmlDisplay.text(this.xmlDisplayData);
		hljs.highlightBlock($xmlDisplay[0]);
		$('#xml-display-modal').openModal({
			opacity: 0.7,
			in_duration: 250,
			out_duration: 250
		});
	},
	
	onDownloadXMLBtnClick: function(e) {
		var xmlFile = 'data:application/xml;charset=utf-8,' + encodeURIComponent(this.xmlDisplayData);
		e.currentTarget.setAttribute('download', 'dataModel.xml');
		e.currentTarget.setAttribute('href', xmlFile);
	},

	generateJSONData: function() {
		var dataModel = this.gModel;
		var name = dataModel.title.toString();
		var description = dataModel.description.toString();
		var typeId = dataModel.id;
		var jsonObj = {};
		if (this.props.fileType === GDriveConstants.ObjectType.PERSISTENT_DATA) {
			jsonObj.Data = { 
				_name: name,
				_typeId: typeId,
				Annotation: [{
					'_name': 'description',
					'_svalue': description 
					}, { 
					'_name': 'type',
					'_svalue': 'persistentData' 
				}],
				Field: []
			};
			jsonObj.UpdatePersistenceEvent = {
				_name: 'Update ' + name,
				_typeId: dataModel.UpdatePersistenceEventTypeId,
				_persistentData: name };
			jsonObj.CreatePersistenceEvent = {
				_name: 'Create ' + name,
				_typeId: dataModel.CreatePersistenceEventTypeId,
				_persistentData: name };
			jsonObj.RemovePersistenceEvent = {
				_name: 'Remove ' + name,
				_typeId: dataModel.RemovePersistenceEventTypeId,
				_persistentData: name };
			jsonObj.UpdatedPersistenceEvent = {
				_name: name + ' Updated',
				_typeId: dataModel.UpdatedPersistenceEventTypeId,
				_persistentData: name };
			jsonObj.CreatedPersistenceEvent = {
				_name: name + ' Created',
				_typeId: dataModel.CreatedPersistenceEventTypeId,
				_persistentData: name };
			jsonObj.RemovedPersistenceEvent = {
				_name: name + ' Removed',
				_typeId: dataModel.RemovedPersistenceEventTypeId,
				_persistentData: name };
			jsonObj.RejectedUpdatePersistenceEvent = {
				_name: 'Update ' + name + 'Rejected',
				_typeId: dataModel.RejectedUpdatePersistenceEventTypeId,
				_persistentData: name };
			jsonObj.RejectedCreatePersistenceEvent = {
				_name: 'Create ' + name + 'Rejected',
				_typeId: dataModel.RejectedCreatePersistenceEventTypeId,
				_persistentData: name };
			jsonObj.RejectedRemovePersistenceEvent = {
				_name: 'Remove ' + name + 'Rejected',
				_typeId: dataModel.RejectedRemovePersistenceEventTypeId,
				_persistentData: name };

			var gFields = dataModel.fields;
			if (gFields.length) {
				this.setFieldData(gFields, jsonObj.Data.Field);
			} else {
				delete jsonObj.Data.Field;
			}
		} else if (this.props.fileType === GDriveConstants.ObjectType.SNIPPET) {
			jsonObj.Data = { 
				_name: name,
				_typeId: typeId,
				Annotation: [{
					'_name': 'description',
					'_svalue': description 
					}, { 
					'_name': 'type',
					'_svalue': 'persistentData' 
				}],
				Field: []
			};

			var gFields = dataModel.fields;
			if (gFields.length) {
				this.setFieldData(gFields, jsonObj.Data.Field);
			} else {
				delete jsonObj.Data.Field;
			}
		} else if (this.props.fileType === GDriveConstants.ObjectType.EVENT) {
			jsonObj.Data = { 
				_name: name,
				_typeId: typeId,
				Annotation: [{
					'_name': 'description',
					'_svalue': description 
					}, { 
					'_name': 'type',
					'_svalue': 'persistentData' 
				}],
				Field: []
			};

			var gFields = dataModel.fields;
			if (gFields.length) {
				this.setFieldData(gFields, jsonObj.Data.Field);
			} else {
				delete jsonObj.Data.Field;
			}
		} else if (this.props.fileType === GDriveConstants.ObjectType.ENUM) {
			jsonObj.Enum = { 
				_name: name,
				_typeId: typeId,
				Annotation: [{
					'_name': 'description',
					'_svalue': description 
					}, { 
					'_name': 'type',
					'_svalue': 'persistentData' 
				}],
				Choice: []
			};

			var gFields = dataModel.fields;
			if (gFields.length) {
				this.setEnumFieldData(gFields, jsonObj.Enum.Choice);
			} else {
				delete jsonObj.Enum.Choice;
			}
		}
		return jsonObj;
	},

	setFieldData: function(gFields, jsonField) {
		var gField;
		for (var i = 0, len = gFields.length; i<len; i++) {
			gField = gFields.get(i);
			jsonField[i] = {
				_name: gField.get('name').toString(),
				_type: gField.get('type').toString(),
				'Annotation': {
					'_name': 'description',
					'_svalue': gField.get('description').toString()
				},
				_default: gField.get('defValue').toString(),
				_readOnly: gField.get('readOnly').toString(),
				_optional: gField.get('optional').toString()
			};
			switch (gField.get('type').toString()) {
				case 'double':
				case 'float':
				case 'byte':
				case 'short':
				case 'integer':
				case 'long':
					if (isNaN(gField.get('defValue').toString())) {
						jsonField[i]._default = ''; //don't send a non-number value
					}
					if (gField.get('minValue').toString().length && !isNaN(gField.get('minValue').toString())) {
						jsonField[i]._min = gField.get('minValue').toString();
					}
					if (gField.get('maxValue').toString().length && !isNaN(gField.get('maxValue').toString())) {
						jsonField[i]._max = gField.get('maxValue').toString();
					}
					break;
				case 'boolean':
					jsonField[i]._default = gField.get('defValueBool').toString();
					break;
				case 'string':
					jsonField[i]._length = gField.get('strLen').toString();
					break;
				case 'ref':
					jsonField[i]._ref = gField.get('refName');
					jsonField[i]._refType = gField.get('refType');
					break;
				case 'enum':
					jsonField[i]._enum = gField.get('enumName');
					jsonField[i]._default = gField.get('enumValue');
					break;
				}
			if (gField.get('array') && !isNaN(gField.get('arrayLen').toString()) &&
			    parseInt(gField.get('arrayLen').toString(), 10) > 0) {
				jsonField[i]._sequenceLength = gField.get('arrayLen').toString();
			}
		}
	},

	setEnumFieldData: function(gFields, jsonField) {
		var gField;
		for (var i = 0, len = gFields.length; i<len; i++) {
			gField = gFields.get(i);
			jsonField[i] = {
				_name: gField.name,
				_index: gField.index,
				'Annotation': {
					'_name': 'description',
					'_svalue': gField.description
				}
			};
		}
	},

	render: function() {
		return (
			<div className = 'row'>
				<div id = 'xml-btn-wrapper' className = 'col s3 hide'>
					<a id = 'generate-xml-btn' onClick = {this.onGenerateXMLBtnClick}
					   className = {'btn z-depth-1 waves-effect waves-light '+Configs.App.ADD_BUTTON_COLOR}>Generate XML</a>
				</div>
				<div id='xml-display-modal' className='modal modal-fixed-footer z-depth-2'>
					<div className='modal-content'>
						<pre><code id='xml-display' className='xml' onDoubleClick={this.highlightAllContent} /></pre>
					</div>
					<div className="modal-footer">
						<a id='xml-download-btn' className='modal-close modal-action waves-effect btn-flat'
							onClick = {this.onDownloadXMLBtnClick}>
							<i className='mdi-file-file-download' />Download XML</a>
					</div>
				</div>
			</div>
		);
	}
});
