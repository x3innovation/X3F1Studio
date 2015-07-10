var GDriveConstants = require('../../constants/google-drive-constants.js');
var EventType = require('../../constants/event-type.js');

var Configs = require('../../app-config.js');

module.exports = React.createClass({
	/* ******************************************
	            LIFE CYCLE FUNCTIONS
	****************************************** */
	componentWillMount: function() {

	},

	componentWillUnmount: function() {

	},

	/* ******************************************
	        	NON LIFE CYCLE FUNCTIONS
	****************************************** */
	onGenerateXMLBtnClick: function(e) {
		if (e.target === e.currentTarget) {
			this.classifyProjectObjects();
			this.generateJSONDataAndConvertToXML();
		}
	},

	classifyProjectObjects: function() {
		this.enums = [];
		this.datas = [];
		this.flows = [];
		var projectObjects = this.props.projectObjects;
		for (var i = 0, len = projectObjects.length; i<len; i++) {
			switch (projectObjects[i].description) {
				case GDriveConstants.ObjectType.PERSISTENT_DATA:
				case GDriveConstants.ObjectType.SNIPPET:
				case GDriveConstants.ObjectType.EVENT:
					this.datas.push(projectObjects[i]);
					break;
				case GDriveConstants.ObjectType.ENUM:
					this.enums.push(projectObjects[i]);
					break;
				case GDriveConstants.ObjectType.FLOW:
					this.flows.push(projectObjects[i]);
					break;
				default:
					break;
			}
		}
	},

	generateJSONDataAndConvertToXML: function() {
		var title = this.props.projectFile.title;
		var description = this.props.projectFile.description;
		var jsonRootObj = {
			'dmx:dmxSchema': {
				_name: title,
				_version: "1",
				'_xmlns:dmx': 'schema.dmx.f1.x3',
				'_xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
				'_xsi:schemaLocation': 'schema.dmx.f1.x3 /dmxSchema.xsd',
				Annotation: [{
						"_name": "description",
						"_svalue": description
					}],
				Enum: [],
				Data: [],
				UpdatePersistenceEvent: [],
				CreatePersistenceEvent: [],
				RemovePersistenceEvent: [],
				UpdatedPersistenceEvent: [],
				CreatedPersistenceEvent: [],
				RemovedPersistenceEvent: [],
				RejectedUpdatePersistenceEvent: [],
				RejectedCreatePersistenceEvent: [],
				RejectedRemovePersistenceEvent: []
			},
        	'fmx:fmxSchema': {
        	    _name: title,
        	    _version: "1",
        	    '_xmlns:fmx': 'schema.fmx.f1.x3',
        	    '_xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
        	    '_xsi:schemaLocation': 'schema.fmx.f1.x3 /fmxSchema.xsd',
        	    'j': [],
        	}
		};

		var DMX_SCHEMA = 'dmx:dmxSchema';
		var FMX_SCHEMA = 'fmx:fmxSchema';
		
		var that = this;
		that.loadAllEnums(function(enumJsonNode) {
			jsonRootObj[DMX_SCHEMA].Enum = enumJsonNode;
			that.loadAllDatas(function(dataJsonNode) {
				jsonRootObj[DMX_SCHEMA].Data = dataJsonNode.Data;
				jsonRootObj[DMX_SCHEMA].UpdatePersistenceEvent = dataJsonNode.UpdatePersistenceEvent;
				jsonRootObj[DMX_SCHEMA].CreatePersistenceEvent = dataJsonNode.CreatePersistenceEvent;
				jsonRootObj[DMX_SCHEMA].RemovePersistenceEvent = dataJsonNode.RemovePersistenceEvent;
				jsonRootObj[DMX_SCHEMA].UpdatedPersistenceEvent = dataJsonNode.UpdatedPersistenceEvent;
				jsonRootObj[DMX_SCHEMA].CreatedPersistenceEvent = dataJsonNode.CreatedPersistenceEvent;
				jsonRootObj[DMX_SCHEMA].RemovedPersistenceEvent = dataJsonNode.RemovedPersistenceEvent;
				jsonRootObj[DMX_SCHEMA].RejectedUpdatePersistenceEvent = dataJsonNode.RejectedUpdatePersistenceEvent;
				jsonRootObj[DMX_SCHEMA].RejectedCreatePersistenceEvent = dataJsonNode.RejectedCreatePersistenceEvent;
				jsonRootObj[DMX_SCHEMA].RejectedRemovePersistenceEvent = dataJsonNode.RejectedRemovePersistenceEvent;
				that.convertToXml(jsonRootObj);
			});
		});
	},

	convertToXml: function(jsonRootObj) {
		console.log(JSON.stringify(jsonRootObj));
		var XML_VERSION_TAG = '<?xml version=\'1.0\' encoding=\'UTF-8\'?>';
		var x2js = new X2JS();
		var xmlData = XML_VERSION_TAG + x2js.json2xml_str(jsonRootObj);
		console.log(xmlData);
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

	loadAllEnums: function(callback) {
		var enumJsonNode = [];
		var enumCount = this.enums.length;
		var enumsLoaded = 0;

		var onEnumLoad = function(doc) {
			var gModel = doc.getModel().getRoot().get(GDriveConstants.CustomObjectKey.ENUM);
			var name = gModel.title.toString();
			var description = gModel.description.toString();
			var typeId = gModel.id;
			var node = {
				_typeId: typeId,
				_name: name,
				"Annotation": {
					"_name": "description",
					"_svalue": description
				},
			};

			var gFields = gModel.fields;
			if (gFields.length) {
				var gField;
				node.Choice = [];
				for (var i = 0, len = gFields.length; i<len; i++) {
					gField = gFields.get(i);
					node.Choice[i] = {
						_name: gField.name + '' || gField.get('name').toString(),
						_index: gField.index + '' || gField.get('index').toString(),
						'Annotation': {
							'_name': 'description',
							'_svalue': gField.description + '' || gField.get('description').toString()
						}
					};
				}
			}

			enumJsonNode.push(node);
			enumsLoaded ++;
			if (enumsLoaded === enumCount && typeof callback === 'function') {
				callback(enumJsonNode);
			}
		};

		for (var i = 0; i<enumCount; i++) {
			gapi.drive.realtime.load(this.enums[i].id, onEnumLoad);
		}
	},

	loadAllDatas: function(callback) {
		var dataJsonNode = {
			Data: [],
			UpdatePersistenceEvent: [],
			CreatePersistenceEvent: [],
			RemovePersistenceEvent: [],
			UpdatedPersistenceEvent: [],
			CreatedPersistenceEvent: [],
			RemovedPersistenceEvent: [],
			RejectedUpdatePersistenceEvent: [],
			RejectedCreatePersistenceEvent: [],
			RejectedRemovePersistenceEvent: [],
		};
		var dataCount = this.datas.length;
		var datasLoaded = 0;

		var createNode = function(gModel, dataType) {
			var node = {};
			var name = gModel.title.toString();
			var description = gModel.description.toString();
			var typeId = gModel.id;

			node.Data = {
				_name: name,
				_typeId: typeId,
				_identifiable: 'true',
				_stateChecked: 'false',
				_type: dataType,
				Annotation: [{
					'_name': 'description',
					'_svalue': description 
					}, { 
					'_name': 'type',
					'_svalue': dataType 
				}]
			};
			return node;
		};

		var setJsonEvents = function(node, gModel) {
			var name = gModel.title.toString();
			node.UpdatePersistenceEvent = {
				_name: 'Update ' + name,
				_typeId: gModel.UpdatePersistenceEventTypeId,
				_persistentData: name };
			node.CreatePersistenceEvent = {
				_name: 'Create ' + name,
				_typeId: gModel.CreatePersistenceEventTypeId,
				_persistentData: name };
			node.RemovePersistenceEvent = {
				_name: 'Remove ' + name,
				_typeId: gModel.RemovePersistenceEventTypeId,
				_persistentData: name };
			node.UpdatedPersistenceEvent = {
				_name: name + ' Updated',
				_typeId: gModel.UpdatedPersistenceEventTypeId,
				_persistentData: name };
			node.CreatedPersistenceEvent = {
				_name: name + ' Created',
				_typeId: gModel.CreatedPersistenceEventTypeId,
				_persistentData: name };
			node.RemovedPersistenceEvent = {
				_name: name + ' Removed',
				_typeId: gModel.RemovedPersistenceEventTypeId,
				_persistentData: name };
			node.RejectedUpdatePersistenceEvent = {
				_name: 'Update ' + name + 'Rejected',
				_typeId: gModel.RejectedUpdatePersistenceEventTypeId,
				_persistentData: name };
			node.RejectedCreatePersistenceEvent = {
				_name: 'Create ' + name + 'Rejected',
				_typeId: gModel.RejectedCreatePersistenceEventTypeId,
				_persistentData: name };
			node.RejectedRemovePersistenceEvent = {
				_name: 'Remove ' + name + 'Rejected',
				_typeId: gModel.RejectedRemovePersistenceEventTypeId,
				_persistentData: name };
			return node;
		};

		var setJsonFields = function(node, gFields) {
			node.Data.Field = [];
			var gField;
			for (var i = 0, len = gFields.length; i<len; i++) {
				gField = gFields.get(i);
				node.Data.Field[i] = {
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
							node.Data.Field[i]._default = ''; //don't send a non-number value
						}
						if (gField.get('minValue').toString().length && !isNaN(gField.get('minValue').toString())) {
							node.Data.Field[i]._min = gField.get('minValue').toString();
						}
						if (gField.get('maxValue').toString().length && !isNaN(gField.get('maxValue').toString())) {
							node.Data.Field[i]._max = gField.get('maxValue').toString();
						}
						break;
					case 'boolean':
						node.Data.Field[i]._default = gField.get('defValueBool').toString();
						break;
					case 'string':
						node.Data.Field[i]._length = gField.get('strLen').toString();
						break;
					case 'ref':
						node.Data.Field[i]._ref = gField.get('refName');
						node.Data.Field[i]._refType = '';
						if (gField.get('refType') === 'soft') {
							node.Data.Field[i]._refType = 'pointer';
						} else {
							node.Data.Field[i]._refType = 'embedded';
						}
						break;
					case 'enum':
						node.Data.Field[i]._enum = gField.get('enumName');
						node.Data.Field[i]._default = gField.get('enumValue');
						break;
					}
				if (gField.get('array') && !isNaN(gField.get('arrayLen').toString()) &&
				    parseInt(gField.get('arrayLen').toString(), 10) > 0) {
					node.Data.Field[i]._sequenceLength = gField.get('arrayLen').toString();
				}
			}
			return node;
		};

		var onPersistentDataLoad = function(doc) {
			var gModel = doc.getModel().getRoot().get(GDriveConstants.CustomObjectKey.PERSISTENT_DATA);
			var dataType = 'persistentData';
			var node = createNode(gModel, dataType);

			var gFields = gModel.fields;
			if (gFields.length) {
				node = setJsonFields(node, gFields);
			}
			node = setJsonEvents(node, gModel);

			dataJsonNode.Data.push(node.Data);
			dataJsonNode.UpdatePersistenceEvent.push(node.UpdatePersistenceEvent);
			dataJsonNode.CreatePersistenceEvent.push(node.CreatePersistenceEvent);
			dataJsonNode.RemovePersistenceEvent.push(node.RemovePersistenceEvent);
			dataJsonNode.UpdatedPersistenceEvent.push(node.UpdatedPersistenceEvent);
			dataJsonNode.CreatedPersistenceEvent.push(node.CreatedPersistenceEvent);
			dataJsonNode.RemovedPersistenceEvent.push(node.RemovedPersistenceEvent);
			dataJsonNode.RejectedUpdatePersistenceEvent.push(node.RejectedUpdatePersistenceEvent);
			dataJsonNode.RejectedCreatePersistenceEvent.push(node.RejectedCreatePersistenceEvent);
			dataJsonNode.RejectedRemovePersistenceEvent.push(node.RejectedRemovePersistenceEvent);

			datasLoaded++;
			if (datasLoaded === dataCount && typeof callback === 'function') {
				callback(dataJsonNode);
			}
		};

		var onEventLoad = function(doc) {
			var dataType = 'event';
			var gModel = doc.getModel().getRoot().get(GDriveConstants.CustomObjectKey.EVENT);
			var node = createNode(gModel, dataType);

			var gFields = gModel.fields;
			if (gFields.length) {
				node = setJsonFields(node, gFields);
			}

			dataJsonNode.Data.push(node.Data);

			datasLoaded++;
			if (datasLoaded === dataCount && typeof callback === 'function') {
				callback(dataJsonNode);
			}
		};

		var onSnippetLoad = function(doc) {
			var dataType = 'snippet';
			var gModel = doc.getModel().getRoot().get(GDriveConstants.CustomObjectKey.SNIPPET);
			var node = createNode(gModel, dataType);

			var gFields = gModel.fields;
			if (gFields.length) {
				node = setJsonFields(node, gFields);
			}

			dataJsonNode.Data.push(node.Data);

			datasLoaded++;
			if (datasLoaded === dataCount && typeof callback === 'function') {
				callback(dataJsonNode);
			}
		};

		for (var i = 0; i<dataCount; i++) {
			if (this.datas[i].description === GDriveConstants.ObjectType.PERSISTENT_DATA){
				gapi.drive.realtime.load(this.datas[i].id, onPersistentDataLoad);
			} else if (this.datas[i].description === GDriveConstants.ObjectType.SNIPPET){
				gapi.drive.realtime.load(this.datas[i].id, onSnippetLoad);
			} else if (this.datas[i].description === GDriveConstants.ObjectType.EVENT){
				gapi.drive.realtime.load(this.datas[i].id, onEventLoad);
			}
		}
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

	render: function() {
		return (
			<div className = 'row'>
				<div id = 'xml-btn-wrapper' className = 'col s3'>
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
