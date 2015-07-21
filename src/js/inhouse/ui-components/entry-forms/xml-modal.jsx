var GDriveConstants = require('../../constants/google-drive-constants.js');
var EventType = require('../../constants/event-type.js');

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

	replaceAll: function(string, findArr, replacement) {
		if (typeof findArr === 'string') {
			string = string.split(findArr).join(replacement);
		} else {
			for (var i = 0, len = findArr.length; i<len; i++) {
				string = string.split(findArr[i]).join(replacement);
			}
		}
		return string;
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
		var XML_HEADER_TAG = "<?xml version='1.0' encoding='UTF-8' ?>";
		var x2js = new X2JS();
		var jsonData = this.generateJSONData();
		var xmlData = XML_HEADER_TAG + x2js.json2xml_str(jsonData);
		this.onXMLGenerated(xmlData);
	},

	onXMLGenerated: function(xmlData) {
		var $xmlDisplay = $('#xml-display');
		this.xmlDisplayData = vkbeautify.xml(xmlData);
		$xmlDisplay.text(this.xmlDisplayData);
		hljs.highlightBlock($xmlDisplay[0]);
		$('#xml-display-modal').openModal({
			opacity: 0.7,
			in_duration: 200,
			out_duration: 200
		});
	},
	
	onDownloadXMLBtnClick: function(e) {
		var xmlFile = 'data:application/xml;charset=utf-8,' + encodeURIComponent(this.xmlDisplayData);
		e.currentTarget.setAttribute('download', 'dataModel.xml');
		e.currentTarget.setAttribute('href', xmlFile);
	},

	generateJSONData: function() {
		var dataModel = this.gModel;
		var name = this.replaceAll(dataModel.title.toString(), ' ', '');
		var description = dataModel.description.toString();
		var typeId = dataModel.id;
		var jsonObj = {
			'dmx:dmxSchema': {
				'_name' : name,
				'_version' : "1",
				'_xmlns:dmx' : "schema.dmx.f1.x3", 
				'_xmlns:xsi' : "http://www.w3.org/2001/XMLSchema-instance",
				'_xsi:schemaLocation' : "schema.dmx.f1.x3 /dmxSchema.xsd"
			}};
		var gFields;
		var dataObj = jsonObj['dmx:dmxSchema'];
		if (this.props.fileType === GDriveConstants.ObjectType.PERSISTENT_DATA) {
			dataObj.Data = { 
				_name: name,
				_typeId: typeId,
				_type: 'persisted',
				_identifiable: 'true',
				_stateChecked: 'false',
				Annotation: [{
					'_name': 'description',
					'_svalue': description 
					}, { 
					'_name': 'type',
					'_svalue': 'persisted' 
				}],
				Field: []
			};
			dataObj.UpdatePersistenceEvent = {
				_name: 'Update' + name,
				_typeId: dataModel.UpdatePersistenceEventTypeId,
				_persistedData: name };
			dataObj.CreatePersistenceEvent = {
				_name: 'Create' + name,
				_typeId: dataModel.CreatePersistenceEventTypeId,
				_persistedData: name };
			dataObj.RemovePersistenceEvent = {
				_name: 'Remove' + name,
				_typeId: dataModel.RemovePersistenceEventTypeId,
				_persistedData: name };
			dataObj.UpdatedPersistenceEvent = {
				_name: name + 'Updated',
				_typeId: dataModel.UpdatedPersistenceEventTypeId,
				_persistedData: name };
			dataObj.CreatedPersistenceEvent = {
				_name: name + 'Created',
				_typeId: dataModel.CreatedPersistenceEventTypeId,
				_persistedData: name };
			dataObj.RemovedPersistenceEvent = {
				_name: name + 'Removed',
				_typeId: dataModel.RemovedPersistenceEventTypeId,
				_persistedData: name };
			dataObj.RejectedUpdatePersistenceEvent = {
				_name: 'Update' + name +'Rejected',
				_typeId: dataModel.RejectedUpdatePersistenceEventTypeId,
				_persistedData: name };
			dataObj.RejectedCreatePersistenceEvent = {
				_name: 'Create' + name + 'Rejected',
				_typeId: dataModel.RejectedCreatePersistenceEventTypeId,
				_persistedData: name };
			dataObj.RejectedRemovePersistenceEvent = {
				_name: 'Remove' + name + 'Rejected',
				_typeId: dataModel.RejectedRemovePersistenceEventTypeId,
				_persistedData: name };

			gFields = dataModel.fields;
			if (gFields.length) {
				this.setFieldData(gFields, dataObj.Data.Field);
			}
		} else if (this.props.fileType === GDriveConstants.ObjectType.SNIPPET) {
			dataObj.Data = { 
				_name: name,
				_typeId: typeId,
				_type: 'snippet',
				_identifiable: 'false',
				Annotation: [{
					'_name': 'description',
					'_svalue': description 
					}, { 
					'_name': 'type',
					'_svalue': 'snippet' 
				}],
				Field: []
			};

			gFields = dataModel.fields;
			if (gFields.length) {
				this.setFieldData(gFields, dataObj.Data.Field);
			}
		} else if (this.props.fileType === GDriveConstants.ObjectType.EVENT) {
			dataObj.Data = { 
				_name: name,
				_typeId: typeId,
				_type: 'event',
				_identifiable: 'false',
				Annotation: [{
					'_name': 'description',
					'_svalue': description 
					}, { 
					'_name': 'type',
					'_svalue': 'event' 
				}],
				Field: []
			};

			gFields = dataModel.fields;
			if (gFields.length) {
				this.setFieldData(gFields, dataObj.Data.Field);
			}
		} else if (this.props.fileType === GDriveConstants.ObjectType.ENUM) {
			dataObj.Enum = { 
				_name: name,
				_typeId: typeId,
				Annotation: [{
					'_name': 'description',
					'_svalue': description 
				}],
				Choice: []
			};

			gFields = dataModel.fields;
			if (gFields.length) {
				this.setEnumFieldData(gFields, dataObj.Enum.Choice);
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
				_default: gField.get('defValue').toString()
				//_readOnly: gField.get('readOnly').toString(),
			};
			if (gField.get('optional')) {
				jsonField[i]._optional = 'true';
			}
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
					jsonField[i]._refType = '';
					if (gField.get('refType') === 'soft') {
						jsonField[i]._refType = 'pointer';
					} else {
						jsonField[i]._refType = 'embedded';
					}
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
					   className = {'btn z-depth-1 waves-effect waves-light '+Configs.App.ADD_BUTTON_COLOR}>
					   Generate XML</a>
				</div>
				<div id='xml-display-modal' className='modal modal-fixed-footer z-depth-2'>
					<div className='modal-content'>
						<pre><code id='xml-display' className='xml' onDoubleClick={this.highlightAllContent} /></pre>
					</div>
					<div className='modal-footer'>
						<a id='xml-download-btn' className='modal-close modal-action waves-effect btn-flat'
							onClick = {this.onDownloadXMLBtnClick}>
							<i className='mdi-file-file-download' />Download XML</a>
					</div>
				</div>
			</div>
		);
	}
});
