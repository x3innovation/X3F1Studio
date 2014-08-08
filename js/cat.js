"use strict";

/**
 * Client-side Application Toolkit
 */

var cat = cat || {};

cat.DEBUG = false;

cat.getAnchorParams = function() {
	var params = {};
	var hashFragment = window.location.hash;
	if (hashFragment) {
		// split up the query string and store in an object
		var paramStrs = hashFragment.slice(1).split("&");
		for (var i = 0; i < paramStrs.length; i++) {
			var paramStr = paramStrs[i].split("=");
			params[paramStr[0]] = unescape(paramStr[1]);
		}
	}
	if (cat.DEBUG)
		console.log('getAnchorParams() ' + 'params:' + params);
	return params;
};

cat.paramsToString = function() {
	var arr = [];
	$.each(cat.anchorParams, function(name, value) {
		arr.push(name + "=" + value);
	});
	return arr.join("&");
};

cat.appendAnchorParams = function(paramName, paramValue) {
	cat.anchorParams[paramName] = paramValue;
	var paramStr = cat.paramsToString();

	if (window.history && window.history.replaceState) {
		window.history.replaceState(null, null, window.location.pathname + "#" + paramStr);
	} else {
		window.location.href = newUrl;
	}

	if (cat.DEBUG)
		console.log('appendAnchorParams() ' + 'hashFragment:' + hashFragment);
};

cat.anchorParams = cat.getAnchorParams();

cat.getRedirectStr = function(page, addition) {
	return page + '#projectFileId=' + ball.projectFile.id + '&projectFolderId=' + ball.projectFolder.id + '&userId=' + ball.user.id + addition;
};
