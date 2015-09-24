function ParseQueryService() {
	// //////// private members
	parseData = function(queries, dataObjectsJson) {
		var query;
		var qTokens;
		var token;
		var paramPos;
		var paramTokenFound;
		for (var i = 0, len = queries.length; i<len; i++) {
			query = queries[i];
			qTokens = query._query.split(' ');
			for (j = 0, len2 = qTokens.length; j<len2; j++) {
				if (qTokens[j].indexOf('.') > 0) {
					paramTokenFound = true;
					paramPos = j + 1;
					if (paramPos < qTokens.length)
					{
						while (qTokens[paramPos].indexOf('[') === -1 || qTokens[paramPos].indexOf(']') === -1 ||
								qTokens[paramPos].indexOf('[') >= qTokens[paramPos].indexOf(']')) {
							paramPos++;
						
							if (paramPos >= qTokens.length) {
								paramTokenFound = false;
								break;
							}
						}
						if (paramTokenFound) {
							setQueryParam(qTokens[j].split('.'), qTokens[paramPos], dataObjectsJson, query);
						}
					}
				}
			}
			var parameterValue;
			for (j = 0, len2 = query.Parameter.length; j<len2; j++) {
				parameterValue = $.extend({}, query.Parameter[j]); //clone object without keeping references
				delete parameterValue.Annotation; //queryRequestEvent doesn't have Annotation or optional attributes
				delete parameterValue._optional;
				query.QueryRequestEvent.Value.push(parameterValue);
			}
		}
	};

	setQueryParam = function(splitToken, paramName, dataObjectsJson, query) {
		var dataObjName = splitToken[0];
		var fieldName = splitToken[1];
		var fields;
		var fieldData;
		paramName = paramName.substring(paramName.indexOf('[') + 1, paramName.indexOf(']'));
		for (i = 0, len = dataObjectsJson.length; i<len; i++) {
			if (dataObjectsJson[i]._name === dataObjName) {
				fields = dataObjectsJson[i].Field;
				for (var j = 0, len2 = fields.length; j<len2; j++) {
					if (fields[j]._name === fieldName) { 
						fieldData = fields[j];
						break;
					}
				}
				break;
			}
		}

		var paramAlreadySet = false;
		for (i = 0, len = query.Parameter.length; i<len; i++) {
			var qParam = query.Parameter[i];
			if (qParam._name === paramName) { //if the parameter was already set, replace the fields with the max
				paramAlreadySet = true;
				for (var paramAttribute in qParam) {
					if (!isNaN(qParam[paramAttribute])) {
						qParam[paramAttribute] = '' + Math.max(qParam[paramAttribute], fieldData[paramAttribute]);
					}
				}
				break;
			}
		}

		if (!paramAlreadySet) {
			var annotationValue = '';
			var annotationValueLookup = {
				'double': 'Double Value',
				'float': 'Float Value',
				'byte': 'Byte Value',
				'short': 'Short Value',
				'int': 'Integer Value',
				'long': 'Long Value',
				'string': 'String Value',
				'boolean': 'Boolean Value',
				'datetime': 'Datetime Value',
				'nanotime': 'Nanotime Value'
			}
			annotationValue = annotationValueLookup[fieldData._type];

			var fieldDataCopy = $.extend({}, fieldData); //clone fieldData
			query.Parameter.push(fieldDataCopy);
			var lastParam = query.Parameter[query.Parameter.length - 1];
			lastParam._name = paramName;
			lastParam._optional = 'false';
			lastParam.Annotation = [{
				_name: 'description',
				_svalue: annotationValue
			}];
		}
	};

	// //////// public members
	this.parseQueries = function(dataObjectsJson, callback) {
		for (var i = 0, len = dataObjectsJson.length; i<len; i++) {
			if (dataObjectsJson[i].Query) {
				parseData(dataObjectsJson[i].Query, dataObjectsJson);
			}
		}
		callback();
	};
}

module.exports = new ParseQueryService();