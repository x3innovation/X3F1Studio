var fireFunc = function(eventName, parameter, bubbles, cancelable) {
	var evt = new CustomEvent(eventName, {
		bubbles : typeof bubbles !== 'undefined' ? bubbles : false,
		cancelable : typeof cancelable !== 'undefined' ? cancelable : false,
		detail : parameter
	});
	document.dispatchEvent(evt);
};

if ( typeof HTMLDocument !== 'undefined') {
	HTMLDocument.prototype.fire = fireFunc;
	console.log("HTMLDocument.prototype.fire is loaded");
} else {
	Document.prototype.fire = fireFunc;
	console.log("Document.prototype.fire is loaded");
}