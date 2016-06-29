var GDriveConstants = require('../constants/google-drive-constants.js');
var googleDriveUtils = require('../utils/google-drive-utils.js');
var Configs = require('../app-config.js');

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
                case GDriveConstants.ObjectType.APPLICATION_STATE:
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

	var generateJSONDataAndConvertToXML = function(classifiedObjects, projectFile, gMetadataCustomObject, callback) {
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
			loadAllDatas(classifiedObjects.datas, gMetadataCustomObject, function (dataJsonNode) {
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

				callback(convertToXml(jsonRootObj));
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

			// closing the doc too soon throws an exception from Google
			setTimeout(function(){
				doc.close();
			}, Configs.GoogleDocCloseInterval);
		};

		if (enumCount === 0 && typeof callback === 'function') {
			callback(enumJsonNode);
		}
		for (var i = 0; i<enumCount; i++) {
			googleDriveUtils.loadDriveFileDoc(enums[i].id, GDriveConstants.ObjectType.ENUM, onEnumLoad);
		}
	};

	loadAllDatas = function(datas, gMetadataCustomObject, callback) {
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

		var fieldsDetails = {};
        var fieldsDetailsProjectObjectToLoadCounter = 0;
        var fieldsDetailsProjectObjectLoadedCounter = 0;
		var onFieldsDetailsLoadCallbacks = [];

		var createDataNode = function(gModel, dataType) {
			var node = {};
			var name = replaceAll(gModel.title.toString(), ' ', '');
			var spacelessName = replaceAll(name, ' ', '');
			var description = gModel.description.toString();
			var typeId = gModel.id;
            var isBusinessRequest = gModel.isBusinessRequest;

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

			// if this is business request
			if (isBusinessRequest){
				node.Data._businessRequest = true;
			}

			// if this is business response
			for (var i=0; i<gMetadataCustomObject.businessResponseEvents.length; i++){
				var metadataEventModel = gMetadataCustomObject.businessResponseEvents.get(i);
				if (metadataEventModel.eventObjectTitle === gModel.title.toString() &&
					metadataEventModel.responseForCounter > 0){
					node.Data._businessResponse = true;
					break;
				}
			}

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
			if (gModel.isUpdateBusinessRequest){
				node.UpdatePersistenceEvent._businessRequest = true;
			}

			node.CreatePersistenceEvent = {
				_name: 'Create' + spacelessName,
				_typeId: gModel.CreatePersistenceEventTypeId,
				_persistedData: spacelessName };
			if (gModel.isCreateBusinessRequest){
				node.CreatePersistenceEvent._businessRequest = true;
			}

			node.RemovePersistenceEvent = {
				_name: 'Remove' + spacelessName,
				_typeId: gModel.RemovePersistenceEventTypeId,
				_persistedData: spacelessName };
			if (gModel.isRemoveBusinessRequest){
				node.RemovePersistenceEvent._businessRequest = true;
			}

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

		var setJsonQueries = function(node, gModel, objectType, onJsonQueriesSet) {
			var gQueries = gModel.queries;
			if (gQueries.length) { node.Data.Query = []; }		

			var refType;
			if (node.Data._identifiable === 'true') {
				refType = 'pointer';
			} else {
				refType = 'embedded';
			}

			// load all fieldsDetails for eligibleFields' project objects
			// first find out all eligible fields for each token and which project object they are located in
			var gQuery;
			var queryBodies = [];
			for (var i = 0, len = gQueries.length; i<len; i++) {
				gQuery = gQueries.get(i);
				queryBodies.push(gQuery.description);
			}

			// find out all eligible fields for all tokens in all query bodies
			var queriesTokenEligibleFields = {};
			eligibleFieldsForTokenizedQueryBodies(queryBodies);

			onFieldsDetailsLoadCallbacks.push(onAllFieldsDetailsLoaded);
            if (Object.keys(queriesTokenEligibleFields).length > 0){
                loadFieldsDetails();
            }
            else{
                onAllFieldsDetailsLoaded();
            }

			// inner functions
			function onAllFieldsDetailsLoaded(){
				for (var i = 0, len = gQueries.length; i<len; i++) {
					var gQuery = gQueries.get(i);
					var title = replaceAll(gModel.title.toString(), ' ', '');
					var queryName = replaceAll(gQuery.name, ' ', '');
					queryBody = gQuery.description;
					var query = {
						_name: queryName,
						_query: queryBody,
						Parameter: null,
						QueryRequestEvent: {
							_name: queryName+'Request',
							_typeId: gQuery.requestId,
						}
					};
					var parameter = getParameters(queryBody);
					if (parameter.length > 0){
						query.Parameter = parameter;
					}
					else{
						delete query.Parameter;
					}

					if (gQuery.isBusinessRequest != null){
						query._businessRequest = gQuery.isBusinessRequest
					}

					node.Data.Query.push(query);
					node.Data.Query[i].QueryResponseEvent = {
						_name: queryName+'Response',
						_typeId: gQuery.responseId
					};
				}
				onJsonQueriesSet(node);
			}

			function eligibleFieldsForTokenizedQueryBodies(queryBodies){
				for (var i in queryBodies){
					var parameterTokens = getParameterTokens(queryBodies[i]);
					var tokenEligibleFields = {};
					for (var parameterToken in parameterTokens){
						var eligibleFields = getEligibleFieldsForToken(queryBodies[i], parameterToken);
						tokenEligibleFields[parameterToken] = eligibleFields;
					}
					if (Object.keys(tokenEligibleFields).length > 0){
						queriesTokenEligibleFields[queryBodies[i]] = tokenEligibleFields;
					}
				}

				// inner functions
				function getParameterTokens(queryBody){
					var parameterOpeningBracketFound = false;
					var parameterName = "";
					var parameters = {};
					for (var i=0; i<queryBody.length; i++){
						if (queryBody[i] === '['){
							parameterOpeningBracketFound = true;
							parameterName = "";
						}
						else if (queryBody[i] === ']'){
							// invalid case
							if (!parameterOpeningBracketFound){
								console.log('Query format is invalid: ' + queryBody);
								break;
							}

							// valid case
							else if (parameterOpeningBracketFound){
								parameterOpeningBracketFound = false;
								parameters[parameterName] = {};
							}
						}
						// if we are between parameter brackets [ and ]
						else if (parameterOpeningBracketFound){
							parameterName += queryBody[i];
						}
					}
					
					return parameters;
				}

				function getEligibleFieldsForToken(queryBody, parameterToken){
					var tokenString = '[' + parameterToken + ']';
					var eligibleFields = {};
					traverseBackUntilTitleFound(queryBody, tokenString);
					return eligibleFields;

					function traverseBackUntilTitleFound(searchFromString, tokenString){
						var firstOccurrenceIndex = searchFromString.indexOf(tokenString);
						var isPeriodSpotted = false;
						for (var i=firstOccurrenceIndex-1; i>=0; i--){
							if (!isPeriodSpotted && searchFromString[i] === '.'){
								isPeriodSpotted = true;
							}
							else if (isPeriodSpotted && searchFromString[i] === ' '){
								// interested projectObject.fieldName has reached
								var substringFromSpace = searchFromString.substring(i+1);
								var endOfFieldSpaceIndex = substringFromSpace.indexOf(' ');
								var projectObjectAndFieldName = substringFromSpace.substring(0, endOfFieldSpaceIndex);	// projectObject.fieldName
								var projectObjectAndFieldNameTokenized = projectObjectAndFieldName.split('.');
								var projectObjectTitle = projectObjectAndFieldNameTokenized[0];
								var fieldName = projectObjectAndFieldNameTokenized[1];
								if (eligibleFields[projectObjectTitle]){
									if (eligibleFields[projectObjectTitle].indexOf(fieldName) < 0){
										eligibleFields[projectObjectTitle].push(fieldName);
									}
								}
								else{
									eligibleFields[projectObjectTitle] = [];
									eligibleFields[projectObjectTitle].push(fieldName);
								}
								var nextSearchFromString = searchFromString.substring(firstOccurrenceIndex + tokenString.length);
								traverseBackUntilTitleFound(nextSearchFromString, tokenString);
								break;
							}							
						}
					}
				}
			}

			function loadFieldsDetails(){
				for (var queryBody in queriesTokenEligibleFields){
					var tokenEligibleFields = queriesTokenEligibleFields[queryBody];
					for (var token in tokenEligibleFields){
						for (var projectObjectTitle in tokenEligibleFields[token]){
							if (!fieldsDetails[projectObjectTitle]){
								fieldsDetails[projectObjectTitle] = {};
                                fieldsDetailsProjectObjectToLoadCounter++;
								loadProjectObjectForFieldsDetails(projectObjectTitle);
							}
						}
					}
				}

				// inner functions
				function loadProjectObjectForFieldsDetails(projectObjectTitle){
					var fileIds = gMetadataCustomObject.projectObjectTitles.keys();
					var isProjectObjectFound = false;
					for (var i=0; i<fileIds.length; i++){
						var fileId = fileIds[i];
						if (gMetadataCustomObject.projectObjectTitles.get(fileId) === projectObjectTitle){
							isProjectObjectFound = true;
							break;
						}
					}

					var executionContext = {
						projectObjectTitle: projectObjectTitle
					};

					if (isProjectObjectFound){
						googleDriveUtils.loadDriveFileDoc(fileId, objectType, onObjectFileLoaded.bind(executionContext));
					}
					else{
						throw "ERROR: no file id was found for the project object title " + projectObjectTitle + ". Make sure the SQL query entered follows the current query parsing logic.";
					}

					function onObjectFileLoaded(doc){
                        fieldsDetailsProjectObjectLoadedCounter++;
						var projectObjectTitle = this.projectObjectTitle;
						var gCustomObject = doc.getModel().getRoot().get(GDriveConstants.CustomObjectKey.PERSISTENT_DATA);
						var loadedObjectFields = gCustomObject.fields;

						for (var i=0; i<loadedObjectFields.length; i++){
							var loadedObjectField = loadedObjectFields.get(i);
							var fieldName = loadedObjectField.get('name').text;
							fieldsDetails[projectObjectTitle][fieldName] = {};
							fieldsDetails[projectObjectTitle][fieldName].type = loadedObjectField.get('type');
                            fieldsDetails[projectObjectTitle][fieldName].minStrLen = loadedObjectField.get('minStrLen');
                            fieldsDetails[projectObjectTitle][fieldName].maxStrLen = loadedObjectField.get('maxStrLen');
                            fieldsDetails[projectObjectTitle][fieldName].minValue = loadedObjectField.get('minValue').text || '';
                            fieldsDetails[projectObjectTitle][fieldName].maxValue = loadedObjectField.get('maxValue').text || '';
                            if (loadedObjectField.get('minDateTimeDate')) {
                                fieldsDetails[projectObjectTitle][fieldName].minDateTimeDate = loadedObjectField.get('minDateTimeDate').text || '';
                            }
                            if (loadedObjectField.get('maxDateTimeDate')) {
                                fieldsDetails[projectObjectTitle][fieldName].maxDateTimeDate = loadedObjectField.get('maxDateTimeDate').text || '';
                            }
                            if (loadedObjectField.get('minDateTimeTime')) {
                                fieldsDetails[projectObjectTitle][fieldName].minDateTimeTime = loadedObjectField.get('minDateTimeTime').text || '';
                            }
                            if (loadedObjectField.get('maxDateTimeTime')) {
                                fieldsDetails[projectObjectTitle][fieldName].maxDateTimeTime = loadedObjectField.get('maxDateTimeTime').text || '';
                            }
							fieldsDetails[projectObjectTitle][fieldName].minDate = loadedObjectField.get('minDate').text || '';
							fieldsDetails[projectObjectTitle][fieldName].maxDate = loadedObjectField.get('maxDate').text || '';
						}

                        // check if all fieldsDetails are loaded and execute all callbacks waiting
						if (fieldsDetailsProjectObjectToLoadCounter === fieldsDetailsProjectObjectLoadedCounter){
							for (var i in onFieldsDetailsLoadCallbacks){
								onFieldsDetailsLoadCallbacks[i]();
							}
						}

						// closing the doc too soon throws an exception from Google
						setTimeout(function(){
							doc.close();
						}, Configs.GoogleDocCloseInterval);
					}
				}
			}

			function getParameters(queryBody){
				var parameters = [];
				var tokenEligibleFields = queriesTokenEligibleFields[queryBody];
				for (var token in tokenEligibleFields){
					var attributes = getParameterAttributes(tokenEligibleFields[token], token)
					parameters.push(attributes);
				}
				return parameters;
				
				// innder functions
				function getParameterAttributes(eligibleFields, parameterToken){
					var attributes = {};
					var fieldType = null;
					var length = null;
					var min = null;
					var max = null;
					
					// update fieldType and length variables
					for (var projectObjectTitle in eligibleFields){
						for (var i in eligibleFields[projectObjectTitle]){
							var eligibleFieldName = eligibleFields[projectObjectTitle][i];
							updateDetailsFromFieldsDetails(projectObjectTitle, eligibleFieldName);
						}
					}

					attributes._name = parameterToken;

					if (fieldType === 'ref'){
						attributes._type = 'uuid';
					}
					else{
						attributes._type = fieldType;
					}

					if (length){
						attributes._length = length;
					}

                    if (min){
                        attributes._min = min;
                    }

                    if (max){
                        attributes._max = max;
                    }

					attributes._optional = 'false';
					attributes.Annotation = {};
					attributes.Annotation._name = 'description';
					attributes.Annotation._svalue = fieldType + ' value';
					return attributes;

					// inner functions
					function updateDetailsFromFieldsDetails(projectObjectTitle, eligibleFieldName){
						if (fieldsDetails[projectObjectTitle][eligibleFieldName]){
							var fieldDetails = fieldsDetails[projectObjectTitle][eligibleFieldName];
							if (fieldType === null){
								fieldType = fieldDetails.type.toLowerCase();

                                // initialize
								if (fieldType === 'string'){
                                    length = fieldDetails.maxStrLen;
                                }
                                else if (fieldType === 'double' ||
                                    fieldType === 'float' ||
                                    fieldType === 'short' ||
                                    fieldType === 'integer' ||
                                    fieldType === 'long'){
                                    min = fieldDetails.minValue;
                                    max = fieldDetails.maxValue;
                                }
                                else if (fieldType === 'date' ||
                                    fieldType === 'time'){
                                    min = fieldDetails.minDate;
                                    max = fieldDetails.maxDate;
                                }
                                else if (fieldType === 'datetime'){
                                    if (fieldDetails.minDateTimeDate && fieldDetails.minDateTimeDate.length > 0){
                                        min = toUtcIsoString(fieldDetails.minDateTimeDate, fieldDetails.minDateTimeTime);
                                    }
                                    if (fieldDetails.maxDateTimeDate && fieldDetails.maxDateTimeDate.length > 0){
                                        max = toUtcIsoString(fieldDetails.maxDateTimeDate, fieldDetails.maxDateTimeTime);
                                    }
                                }
							}
							else if (fieldType !== null && fieldType != fieldDetails.type){
								console.log('ERROR: Field type is not consistent in the query');
							}
						}
						else if (eligibleFieldName.toLowerCase() === 'uuid'){
							fieldType = 'uuid';
						}
						else{
							console.log('ERROR: field name used in a query does not exist in the entire project'); 
							console.log('project object title: ' + projectObjectTitle);
							console.log('field name: ' + eligibleFieldName);
						}
					}
				}				
			}
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
					_unique: gField.get('unique').toString(),
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

						// default
						defDate = gField.get('defDateTimeDate');
						var defTime = gField.get('defDateTimeTime');
						if (defDate && defTime) {
							defDate = gField.get('defDateTimeDate').toString();
							defTime = gField.get('defDateTimeTime').toString();
							if (defDate && defTime && defDate != '' && defTime != '') {
								node.Data.Field[i]._default = toUtcIsoString(defDate.toString(),
                                    defTime.toString());	// by default use UTC, iso 8601
							} else {
								delete node.Data.Field[i]._default;
							}
						}

						// min date time
                        var minDate = gField.get('minDateTimeDate');
                        var minTime = gField.get('minDateTimeTime');
                        if (minDate && minTime){
                            minDate = minDate.text;
                            minTime = minTime.text;
                            if (minDate && minTime && minDate != '' && minTime != '') {
                                node.Data.Field[i]._min = toUtcIsoString(minDate, minTime);	// by default use UTC, iso 8601
                            } else {
                                delete node.Data.Field[i]._min;
                            }
                        }

						// max date time
                        var maxDate = gField.get('maxDateTimeDate');
                        var maxTime = gField.get('maxDateTimeTime');
						if (maxDate && maxTime) {
                            maxDate = maxDate.text;
                            maxTime = maxTime.text;
                            if (maxDate && maxTime && maxDate != '' && maxTime != ''){
                                node.Data.Field[i]._max = toUtcIsoString(maxDate, maxTime);	// by default use UTC, iso 8601
                            }
                            else {
                                delete node.Data.Field[i]._max;
                            }
						}

						break;
					case 'date':
						// default
						defDate = gField.get('defDate');
						if (defDate) {
							var defDate = gField.get('defDate').toString();
							if (defDate) {
								var isoDate = toUtcIsoString(defDate, '00:00:00');
								node.Data.Field[i]._default = isoDate;
							} else {
								delete node.Data.Field[i]._default;
							}
						}

						// min date
						minDate = gField.get('minDate');
						if (minDate) {
							minDate = minDate.toString();
                            var isoDate = toUtcIsoString(minDate, '00:00:00');
							node.Data.Field[i]._min = isoDate;
						}
						else{
							delete node.Data.Field[i]._min;
						}

						// max date
						maxDate = gField.get('maxDate');
						if (maxDate) {
							maxDate = maxDate.toString();
                            var isoDate = toUtcIsoString(maxDate, '00:00:00');
							node.Data.Field[i]._max = isoDate;
						}
						else{
							delete node.Data.Field[i]._max;
						}

						break;
					case 'time':
						// default
						defTime = gField.get('defDate');
						if (defTime) {
							defTime = defTime.toString();
							node.Data.Field[i]._default = toUtcIsoString('2000-01-01', defTime);
						} else {
							delete node.Data.Field[i]._default;
						}

						// min time
						minTime = gField.get('minDate');
						if (minTime) {
							minTime = minTime.toString();
							node.Data.Field[i]._min = toUtcIsoString('2000-01-01', minTime);
						} else {
							delete node.Data.Field[i]._min;
						}

						// max time
						maxTime = gField.get('maxDate');
						if (maxTime) {
							maxTime = maxTime.toString();
							node.Data.Field[i]._max = toUtcIsoString('2000-01-01', maxTime);
						} else {
							delete node.Data.Field[i]._max;
						}

						break;
					case 'boolean':
						node.Data.Field[i]._default = gField.get('defValueBool').toString();
						break;
					case 'UUID':
						node.Data.Field[i]._generateFlyweightGetter = true;
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

            var gQueries = gModel.queries;
            if (gQueries.length > 0) {
                setJsonQueries(node, gModel, GDriveConstants.ObjectType.PERSISTENT_DATA, setPersistenceEvents);
            }
            else{
                setPersistenceEvents(node);
            }

			function setPersistenceEvents(node){
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

				// closing the doc too soon throws an exception from Google
				setTimeout(function(){
					doc.close();
				}, Configs.GoogleDocCloseInterval);
			}
		};

		var onEventLoad = function(doc) {
			var dataType = 'event';
			var gModel = doc.getModel().getRoot().get(GDriveConstants.CustomObjectKey.EVENT);

			var node = createDataNode(gModel, dataType);
			node = setJsonFields(node, gModel);
			onJsonQueriesSet(node);

			// inner function for event
			function onJsonQueriesSet(node){
				node = setJsonBusinessRequest(node, gModel);
				dataJsonNode.Data.push(node.Data);

				if (dataJsonNode.Data.length === dataCount && typeof callback === 'function') {
					callback(dataJsonNode);
				}

				// closing the doc too soon throws an exception from Google
				setTimeout(function(){
					doc.close();
				}, Configs.GoogleDocCloseInterval);
			}

			function setJsonBusinessRequest(node, gModel){
				if (gModel.isBusinessRequest){
					node.Data.BusinessResponses = {};
					node.Data.BusinessResponses.BusinessResponse = [];
				
					var gFileIds = gModel.correspondingBusinessResponses.asArray();
					var eventNames = googleDriveUtils.getEventNameForGoogleFileIds(gMetadataCustomObject, gFileIds);
					var typeIds = googleDriveUtils.getEventTypeIdForBusinessResponseGoogleFileIds(gMetadataCustomObject, gFileIds);

					for (var i in eventNames){
						node.Data.BusinessResponses.BusinessResponse.push(typeIds[i]);
					}
				}

				return node;
			};
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

			// closing the doc too soon throws an exception from Google
			setTimeout(function(){
				doc.close();
			}, Configs.GoogleDocCloseInterval);
		};


        var onApplicationStateLoad = function(doc) {
            var dataType = 'applicationState';
            var gModel = doc.getModel().getRoot().get(GDriveConstants.CustomObjectKey.APPLICATION_STATE);
            var node = createDataNode(gModel, dataType);
            node = setJsonFields(node, gModel);

            dataJsonNode.Data.push(node.Data);

            if (dataJsonNode.Data.length === dataCount && typeof callback === 'function') {
                callback(dataJsonNode);
            }

            // closing the doc too soon throws an exception from Google
            setTimeout(function(){
                doc.close();
            }, Configs.GoogleDocCloseInterval);
        };

		if (dataCount === 0 && typeof callback === 'function') {
			callback(dataJsonNode);
		}

		for (var i = 0; i<dataCount; i++) {
			if (datas[i].description === GDriveConstants.ObjectType.PERSISTENT_DATA){
				googleDriveUtils.loadDriveFileDoc(datas[i].id, GDriveConstants.ObjectType.PERSISTENT_DATA, onPersistentDataLoad);
			} else if (datas[i].description === GDriveConstants.ObjectType.SNIPPET){
				googleDriveUtils.loadDriveFileDoc(datas[i].id, GDriveConstants.ObjectType.SNIPPET, onSnippetLoad);
			} else if (datas[i].description === GDriveConstants.ObjectType.EVENT){
				googleDriveUtils.loadDriveFileDoc(datas[i].id, GDriveConstants.ObjectType.EVENT, onEventLoad);
			}else if (datas[i].description === GDriveConstants.ObjectType.APPLICATION_STATE){
                googleDriveUtils.loadDriveFileDoc(datas[i].id, GDriveConstants.ObjectType.APPLICATION_STATE, onApplicationStateLoad);
            }

		}
	};

    function toUtcIsoString(date, time){
        // example date: 2015-11-25
        // example time: 13:50:00
        var dateTimeStr = date + 'T' + time + 'Z';
        var dateTimeDate = new Date(dateTimeStr);
        return dateTimeDate.toISOString();
    }

	// public function
	this.generateProjectXML = function(projectObjects, projectFile, gMetadataCustomObject, callback) {
		var classifiedObjects = classifyProjectObjects(projectObjects);
		generateJSONDataAndConvertToXML(classifiedObjects, 
			projectFile,
			gMetadataCustomObject, 
			callback);
	};
}

module.exports = new GenerateXMLService();