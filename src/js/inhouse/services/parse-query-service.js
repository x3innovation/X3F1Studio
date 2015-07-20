function ParseQueryService() {
	// //////// private members
	parseData = function(queries, dataObjectsJson) {
		var query;
		var qTokens;
		var token;
		var paramPos;
		for (var i = 0, len = queries.length; i<len; i++) {
			query = queries[i];
			qTokens = query._query.split(' ');
			for (j = 0, len2 = qTokens.length; j<len2; j++) {
				if (qTokens[j].indexOf('.') > 0) {
					paramPos = j + 1;
					while (!qTokens[paramPos].match(/^\[.*\]$/)) { //search until a token matches the pattern [...]
						paramPos++;
					}
					setQueryParam(qTokens[j].split('.'), qTokens[paramPos], dataObjectsJson, query);
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
		paramName = paramName.replace('[', '').replace(']', '');
		for (i = 0, len = dataObjectsJson.length; i<len; i++) {
			if (dataObjectsJson[i]._name === dataObjName) {
				fields = dataObjectsJson[i].Field;
				for (var j = 0, len2 = fields.length; j<len2; j++) {
					if (fields[j]._name === fieldName) { fieldData = fields[j]; }
				}
			}
		}
		var annotationValue = '';
		switch (fieldData._type) {
			case 'double': annotationValue = 'Double Value'; break;
			case 'float': annotationValue = 'Float Value'; break;
			case 'byte': annotationValue = 'Byte Value'; break;
			case 'short': annotationValue = 'Short Value'; break;
			case 'int': annotationValue = 'Integer Value'; break;
			case 'long': annotationValue = 'Long Value'; break;
			case 'string': annotationValue = 'String Value'; break;
			case 'boolean': annotationValue = 'Boolean Value'; break;
			case 'datetime': annotationValue = 'Datetime Value'; break;
			case 'nanotime': annotationValue = 'Nanotime Value'; break;
			default: break;
		}

		for (i = 0, len = query.Parameter.length; i<len; i++) {
			var qParam = query.Parameter[i];
			if (qParam._name === paramName) { //if the parameter was already set, replace the fields with the max
				for (var paramAttribute in qParam) {
					if (!isNaN(qParam[paramAttribute])) {
						qParam[paramAttribute] = '' + Math.max(qParam[paramAttribute], fieldData[paramAttribute]);
					}
				}
				return;
			}
		}
		query.Parameter.push(fieldData);
		var lastParam = query.Parameter[query.Parameter.length - 1];
		lastParam._name = paramName;
		lastParam._optional = 'false';
		lastParam.Annotation = [{
			_name: 'description',
			_svalue: annotationValue
		}];
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