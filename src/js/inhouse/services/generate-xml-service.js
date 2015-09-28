var GDriveConstants = require('../constants/google-drive-constants.js');
var googleDriveUtils = require('../utils/google-drive-utils.js');

var ParseQueryService = require('./parse-query-service.js');

function GenerateXMLService() {

	// private functions
	var classifyProjectObjects = function(projectObjects) {
		var classifiedObjects = {
			enums : [],
			datas : [],
			flows : [],
		};
		for (var i = 0, len = projectObjects.length; i<len; i++) {
			switch (projectObjects[i].description) {
				case GDriveConstants.ObjectType.PERSISTENT_DATA:
				case GDriveConstants.ObjectType.SNIPPET:
				case GDriveConstants.ObjectType.EVENT:
					classifiedObjects.datas.push(projectObjects[i]);
					break;
				case GDriveConstants.ObjectType.ENUM:
					classifiedObjects.enums.push(projectObjects[i]);
					break;
				case GDriveConstants.ObjectType.FLOW:
					classifiedObjects.flows.push(projectObjects[i]);
					break;
				default:
					break;
			}
		}
		return classifiedObjects;
	};

	var replaceAll = function(string, findStr, replacement) {
		string = string.split(findStr).join(replacement);
		return string;
	};

	var generateJSONDataAndConvertToXML = function(classifiedObjects, projectFile, callback) {
		var title = projectFile.title;
		var description = projectFile.description;
		var spacelessName = replaceAll(title, ' ', '');
		var jsonRootObj = {
			'amx:amxSchema': {
				_name : spacelessName,
				_version : "1",
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
				Application: {
					_name: spacelessName,
						Annotation: [{
							_name: "description",
							_svalue: description
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

		var applicationJson = jsonRootObj['amx:amxSchema'].Application;
		var queries = [];

		loadAllEnums(classifiedObjects.enums, function (enumJsonNode) {
			applicationJson.Enum = enumJsonNode;
			loadAllDatas(classifiedObjects.datas, function (dataJsonNode) {
				applicationJson.Data = dataJsonNode.Data;
				applicationJson.UpdatePersistenceEvent = dataJsonNode.UpdatePersistenceEvent;
				applicationJson.CreatePersistenceEvent = dataJsonNode.CreatePersistenceEvent;
				applicationJson.RemovePersistenceEvent = dataJsonNode.RemovePersistenceEvent;
				applicationJson.UpdatedPersistenceEvent = dataJsonNode.UpdatedPersistenceEvent;
				applicationJson.CreatedPersistenceEvent = dataJsonNode.CreatedPersistenceEvent;
				applicationJson.RemovedPersistenceEvent = dataJsonNode.RemovedPersistenceEvent;
				applicationJson.RejectedUpdatePersistenceEvent = dataJsonNode.RejectedUpdatePersistenceEvent;
				applicationJson.RejectedCreatePersistenceEvent = dataJsonNode.RejectedCreatePersistenceEvent;
				applicationJson.RejectedRemovePersistenceEvent = dataJsonNode.RejectedRemovePersistenceEvent;
				ParseQueryService.parseQueries(applicationJson.Data, function() {
					callback(convertToXml(jsonRootObj));
				});
			});
		});
	};

	var convertToXml = function(jsonRootObj) {
		var XML_HEADER_TAG = "<?xml version='1.0' encoding='UTF-8' ?>";
		var x2js = new X2JS();
		var xmlData = XML_HEADER_TAG + x2js.json2xml_str(jsonRootObj);
		return xmlData;
	};

	var loadAllEnums = function(enums, callback) {
		var enumJsonNode = [];
		var enumCount = enums.length;

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
						node.Choice.push({
							_name: gField.name,
							_value: gField.index+'',
							Annotation: {
								_name: 'description',
								_svalue: gField.description
							}
						});
					} else {
						node.Choice.push({
							_name: gField.get('name').toString(),
							_value: gField.get('index').toString(),
							Annotation: {
								_name: 'description',
								_svalue: gField.get('description').toString(),
							}
						});
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
			googleDriveUtils.loadDriveFileDoc(enums[i].id, onEnumLoad);
		}
	};

	loadAllDatas = function(datas, callback) {
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
		var dataCount = datas.length;

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
					_name: 'description',
					_svalue: description 
					}, { 
					_name: 'type',
					_svalue: dataType 
				}]
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

		var setJsonQueries = function(node, gModel) {
			var gQueries = gModel.queries;
			if (gQueries.length) { node.Data.Query = []; }		

			var refType;
			if (node.Data._identifiable === 'true') {
				refType = 'pointer';
			} else {
				refType = 'embedded';
			}

			for (var i = 0, len = gQueries.length; i<len; i++) {
				var gQuery = gQueries.get(i);
				var title = replaceAll(gModel.title.toString(), ' ', '');
				var queryName = replaceAll(gQuery.name, ' ', '');
				queryBody = gQuery.description;
				node.Data.Query.push({
					_name: queryName,
					_query: queryBody,
					Parameter: [],
					QueryRequestEvent: {
						_name: queryName+'Request',
						_typeId: gQuery.requestId,
						Value: []
					}
				});
				node.Data.Query[i].QueryResponseEvent = {
					_name: queryName+'Response',
					_typeId: gQuery.responseId
				};
				node.Data.Query[i].QueryResponseEvent.Value = [{
					_name: 'ResponseData',
					_type: 'ref',
					_refType: refType,
					_ref: title,
					_optional: 'false'
				}];
			}
			return node;
		};

		var setJsonFields = function(node, gModel) {
			var gFields = gModel.fields;
			var gField;
			if (gFields.length) { node.Data.Field = []; }
			for (var i = 0, len = gFields.length; i<len; i++) {
				gField = gFields.get(i);
				node.Data.Field[i] = {
					_name: gField.get('name').toString(),
					_type: gField.get('type').toString(),
					Annotation: {
						_name: 'description',
						_svalue: gField.get('description').toString()
					},
					_default: gField.get('defValue').toString()
					//_readOnly: gField.get('readOnly').toString()
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
						var defValue = gField.get('defValue').toString();
						if (isNaN(defValue)) {
							node.Data.Field[i]._default = ''; //don't send a non-number value
						}
						var minValue = gField.get('minValue').toString();
						if (minValue && !isNaN(minValue)) {
							node.Data.Field[i]._min = minValue;
						}
						var maxValue = gField.get('maxValue').toString();
						if (maxValue && !isNaN(maxValue)) {
							node.Data.Field[i]._max = maxValue;
						}
						break;
					case 'datetime':
						node.Data.Field[i]._type = 'dateTime';
					case 'date':
					case 'time':
						var defDate = gField.get('defDate').toString();
						if (defDate) {
							node.Data.Field[i]._default = defDate;
						} else {
							delete node.Data.Field[i]._default;
						}
						var minDate = gField.get('minDate').toString();
						if (minDate) {
							node.Data.Field[i]._min = minDate;
						}
						var maxDate = gField.get('maxDate').toString();
						if (maxDate) {
							node.Data.Field[i]._max = maxDate;
						}
						break;
					case 'boolean':
						node.Data.Field[i]._default = gField.get('defValueBool').toString();
						break;
					case 'string':
						var maxStrLen = gField.has('maxStrLen') ? 
							gField.get('maxStrLen').toString() : gField.get('strLen').toString();
						var minStrLen = gField.has('minStrLen') ? 
							gField.get('minStrLen').toString() : '';

						if (maxStrLen && !isNaN(maxStrLen)) {
							node.Data.Field[i]._length = maxStrLen;
						} else {
							node.Data.Field[i]._length = '1'; //sending an invalid length value causes error
						}
						break;
					case 'ref':
						node.Data.Field[i]._ref = gField.get('refName');
						node.Data.Field[i]._refType = '';
						if (gField.get('refType') === 'soft') {
							node.Data.Field[i]._refType = 'pointer';
						} else if (gField.get('refType') === 'hard'){
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
			node = setJsonQueries(node, gModel);

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
			node = setJsonQueries(node, gModel);

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
			if (datas[i].description === GDriveConstants.ObjectType.PERSISTENT_DATA){
				googleDriveUtils.loadDriveFileDoc(datas[i].id, onPersistentDataLoad);
			} else if (datas[i].description === GDriveConstants.ObjectType.SNIPPET){
				googleDriveUtils.loadDriveFileDoc(datas[i].id, onSnippetLoad);
			} else if (datas[i].description === GDriveConstants.ObjectType.EVENT){
				googleDriveUtils.loadDriveFileDoc(datas[i].id, onEventLoad);
			}
		}
	};

	// public function
	this.generateProjectXML = function(projectObjects, projectFile, callback) {
		var classifiedObjects = classifyProjectObjects(projectObjects);
		generateJSONDataAndConvertToXML(classifiedObjects, projectFile, callback);
	};
}

module.exports = new GenerateXMLService();