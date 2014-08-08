"use strict";

/**
 * Namespace for Custom Demo.
 */
rtpg.custom = rtpg.custom || {};

rtpg.allDemos.push(rtpg.custom);

/**
 * Realtime model's field name for Custom Demo.
 */
rtpg.custom.FIELD_NAME = 'model';

/**
 * Realtime model's field for Custom Demo.
 */
rtpg.custom.field = null;

/**
 * Class definition of the custom object.
 */
rtpg.custom.DataModel = function() {
};

rtpg.custom.DataModel.prototype.initialize = function(name, description, id, persistent, attributes) {
	this.name = name;
	this.description = description;
	this.id = id;
	this.persistent = persistent;
	this.attributes = attributes;
	console.log('attributes: ' + attributes);
};

/**
 * DOM selector for the Container element for Custom Demo.
 */
rtpg.custom.OUTPUT_SELECTOR = '#demoCustomContainer';

/**
 * DOM selector for the input element for Custom Demo.
 */
rtpg.custom.INPUT_DATANAME_SELECTOR = '#dataName';
rtpg.custom.INPUT_DATADESC_SELECTOR = '#dataDesc';
rtpg.custom.INPUT_DATAID_SELECTOR = '#dataId';
rtpg.custom.INPUT_DATAPERSISTENT_SELECTOR = '#dataPersistent';

rtpg.custom.loadField = function() {
	rtpg.custom.field = rtpg.getField(rtpg.custom.FIELD_NAME);
	console.log('loadField');
}

rtpg.custom.initializeModel = function(model) {
	console.log('initializeModel called.');
	var field = model.create(rtpg.custom.DataModel);
	field.attributes = model.createMap();

	console.log('initializeModel attributes: ' + field.attributes);

	model.getRoot().set(rtpg.custom.FIELD_NAME, field);
}

rtpg.custom.registerTypes = function() {
	console.log('rtpg.custom.registerTypes called.');
	var DataModel = rtpg.custom.DataModel;
	var custom = gapi.drive.realtime.custom;
	custom.registerType(DataModel, 'DataModel');
	DataModel.prototype.name = custom.collaborativeField('name');
	DataModel.prototype.description = custom.collaborativeField('description');
	DataModel.prototype.id = custom.collaborativeField('id');
	DataModel.prototype.persistent = custom.collaborativeField('persistent');
	DataModel.prototype.attributes = custom.collaborativeField('attributes');
	custom.setInitializer(DataModel, DataModel.prototype.initialize);
}

rtpg.custom.updateUi = function() {
	$(rtpg.custom.INPUT_DATANAME_SELECTOR).val(rtpg.custom.field.name);
	$(rtpg.custom.INPUT_DATADESC_SELECTOR).val(rtpg.custom.field.description);
	$(rtpg.custom.INPUT_DATAID_SELECTOR).val(rtpg.custom.field.id);
	$(rtpg.custom.INPUT_DATAPERSISTENT_SELECTOR).prop('checked', rtpg.custom.field.persistent);

	$('#attributeList').empty();

	var keys = rtpg.custom.field.attributes.keys();
	keys.sort();
	var l = keys.length;

	for (var i = 0; i < l; i++) {
		var key = keys[i];

		console.log("rtpg.custom.field.attributes.get(key): " + rtpg.custom.field.attributes.get(key));

		var val = rtpg.custom.field.attributes.get(key).split('|');

		// 'dataAttrName' : val[0],
		// 'dataAttrType' : val[1],
		// 'dataAttrDesc' : val[2],
		// 'dataAttrDefaultValue' : val[3],
		// 'dataAttrReadOnly' : val[4],
		// 'dataAttrOptional' : val[5],
		// 'dataAttrSequenceLength' : val[6],
		// 'dataAttrLength' : val[7],
		// 'dataAttrMin' : val[8],
		// 'dataAttrMax' : val[9],
		// 'dataAttrRef' : val[10],
		// 'dataAttrRefType' : val[11]

		var newOption = $('<option>').val(key).text(val[0]);
		$('#attributeList').append(newOption);
	}
	console.log('updateUi');
};

rtpg.custom.onDataNameInput = function(evt) {
	var newValue = $(rtpg.custom.INPUT_DATANAME_SELECTOR).val();
	rtpg.custom.field.name = newValue;
};

rtpg.custom.onRealtimeChange = function(evt) {
	rtpg.custom.updateUi();
	rtpg.log.logEvent(evt, 'Custom Object Property Changed');
};

rtpg.custom.onDataIdInput = function(evt) {
	var newValue = $(rtpg.custom.INPUT_DATAID_SELECTOR).val();
	rtpg.custom.field.id = newValue;
};

rtpg.custom.onDataDescInput = function(evt) {
	var newValue = $(rtpg.custom.INPUT_DATADESC_SELECTOR).val();
	rtpg.custom.field.description = newValue;
};

rtpg.custom.onDataPersistentInput = function(evt) {
	var newValue = $(rtpg.custom.INPUT_DATAPERSISTENT_SELECTOR).is(":checked");
	rtpg.custom.field.persistent = newValue;
};

rtpg.custom.onRemoveAttrItem = function(evt) {
	var key = $(this).parent().parent().parent().attr('id').substr(17);

	if (key != null) {
		rtpg.custom.field.attributes.delete (key);
	}

	console.log('RemoveAttrItem: ' + key + ' ' + val);
};

rtpg.custom.onPutAttrItem = function(evt) {
	console.log('onPutAttrItem');

	var key = $("#dataAttrKey").val();
	var name = $("#dataAttrName").val();
	var type = $("#dataAttrType").val();
	var desc = $("#dataAttrDesc").val();
	var defaultValue = $("#dataAttrDefaultValue").val();
	var readOnly = $("#dataAttrReadOnly").is(":checked");
	var optional = $("#dataAttrOptional").is(":checked");
	var sequenceLength = $("#dataAttrSequenceLength").val();
	var length = $("#dataAttrLength").val();
	var min = $("#dataAttrMin").val();
	var max = $("#dataAttrMax").val();
	var ref = $("#dataAttrRef").val();
	var refType;
	if ($("#dataAttrRefTypeSoft").is(":checked")) {
		refType = 'soft';
	} else if ($("#dataAttrRefTypeHard").is(":checked")) {
		refType = 'hard';
	}

	$("#attributeList").find(":selected").text(name);

	var val = name + '|' + type + '|' + desc + '|' + defaultValue + '|' + readOnly + '|' + optional + '|' + sequenceLength + '|' + length + '|' + min + '|' + max + '|' + ref + '|' + refType;
	rtpg.custom.field.attributes.set(key, val);
	console.log('PutAttrItemb: ' + key + ' ' + val);
};

rtpg.custom.connectUi = function() {
	$(rtpg.custom.INPUT_DATANAME_SELECTOR).keyup(rtpg.custom.onDataNameInput);
	$(rtpg.custom.INPUT_DATADESC_SELECTOR).keyup(rtpg.custom.onDataDescInput);
	$(rtpg.custom.INPUT_DATAID_SELECTOR).keyup(rtpg.custom.onDataIdInput);
	$(rtpg.custom.INPUT_DATAPERSISTENT_SELECTOR).change(rtpg.custom.onDataPersistentInput);

	$("#dataAttrName").keyup(rtpg.custom.onPutAttrItem);
	$("#dataAttrDesc").keyup(rtpg.custom.onPutAttrItem);
	$("#dataAttrType").change(rtpg.custom.onPutAttrItem);
	$("#dataAttrDefaultValue").keyup(rtpg.custom.onPutAttrItem);
	$("#dataAttrReadOnly").change(rtpg.custom.onPutAttrItem);
	$("#dataAttrOptional").change(rtpg.custom.onPutAttrItem);
	$("#dataAttrSequenceLength").keyup(rtpg.custom.onPutAttrItem);
	$("#dataAttrLength").keyup(rtpg.custom.onPutAttrItem);
	$("#dataAttrMin").keyup(rtpg.custom.onPutAttrItem);
	$("#dataAttrMax").keyup(rtpg.custom.onPutAttrItem);
	$("#dataAttrRef").change(rtpg.custom.onPutAttrItem);
	$("input[name=dataAttrRefType]").change(rtpg.custom.onPutAttrItem);

	//$("#dataAttrRefTypeSoft").change(rtpg.custom.onPutAttrItem);
	//$("#dataAttr_remove_current").click(rtpg.custom.onRemoveAttrItem);

	console.log('connectUi');
};

rtpg.custom.connectRealtime = function() {
	rtpg.custom.field.addEventListener(gapi.drive.realtime.EventType.VALUE_CHANGED, rtpg.custom.onRealtimeChange);
	rtpg.custom.field.attributes.addEventListener(gapi.drive.realtime.EventType.VALUE_CHANGED, rtpg.custom.onRealtimeChange);
};
