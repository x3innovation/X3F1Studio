var GDriveConstants = require('../../constants/google-drive-constants.js');
var EventType = require('../../constants/event-type.js');

var Configs = require('../../app-config.js');

module.exports = React.createClass({
	/* ******************************************
				NON LIFE CYCLE FUNCTIONS
	****************************************** */
	onGenerateXMLBtnClick: function(e) {
		this.classifyProjectObjects();
		this.generateJSONDataAndConvertToXML();
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
		var spacelessName = this.replaceAll(title, ' ', '');
		var jsonRootObj = {
			'amx:amxSchema': {
				'_name' : spacelessName,
				'_version' : "1",
				'_xmlns:xi' : "http://www.w3.org/2001/XInclude", 
				'_xmlns:amx' : "schema.amx.f1.x3", 
				'_xmlns:dmx' : "schema.dmx.f1.x3", 
				'_xmlns:fmx' : "schema.fmx.f1.x3",
				'_xmlns:mx' : "schema.mx.f1.x3",
				'_xmlns:xsi' : "http://www.w3.org/2001/XMLSchema-instance",
				'_xsi:schemaLocation' : 
					"schema.amx.f1.x3 /amxSchema.xsd\n"+
					"schema.dmx.f1.x3 /dmxSchema.xsd\n"+
					"schema.fmx.f1.x3 /fmxSchema.xsd\n"+
					"schema.mx.f1.x3 /mxSchema.xsd",
				'Application': {
					'_name': spacelessName,
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
					}
				}
			};

		var ApplicationJson = jsonRootObj['amx:amxSchema'].Application;

		var that = this;
		that.loadAllEnums(function(enumJsonNode) {
			ApplicationJson.Enum = enumJsonNode;
			that.loadAllDatas(function(dataJsonNode) {
				ApplicationJson.Data = dataJsonNode.Data;
				ApplicationJson.UpdatePersistenceEvent = dataJsonNode.UpdatePersistenceEvent;
				ApplicationJson.CreatePersistenceEvent = dataJsonNode.CreatePersistenceEvent;
				ApplicationJson.RemovePersistenceEvent = dataJsonNode.RemovePersistenceEvent;
				ApplicationJson.UpdatedPersistenceEvent = dataJsonNode.UpdatedPersistenceEvent;
				ApplicationJson.CreatedPersistenceEvent = dataJsonNode.CreatedPersistenceEvent;
				ApplicationJson.RemovedPersistenceEvent = dataJsonNode.RemovedPersistenceEvent;
				ApplicationJson.RejectedUpdatePersistenceEvent = dataJsonNode.RejectedUpdatePersistenceEvent;
				ApplicationJson.RejectedCreatePersistenceEvent = dataJsonNode.RejectedCreatePersistenceEvent;
				ApplicationJson.RejectedRemovePersistenceEvent = dataJsonNode.RejectedRemovePersistenceEvent;
				that.convertToXml(jsonRootObj);
			});
		});
	},

	convertToXml: function(jsonRootObj) {
		var XML_HEADER_TAG = "<?xml version='1.0' encoding='UTF-8' ?>";
		var x2js = new X2JS();
		var xmlData = XML_HEADER_TAG + x2js.json2xml_str(jsonRootObj);
		this.onXMLGenerated(xmlData);
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

	onXMLGenerated: function(xmlData) {
		var $xmlDisplay = $('#xml-display');
		var prettyXML = vkbeautify.xml(xmlData);
		this.xmlDisplayData = this.replaceAll(prettyXML, ['<j>', '</j>', '<j/>', '<j />'], '');
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

	loadAllEnums: function(callback) {
		var enumJsonNode = [];
		var enumCount = this.enums.length;
		var replaceAll = this.replaceAll;

		var onEnumLoad = function(doc) {
			var gModel = doc.getModel().getRoot().get(GDriveConstants.CustomObjectKey.ENUM);
			var name = gModel.title.toString();
			var spacelessName = replaceAll(name, ' ', '');
			var description = gModel.description.toString();
			var typeId = gModel.id;
			var node = {
				_typeId: typeId,
				_name: spacelessName,
				"Annotation": {
					"_name": "description",
					"_svalue": description
				}
			};

			if (gModel.fields.length) {
				var gField;
				node.Choice = [];
				for (var i = 0, len = gModel.fields.length; i<len; i++) {
					gField = gModel.fields.get(i);
					if (typeof gField.index === 'number') {
						node.Choice[i] = {
							_name: gField.name,
							_value: gField.index+'',
							'Annotation': {
								'_name': 'description',
								'_svalue': gField.description
							}
						};
					} else {
						node.Choice[i] = {
							_name: gField.get('name').toString(),
							_value: gField.get('index').toString(),
							'Annotation': {
								'_name': 'description',
								'_svalue': gField.get('description').toString(),
							}
						};
					}
				}
			}

			enumJsonNode.push(node);
			if (enumJsonNode.length === enumCount && typeof callback === 'function') {
				callback(enumJsonNode);
			}
		};

		if (enumCount === 0 && typeof callback === 'function') {
			callback(enumJsonNode);
		}
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
		var replaceAll = this.replaceAll;
		var firstEnum = this.enums[0];
		var firstRef = this.datas[0];

		var createDataNode = function(gModel, dataType) {
			var node = {};
			var name = replaceAll(gModel.title.toString(), ' ', '');
			var spacelessName = replaceAll(name, ' ', '');
			var description = gModel.description.toString();
			var typeId = gModel.id;

			node.Data = {
				_name: spacelessName,
				_typeId: typeId,
				_identifiable: 'false',
				_type: dataType,
				Annotation: [{
					'_name': 'description',
					'_svalue': description 
					}, { 
					'_name': 'type',
					'_svalue': dataType 
				}],
				Field: []
			};
			if (dataType === 'persisted') {
				node.Data._identifiable = 'true';
				node.Data._stateChecked = 'false';
			}
			return node;
		};

		var setJsonEvents = function(node, gModel) {
			var name = gModel.title.toString();
			var spacelessName = replaceAll(name, ' ', '');
			node.UpdatePersistenceEvent = {
				_name: 'Update' + spacelessName,
				_typeId: gModel.UpdatePersistenceEventTypeId,
				_persistedData: spacelessName };
			node.CreatePersistenceEvent = {
				_name: 'Create' + spacelessName,
				_typeId: gModel.CreatePersistenceEventTypeId,
				_persistedData: spacelessName };
			node.RemovePersistenceEvent = {
				_name: 'Remove' + spacelessName,
				_typeId: gModel.RemovePersistenceEventTypeId,
				_persistedData: spacelessName };
			node.UpdatedPersistenceEvent = {
				_name: spacelessName + 'Updated',
				_typeId: gModel.UpdatedPersistenceEventTypeId,
				_persistedData: spacelessName };
			node.CreatedPersistenceEvent = {
				_name: spacelessName + 'Created',
				_typeId: gModel.CreatedPersistenceEventTypeId,
				_persistedData: spacelessName };
			node.RemovedPersistenceEvent = {
				_name: spacelessName + 'Removed',
				_typeId: gModel.RemovedPersistenceEventTypeId,
				_persistedData: spacelessName };
			node.RejectedUpdatePersistenceEvent = {
				_name: 'Update' + spacelessName + 'Rejected',
				_typeId: gModel.RejectedUpdatePersistenceEventTypeId,
				_persistedData: spacelessName };
			node.RejectedCreatePersistenceEvent = {
				_name: 'Create' + spacelessName + 'Rejected',
				_typeId: gModel.RejectedCreatePersistenceEventTypeId,
				_persistedData: spacelessName };
			node.RejectedRemovePersistenceEvent = {
				_name: 'Remove' + spacelessName + 'Rejected',
				_typeId: gModel.RejectedRemovePersistenceEventTypeId,
				_persistedData: spacelessName };
			return node;
		};

		var setJsonFields = function(node, gModel) {
			var gFields = gModel.fields;
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
					//_readOnly: gField.get('readOnly').toString(),
				};
				if (gField.get('optional')) {
					node.Data.Field[i]._optional = 'true';
				}
				switch (gField.get('type').toString()) {
					case 'integer':
						node.Data.Field[i]._type = 'int';
					case 'double':
					case 'float':
					case 'byte':
					case 'short':
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
						if (gField.get('strLen').toString().length && !isNaN(gField.get('strLen').toString())) {
							node.Data.Field[i]._length = gField.get('strLen').toString();
						} else {
							node.Data.Field[i]._length = '1'; //sending an invalid string value would cause an error
						}
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
						if (gField.get('enumValue') === 'no default value') {
							node.Data.Field[i]._default = '';
						} else {
							node.Data.Field[i]._default = gField.get('enumValue') || '';
						}
						break;
					}
				if (gField.get('array') && !isNaN(gField.get('arrayLen').toString()) &&
					parseInt(gField.get('arrayLen').toString(), 10) > 0) {
					node.Data.Field[i]._sequenceLength = gField.get('arrayLen').toString();
				}

				if (node.Data.Field[i]._default === '') {
					delete node.Data.Field[i]._default;
				}
			}
			return node;
		};

		var onPersistentDataLoad = function(doc) {
			var gModel = doc.getModel().getRoot().get(GDriveConstants.CustomObjectKey.PERSISTENT_DATA);
			var dataType = 'persisted';
			var node = createDataNode(gModel, dataType);
			node = setJsonFields(node, gModel);
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

			if (dataJsonNode.Data.length === dataCount && typeof callback === 'function') {
				callback(dataJsonNode);
			}
		};

		var onEventLoad = function(doc) {
			var dataType = 'event';
			var gModel = doc.getModel().getRoot().get(GDriveConstants.CustomObjectKey.EVENT);
			var node = createDataNode(gModel, dataType);
			node = setJsonFields(node, gModel);

			dataJsonNode.Data.push(node.Data);

			if (dataJsonNode.Data.length === dataCount && typeof callback === 'function') {
				callback(dataJsonNode);
			}
		};

		var onSnippetLoad = function(doc) {
			var dataType = 'snippet';
			var gModel = doc.getModel().getRoot().get(GDriveConstants.CustomObjectKey.SNIPPET);
			var node = createDataNode(gModel, dataType);
			node = setJsonFields(node, gModel);

			dataJsonNode.Data.push(node.Data);

			if (dataJsonNode.Data.length === dataCount && typeof callback === 'function') {
				callback(dataJsonNode);
			}
		};

		if (dataCount === 0 && typeof callback === 'function') {
			callback(dataJsonNode);
		}

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
