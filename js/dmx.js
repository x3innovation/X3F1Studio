"use strict";

var dmx = dmx || {};

dmx.fileId = null;
dmx.file = null;
dmx.rtDoc = null;
dmx.doc = null;
dmx.oTable = null;
dmx.f1Doc = null;

dmx.hideProgressBarGroup = function() {
    $("#progressBarGroup").hide();
};

dmx.onAuthResult = function(authResult) {
    console.log("begin onAuthResult()");
    if (authResult && !authResult.error) {
        console.log("authorized.");

		$('#contentGroup').hide();
		dog.loadParamsToBall(function() {
			 document.getElementById("the-breadcrumb").f1Url = cat.getRedirectStr("./f1.htm");
                         document.getElementById("the-breadcrumb").f1Label = ball.projectFile.title;

            ball.registerDMX();

            dmx.fileId = cat.anchorParams.dmxFileId;
            if (dmx.fileId) {
                dmx.loadFile();
            }
            ball.getF1Model(ball.projectFile.id, function(f1Doc) {
                dmx.f1Doc = f1Doc;
            });
        });
    } else {
        $('#authorizeButton').click(function() {
            dog.authorize(true, dmx.onAuthResult);
        });

        console.log("not authorized.");
        $('#contentGroup').hide();
    }
};

dmx.renameData = function() {
    console.log("begin dmx.renameData()");

    var newName = $('#dataNameEdit').val();

    if (ball.isFileNamePatternValid(newName) == false) {
        console.log("Nothing changed");
        $("#renameAlertMsg").fadeIn().delay(2000).fadeOut();
        return;
    }

    if (newName == dmx.file.title) {
        console.log("Nothing changed");
        return;
    }

    dmx.doc.name = newName;
    dog.renameFile(dmx.file.id, newName, function(dataFile) {

        ball.announce(dmx.f1Doc, {
            action: 'renameFile',
            fileType: 'dmx',
            fileId: dmx.file.id,
            fileNewName: newName
        });
        dmx.loadFile();
        $("#lean_overlay").fadeOut(200);
        $("#changeNameModal").css({
            'display': 'none'
        });
    });
};

dmx.loadFile = function() {
    console.log('begin dmx.loadFile()');
    console.log("dmx.fileId:");
    console.log(dmx.fileId);
    gapi.drive.realtime.load(dmx.fileId, dmx.onFileLoaded, dmx.initializeModel, dog.handleErrors);
    console.log('end dmx.loadFile()');
};

dmx.onFileLoaded = function(rtDoc) {
    console.log("begin dmx.onFileLoaded()");
    dmx.rtDoc = rtDoc;
    dmx.doc = dmx.rtDoc.getModel().getRoot().get(ball.DMX_MODEL);

    console.log("dmx.doc.version: " + dmx.doc.version);
    if (dmx.doc.version == null) {
        dmx.doc.version = '1';
    }

	dmx.connectUi();
	dog.getFile(dmx.fileId, function(file) {
		dmx.file = file;
		$('#docName').html("<span>" + dmx.doc.name + "</span>");
		
		document.getElementById("the-breadcrumb").docUrl = cat.getRedirectStr("./dmx.htm", "&dmxFileId=" + dmx.fileId);
                document.getElementById("the-breadcrumb").docLabel = dmx.doc.name;
                document.getElementById("the-breadcrumb").docType = ball.DMX_TYPE;

        $("#docName span").leanModal({
            modal: "#changeNameModal",
            closeButton: "#closeChangeNameModal",
            onBeforeDisplay: function() {
                $("#dataNameEdit").val(file.title);
            }
        });
    });
    $('#contentGroup').show();

    dmx.updateUi();

    dmx.doc.addEventListener(gapi.drive.realtime.EventType.VALUE_CHANGED, dmx.updateUi);
    dmx.doc.attributes.addEventListener(gapi.drive.realtime.EventType.VALUE_CHANGED, dmx.updateUi);
};

dmx.initializeModel = function(model) {
    console.log("begin dmx.initializeModel()");
    var field = model.create(ball.dmxModel);
    field.attributes = model.createMap();

    field.type = cat.anchorParams.dataType;

    dog.getFile(dmx.fileId, function(file) {
        field.name = file.title;
    });

    if (field.type == 'persisted') {
        ball.getNextId(ball.projectFile.id, function(nextId) {
            console.log("nextId: " + nextId);
            field.id = nextId;
        }, 7);
    } else {
        ball.getNextId(ball.projectFile.id, function(nextId) {
            console.log("nextId: " + nextId);
            field.id = nextId;
        });
    }

    model.getRoot().set(ball.DMX_MODEL, field);
};

dmx.onDataAttrNameInput = function() {
    console.log("begin dmx.onDataAttrNameInput");
    var start = this.selectionStart;
    var end = this.selectionEnd;
    dmx.saveToGoogle();
    this.setSelectionRange(start, end);
};

dmx.onDataDescInput = function() {
    console.log("begin dmx.onDataDescInput");
    var newValue = $('#dataDesc').val();
    dmx.doc.description = newValue;
};

dmx.onDataTypeInput = function(evt) {
    console.log("begin dmx.ondataTypeInput");
    var newValue = dmx.dataTypeSelectize[0].selectize.getValue();
    dmx.doc.type = newValue;
};

dmx.updateUi = function() {
    console.log('begin dmx.updateUi()');

    $('#dataId').val(dmx.doc.id);
    $('#dataDesc').val(dmx.doc.description);
    dmx.dataTypeSelectize[0].selectize.setValueQuiet(dmx.doc.type);

    $('#attributeList').empty();

    var keys = dmx.doc.attributes.keys();
    keys.sort();
    var l = keys.length;

    dmx.oTable.fnClearTable(dmx.oTable);

    for (var i = 0; i < l; i++) {
        var key = keys[i];

        console.log("doc.attributes.get(key): " + dmx.doc.attributes.get(key));

        var val = dmx.doc.attributes.get(key).split('|');

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

        dmx.oTable.fnAddData([key, "<i class='fa fa-exclamation-triangle' style='display: none;'></i> " + val[0]]);

        if (dmx.lastSelectedAttrKey != null && key == dmx.lastSelectedAttrKey) {
            dmx.lastSelectedAttrIdx = i;
            dmx.lastSelectedAttrKey = null;
        }
    }

    if (dmx.lastSelectedAttrIdx >= 0) {
        console.log("dmx.lastSelectedAttrIdx: " + dmx.lastSelectedAttrIdx);
        $('#attrTable tbody tr')[dmx.lastSelectedAttrIdx].click();
    }

    //dmx.oTable.oScroller.fnRowToPixels(dmx.lastRowToPixels);
    dmx.highlightDuplicatedAttrNames();
};

dmx.clearDefaultValue = function() {
    $("#dataAttrDefaultValueBooleanTrue").removeAttr('checked');
    $("#dataAttrDefaultValueBooleanFalse").removeAttr('checked');
    $('#dataAttrDefaultValue').val("");
};

dmx.onDataAttrTypeChanged = function() {
    dmx.clearDefaultValue();
    dmx.visibilityControl();
    dmx.saveToGoogle();
};

dmx.onEnumNameChanged = function() {
    dmx.visibilityControl();
    dmx.saveToGoogle();
};

dmx.saveToGoogle = function(evt) {
    console.log('begin dmx.saveToGoogle()');

    var key = $("#dataAttrKey").val();
    var name = $("#dataAttrName").val();
    var type = dmx.dataAttrTypeSelectize[0].selectize.getValue();
    var desc = $("#dataAttrDesc").val();
    var defaultValue = $("#dataAttrDefaultValue").val();
    if (type == 'boolean') {
        if ($("#dataAttrDefaultValueBooleanTrue").is(":checked")) {
            defaultValue = 'true';
        } else if ($("#dataAttrDefaultValueBooleanFalse").is(":checked")) {
            defaultValue = 'false';
        }
    }

    var readOnly = $("#dataAttrReadOnly").is(":checked");
    var optional = $("#dataAttrOptional").is(":checked");
    var sequenceLength = $("#dataAttrSequenceLength").val();
    var length = $("#dataAttrLength").val();
    var min = $("#dataAttrMin").val();
    var max = $("#dataAttrMax").val();
    var ref = dmx.dataAttrRefSelectize[0].selectize.getValue();
    // + "=" + dmx.dataAttrRefSelectize[0].selectize.getOption(dmx.dataAttrRefSelectize[0].selectize.getValue()).text();
    var refType;
    if ($("#dataAttrRefTypeSoft").is(":checked")) {
        refType = 'soft';
    } else if ($("#dataAttrRefTypeHard").is(":checked")) {
        refType = 'hard';
    }
    var enumName = dmx.enumNameSelectize[0].selectize.getValue() + "=" + dmx.enumNameSelectize[0].selectize.getOption(dmx.enumNameSelectize[0].selectize.getValue()).text();
    console.log('enumName');
    console.log(enumName);
    var enumValue = dmx.enumValueSelectize[0].selectize.getValue();

    $("#attributeList").find(":selected").text(name);

    var val = name + '|' + type + '|' + desc + '|' + defaultValue + '|' + readOnly + '|' + optional + '|' + sequenceLength + '|' + length + '|' + min + '|' + max + '|' + ref + '|' + refType + '|' + enumName + '|' + enumValue;
    dmx.doc.attributes.set(key, val);
    console.log('dmx.saveToGoogle(): ' + key + ' ' + val);
};

dmx.generateXML = function() {
    console.log('generateXML');

    var x2js = new X2JS();
    var dataName = dmx.doc.name;
    var dataId = dmx.doc.id;
    var dataDesc = dmx.doc.description;
    var dataType = dmx.doc.type;
    var jsonObj1 = {
        Data: {
            _name: dataName,
            _typeId: dataId,
            Annotation: [{
                    "_name": "description",
                    "_svalue": dataDesc
                }, {
                    "_name": "type",
                    "_svalue": dataType
                }],
            Field: []
        }
    };

    var keys = dmx.doc.attributes.keys();
    keys.sort();
    var l = keys.length;

    for (var i = 0; i < l; i++) {
        var key = keys[i];
        var val = dmx.doc.attributes.get(key).split('|');

        jsonObj1.Data.Field[i] = {
            _name: val[0],
            _type: val[1],
            "Annotation": {
                "_name": "doc",
                "_svalue": val[2]
            },
            _default: val[3],
            _readOnly: val[4],
            _optional: val[5]
        };

        console.log("val[1]:" + val[1]);
        switch (val[1]) {//type
            case 'string':
                jsonObj1.Data.Field[i]._length = val[7];
                break;
            case 'ref':
                jsonObj1.Data.Field[i]._ref = val[10].split("=")[1];
                jsonObj1.Data.Field[i]._refType = val[11];
                break;
            case 'int':
            case 'double':
            case 'short':
            case 'long':
                if (isNaN(val[8])) {
                } else {
                    jsonObj1.Data.Field[i]._min = val[8];
                }
                if (isNaN(val[9])) {
                } else {
                    jsonObj1.Data.Field[i]._max = val[9];
                }
                break;
            case 'enum':
                jsonObj1.Data.Field[i]._enum = val[12].split("=")[1];
                jsonObj1.Data.Field[i]._default = val[13];
                break;
        }

        if (parseInt(val[6]) > 0) {
            jsonObj1.Data.Field[i]._sequenceLength = val[6];
        }
        // 'dataAttrName' : val[0],
        // 'dataAttrType' : val[1],
        // 'dataAttrDesc' : val[2],
        // 'dataAttrDefaultValue' : val[3],
        // 'dataAttrReadOnly' : val[4],
        // 'dataAttrOptional' : val[5],
        // 'dataAttrLength' : val[7],
        // 'dataAttrSequenceLength' : val[6],
        // 'dataAttrMin' : val[8],
        // 'dataAttrMax' : val[9],
        // 'dataAttrRef' : val[10],
        // 'dataAttrRefType' : val[11]
        // 'enumName' : val[12]
        // 'enumValue' : val[13]
    }

    var xmlAsStr = x2js.json2xml_str(jsonObj1);
    $('#xmlOutputGroup').show();
    $('#xmlOutput').text(vkbeautify.xml(xmlAsStr));
};

dmx.lastSelectedAttrKey = null;

dmx.highlightDuplicatedAttrNames = function() {
    console.log("in dmx.highlightDuplicatedAttrNames");
    var duplicates = dmx.getDuplicateAttrNames();

    console.log("duplicates:");
    console.log(duplicates);

    $(dmx.oTable.fnGetNodes()).removeClass('datatable_red_bg');

    var sData = dmx.oTable.fnGetData();
    var l = sData.length;
    var key = 0;
    for (var j = 0; j < duplicates.length; j++) {
        for (var i = 0; i < l; i++) {
            if (sData[i][1] == duplicates[j]) {
                //highlight row i
                $(dmx.oTable.fnGetNodes(i)).addClass('datatable_red_bg');
            }
        }
    }

};

dmx.getDuplicateAttrNames = function() {
    var duplicates = [];
    var sData = dmx.oTable.fnGetData();
    var l = sData.length;
    var key = 0;
    for (var i = 0; i < l - 1; i++) {
        for (var j = i + 1; j < l; j++) {
            if (sData[i][1] == sData[j][1]) {
                //add sData[i][1] to array
                duplicates.push(sData[i][1]);
                break;
            }
        }
    }
    return duplicates;
};

dmx.addAttribute = function() {
    var sData = dmx.oTable.fnGetData();
    var largestNbrInName = 0;
    var l = sData.length;
    var key = 0;
    for (var i = 0; i < l; i++) {
        var digits;
        if (sData[i][1].startWith("<i class='fa fa-exclamation-triangle' style='display: none;'></i> newAttribute_")) {
            digits = sData[i][1].substr(79);
            // console.log(digits);
            if (isNaN(digits)) {
            } else {
                var nbrInName = parseInt(digits);
                if (largestNbrInName < nbrInName) {
                    largestNbrInName = nbrInName;
                }
            }
        }
        if (isNaN(sData[i][0])) {
        } else {
            var currentKey = parseInt(sData[i][0]);
            if (key < currentKey) {
                key = currentKey;
            }
        }
    }
    key = key + 1;
    var name = "newAttribute_" + (largestNbrInName + 1);

    dmx.lastSelectedAttrKey = key.toString();

    var type = "string";
    var desc = "";
    var defaultValue = "";
    var readOnly = false;
    var optional = false;
    var sequenceLength = 0;
    var length = 0;
    var min = 0;
    var max = 0;
    var ref = "";
    var refType = "=";
    var enumName = "=";
    var enumValue = "";

    var val = name + '|' + type + '|' + desc + '|' + defaultValue + '|' + readOnly + '|' + optional + '|' + sequenceLength + '|' + length + '|' + min + '|' + max + '|' + ref + '|' + refType + '|' + enumName + '|' + enumValue;
    dmx.doc.attributes.set(key.toString(), val);

    console.log('addAttribute: ' + val);
};

dmx.delAttribute = function() {
    console.log('delAttribute');
    var selectedRow = dmx.oTable.$('tr.row_selected');
    var sData = dmx.oTable.fnGetData(selectedRow[0]);
    var selectedIdx = dmx.oTable.fnGetPosition(selectedRow[0]);

    var key = sData[0];

    if (key === undefined) {
        return;
    }

    // Select next row
    if (selectedIdx == dmx.oTable.fnGetData().length - 1) {
        selectedIdx -= 1;
    }
    if (selectedIdx == -1) {
        selectedIdx = 0;
    }
    dmx.lastSelectedAttrIdx = selectedIdx;
    //dmx.lastRowToPixels =

    dmx.doc.attributes.
            delete(key.toString());
};

dmx.clearAttributeEditGroup = function() {
    console.log('clearAttributeEditGroup');
    $('#dataAttrKey').val("");
    $('#dataAttrName').val("");
    $('#dataAttrType').val([]);
    $('#dataAttrDesc').val("");
    $('#dataAttrDefaultValue').val("");
    $("#dataAttrDefaultValueBooleanTrue").removeAttr('checked');
    $("#dataAttrDefaultValueBooleanFalse").removeAttr('checked');
    $("#dataAttrReadOnly").removeAttr('checked');
    $("#dataAttrOptional").removeAttr('checked');
    $("#dataAttrArray").removeAttr('checked');
    $("#dataAttrSequenceLength").val("");
    $('#dataAttrLength').val("");
    $('#dataAttrMin').val("");
    $('#dataAttrMax').val("");
    $('#dataAttrRef').val("");
    $('#dataAttrRefType').val("");
};

dmx.lastSelectedAttrIdx = -1;

dmx.attributeSelected = function() {
    console.log('attributeSelected');
    var selectedRow = dmx.oTable.$('tr.row_selected');
    var sData = dmx.oTable.fnGetData(selectedRow[0]);
    var key = sData[0];
    dmx.lastSelectedAttrIdx = dmx.oTable.fnGetPosition(selectedRow[0]);

    console.log('selected value: ' + dmx.doc.attributes.get(key));

    var val = dmx.doc.attributes.get(key).split('|');
    var type = val[1];

    $('#dataAttrKey').val(key);
    $('#dataAttrName').val(val[0]);
    dmx.dataAttrTypeSelectize[0].selectize.clearQuiet();
    dmx.dataAttrTypeSelectize[0].selectize.addItemQuiet(type);

    $('#dataAttrDesc').val(val[2]);
    $('#dataAttrDefaultValue').val(val[3]);
    if (type == 'boolean') {
        if (val[3] == 'true') {
            $("#dataAttrDefaultValueBooleanTrue").prop('checked', true);
            $("#dataAttrDefaultValueBooleanFalse").removeAttr('checked');
        } else if (val[3] == 'false') {
            $("#dataAttrDefaultValueBooleanFalse").prop('checked', true);
            $("#dataAttrDefaultValueBooleanTrue").removeAttr('checked');
        } else {
            $("#dataAttrDefaultValueBooleanTrue").removeAttr('checked');
            $("#dataAttrDefaultValueBooleanFalse").removeAttr('checked');
        }
    }

    if (val[4] == 'true') {
        $("#dataAttrReadOnly").prop('checked', true);
    } else {
        $("#dataAttrReadOnly").removeAttr('checked');
    }
    if (val[5] == 'true') {
        $("#dataAttrOptional").prop('checked', true);
    } else {
        $("#dataAttrOptional").removeAttr('checked');
    }
    $('#dataAttrSequenceLength').val(val[6]);
    if (parseInt($('#dataAttrSequenceLength').val()) > 0) {
        console.log("dataAttrArray should be checked.");
        $('#dataAttrArray').prop('checked', true);
        $('#dataAttrArrayGroup').show();
    } else {
        $("#dataAttrArray").removeAttr('checked');
        $('#dataAttrArrayGroup').hide();
    }

    $('#dataAttrLength').val(val[7]);
    $('#dataAttrMin').val(val[8]);
    $('#dataAttrMax').val(val[9]);

    if (type == 'ref') {
        var refId;
        if (val[10].indexOf("=") > 0) {
            refId = val[10].split("=")[0];
        } else {
            refId = val[10];
        }

        if (typeof refId === 'undefined') {
            console.log('refId is undefined');
            refId = "";
        }

        dog.getFile(refId, function(resp) {
            var refText = resp.title;

            if (typeof refText === 'undefined') {
                console.log('refText is undefined');
                refText = "";
            }

            dmx.dataAttrRefSelectize[0].selectize.clearQuiet();
            dmx.dataAttrRefSelectize[0].selectize.addOptionQuiet({
                text: refText,
                value: refId
            });
            dmx.dataAttrRefSelectize[0].selectize.setValueQuiet(refId);
        });

        if (val[11] == 'soft') {
            $("#dataAttrRefTypeSoft").prop('checked', true);
            $("#dataAttrRefTypeHard").removeAttr('checked');
        } else if (val[11] == 'hard') {
            $("#dataAttrRefTypeHard").prop('checked', true);
            $("#dataAttrRefTypeSoft").removeAttr('checked');
        }
    }

    if (type == 'enum') {
        var enumId = val[12].split("=")[0];
        var enumText = val[12].split("=")[1];
        console.log("enumId:" + enumId);
        console.log("enumText:" + enumText);
        if (typeof enumId === 'undefined') {
            enumId = "";
        }
        if (typeof enumText === 'undefined') {
            enumText = "";
        }
        dmx.enumNameSelectize[0].selectize.clearQuiet();
        dmx.enumNameSelectize[0].selectize.addOptionQuiet({
            text: enumText,
            value: enumId
        });
        dmx.enumNameSelectize[0].selectize.setValueQuiet(enumId);

        dmx.enumValueSelectize[0].selectize.clearQuiet();
        dmx.enumValueSelectize[0].selectize.addOptionQuiet({
            text: val[13],
            value: val[13]
        });
        dmx.enumValueSelectize[0].selectize.addItemQuiet(val[13]);
    }

    dmx.visibilityControl();

    dmx.checkAttributeError();
};

dmx.checkAttributeError = function() {
    console.log("in dmx.checkAttributeError");
    var duplicates = dmx.getDuplicateAttrNames();

    $('#dataAttrName').parent().removeClass("has-error");
    $('#dataAttrName').parent().find(".error-icon").hide();
    $('#dataAttrName').parent().find(".duplicated-error").hide();
    $('#dataAttrName').parent().find(".name-pattern-error").hide();

    for (var j = 0; j < duplicates.length; j++) {
        var duplicateStr = $("<div>" + duplicates[j] + "</div>").text().trim();
        if ($('#dataAttrName').val() == duplicateStr) {
            $('#dataAttrName').parent().addClass("has-error").find(".error-icon").show();
            $('#dataAttrName').parent().find(".duplicated-error").show();
            error = true;
            break;
        }
    }

    if (ball.isVariableNamePatternValid($('#dataAttrName').val()) == false) {
        $('#dataAttrName').parent().addClass("has-error").find(".error-icon").show();
        $('#dataAttrName').parent().find(".name-pattern-error").show();
    }
};

dmx.visibilityControlArrayLength = function() {
    if ($("#dataAttrArray").is(":checked")) {
        $("#dataAttrArrayGroup").show();
    } else {
        $("#dataAttrArrayGroup").hide();
    }
};

dmx.visibilityControl = function() {
    console.log("in dmx.visibilityControl");
    dmx.visibilityControlArrayLength();

    var val = dmx.dataAttrTypeSelectize[0].selectize.getValue();
    if (val == 'string') {
        $("#defaultValueGroup").show();
        $("#defaultBooleanValueGroup").hide();
        $(".enumGroup").hide();
        $("#lengthGroup").show();
        $("#minMaxGroup").hide();
        $("#refGroup").hide();
        $("#refTypeGroup").hide();
    } else if (val == 'int') {
        $("#defaultValueGroup").show();
        $("#defaultBooleanValueGroup").hide();
        $(".enumGroup").hide();
        $("#lengthGroup").hide();
        $("#minMaxGroup").show();
        $("#refGroup").hide();
        $("#refTypeGroup").hide();
    } else if (val == 'double') {
        $("#defaultValueGroup").show();
        $("#defaultBooleanValueGroup").hide();
        $(".enumGroup").hide();
        $("#lengthGroup").hide();
        $("#minMaxGroup").show();
        $("#refGroup").hide();
        $("#refTypeGroup").hide();
    } else if (val == 'boolean') {
        $("#defaultValueGroup").hide();
        $("#defaultBooleanValueGroup").show();
        $(".enumGroup").hide();
        $("#lengthGroup").hide();
        $("#minMaxGroup").hide();
        $("#refGroup").hide();
        $("#refTypeGroup").hide();
    } else if (val == 'char') {
        $("#defaultValueGroup").show();
        $("#defaultBooleanValueGroup").hide();
        $(".enumGroup").hide();
        $("#lengthGroup").hide();
        $("#minMaxGroup").hide();
        $("#refGroup").hide();
        $("#refTypeGroup").hide();
    } else if (val == 'byte') {
        $("#defaultValueGroup").show();
        $("#defaultBooleanValueGroup").hide();
        $(".enumGroup").hide();
        $("#lengthGroup").hide();
        $("#minMaxGroup").hide();
        $("#refGroup").hide();
        $("#refTypeGroup").hide();
    } else if (val == 'short') {
        $("#defaultValueGroup").show();
        $("#defaultBooleanValueGroup").hide();
        $(".enumGroup").hide();
        $("#lengthGroup").hide();
        $("#minMaxGroup").hide();
        $("#refGroup").hide();
        $("#refTypeGroup").hide();
    } else if (val == 'long') {
        $("#defaultValueGroup").show();
        $("#defaultBooleanValueGroup").hide();
        $(".enumGroup").hide();
        $("#lengthGroup").hide();
        $("#minMaxGroup").hide();
        $("#refGroup").hide();
        $("#refTypeGroup").hide();
    } else if (val == 'date') {
        $("#defaultValueGroup").show();
        $("#defaultBooleanValueGroup").hide();
        $(".enumGroup").hide();
        $("#lengthGroup").hide();
        $("#minMaxGroup").hide();
        $("#refGroup").hide();
        $("#refTypeGroup").hide();
    } else if (val == 'dateTime') {
        $("#defaultValueGroup").show();
        $("#defaultBooleanValueGroup").hide();
        $(".enumGroup").hide();
        $("#lengthGroup").hide();
        $("#minMaxGroup").hide();
        $("#refGroup").hide();
        $("#refTypeGroup").hide();
    } else if (val == 'nanotime') {
        $("#defaultValueGroup").show();
        $("#defaultBooleanValueGroup").hide();
        $(".enumGroup").hide();
        $("#lengthGroup").hide();
        $("#minMaxGroup").hide();
        $("#refGroup").hide();
        $("#refTypeGroup").hide();
    } else if (val == 'enum') {
        $("#defaultValueGroup").hide();
        $("#defaultBooleanValueGroup").hide();
        $(".enumGroup").show();
        $("#lengthGroup").hide();
        $("#minMaxGroup").hide();
        $("#refGroup").hide();
        $("#refTypeGroup").hide();
    } else if (val == 'ref') {
        $("#defaultValueGroup").show();
        $("#defaultBooleanValueGroup").hide();
        $(".enumGroup").hide();
        $("#lengthGroup").hide();
        $("#minMaxGroup").hide();
        $("#refGroup").show();
        $("#refTypeGroup").show();
    }
};

dmx.connectUi = function() {
    $("#dataDesc").keyup(dmx.onDataDescInput);
    $("#dataType").change(dmx.ondataTypeInput);

    $("#dataAttrName").keyup(dmx.onDataAttrNameInput);
    $("#dataAttrDesc").keyup(dmx.saveToGoogle);
    $("#dataAttrDefaultValue").keyup(dmx.saveToGoogle);
    $("#dataAttrDefaultValueBooleanTrue").change(dmx.saveToGoogle);
    $("#dataAttrDefaultValueBooleanFalse").change(dmx.saveToGoogle);
    $("#dataAttrReadOnly").change(dmx.saveToGoogle);
    $("#dataAttrOptional").change(dmx.saveToGoogle);
    $("#dataAttrSequenceLength").keyup(dmx.saveToGoogle);
    $("#dataAttrLength").keyup(dmx.saveToGoogle);
    $("#dataAttrMin").keyup(dmx.saveToGoogle);
    $("#dataAttrMax").keyup(dmx.saveToGoogle);
    $("#dataAttrRefTypeSoft").change(dmx.saveToGoogle);
    $("#dataAttrRefTypeHard").change(dmx.saveToGoogle);

    $("#dataAttrArray").change(dmx.visibilityControlArrayLength);

    $("#generateXML").click(dmx.generateXML);

    this.visibilityControl();
};

dmx.setupDataTable = function() {
    dmx.oTable = $('#attrTable').dataTable({
        "sScrollY": "250px",
        "bPaginate": false,
        "bLengthChange": false,
        "bFilter": true,
        "bSort": false,
        "bInfo": false,
        "bAutoWidth": false,
        "aoColumns": [{
                "bSearchable": false,
                "bVisible": false
            }, null],
    });

    $("#attrTable tbody").on('click', 'tr', function() {
        if ($(this).children(".dataTables_empty").is(':visible')) {
            $("#attributeEditGroup").hide();
            return;
        }
        if ($(this).hasClass('row_selected')) {
            $(this).removeClass('row_selected');
            $("#dataTableDeleteRow").addClass('disabled');

            $("#attributeEditGroup").hide();
        } else {
            dmx.oTable.$('tr.row_selected').removeClass('row_selected');
            $(this).addClass('row_selected');
            $("#dataTableDeleteRow").removeClass('disabled');

            $("#attributeEditGroup").show();
            dmx.attributeSelected();
        }
    });

    $('#dataTableAddRow').click(function() {
        dmx.addAttribute();
    });

    $('#dataTableDeleteRow').click(function() {
        dmx.delAttribute();
    });
};

dmx.loadEnumNames = function() {
    console.log("in dmx.loadEnumNames");
    var originalValue = dmx.enumNameSelectize[0].selectize.getValue();

    var recvCount = 0;
    var items = [];
    var addToDropdownCallback = function() {
        for (var i = 0; i < items.length; i++) {
            console.log(items[i]);
            dmx.enumNameSelectize[0].selectize.addOptionQuiet({
                text: items[i].split("=")[1],
                value: items[i].split("=")[0]
            });
        }
        dmx.enumNameSelectize[0].selectize.addItemQuiet(originalValue);
        dmx.enumNameSelectize[0].selectize.openDropdown();
    };

    var getFilesCallback = function(resp, totalCount) {
        recvCount++;

        items.push(resp.id + "=" + resp.title);

        console.log("show some progress bar: " + (recvCount / totalCount) * 100 + "%");

        if (recvCount == totalCount) {
            console.log("recvCount == totalCount");
            addToDropdownCallback();
        }
    };

    dog.getFiles(ball.projectFolder.id, ball.DMXE_MIMETYPE, getFilesCallback);
};

dmx.clearEnumDefaultValue = function(value) {
    console.log("dmx.clearEnumDefaultValue");
    //dmx.enumValueSelectize[0].selectize.clearOptions();
};

dmx.loadEnumValues = function() {
    console.log("in dmx.loadEnumValues");
    var originalValue = dmx.enumValueSelectize[0].selectize.getValue();

    var getValuesCallback = function(doc) {
        console.log("getValuesCallback:");
        console.log(doc);
        //dmx.enumValueSelectize[0].selectize.clearOptionsQuiet();

        var elements = doc.attributes.asArray();
        var l = elements.length;

        for (var i = 0; i < l; i++) {
            var array = elements[i].split("|");
            var id = array[0];
            var name = array[1];
            var desc = array[2];
            dmx.enumValueSelectize[0].selectize.addOptionQuiet({
                text: name,
                value: name
            });
        }

        dmx.enumValueSelectize[0].selectize.addItemQuiet(originalValue);
        dmx.enumValueSelectize[0].selectize.openDropdown();
    };

    ball.getDMXEModel(dmx.enumNameSelectize[0].selectize.getValue(), getValuesCallback);
};

dmx.loadRefs = function() {
    console.log("in dmx.loadRefs");
    var originalValue = dmx.dataAttrRefSelectize[0].selectize.getValue();

    var recvCount = 0;
    var items = [];
    var addToDropdownCallback = function() {
        dmx.dataAttrRefSelectize[0].selectize.clearOptionsQuiet();
        for (var i = 0; i < items.length; i++) {
            var refName = items[i].split("=")[1];
            var refId = items[i].split("=")[0];

            console.log('refName: ' + refName);
            console.log('refId: ' + refId);
            console.log('originalValue: ' + originalValue);

            dmx.dataAttrRefSelectize[0].selectize.addOptionQuiet({
                text: refName,
                value: refId
            });

            if (originalValue == refId) {
                dmx.dataAttrRefSelectize[0].selectize.setValueQuiet(originalValue);
            }
        }
        dmx.dataAttrRefSelectize[0].selectize.openDropdown();
    };

    var getFilesCallback = function(resp, totalCount) {
        recvCount++;

        items.push(resp.id + "=" + resp.title);

        console.log("show some progress bar: " + (recvCount / totalCount) * 100 + "%");

        if (recvCount == totalCount) {
            console.log("recvCount == totalCount");
            addToDropdownCallback();
        }
    };

    dog.getFiles(ball.projectFolder.id, ball.DMX_MIMETYPE, getFilesCallback);
};

// The entry point of the module
dmx.start = function() {
    console.log("begin dmx.start()");

    dmx.setupDataTable();

    $("#saveChangeNameModal").click(dmx.renameData);

    dmx.dataAttrTypeSelectize = $("#dataAttrType").selectize({
        onItemAdd: dmx.onDataAttrTypeChanged
    });

    dmx.enumNameSelectize = $("#enumName").selectize({
        onItemAdd: dmx.onEnumNameChanged,
        onOpen: dmx.loadEnumNames,
        onChange: dmx.clearEnumDefaultValue
    });
    dmx.enumValueSelectize = $("#enumValue").selectize({
        onItemAdd: dmx.saveToGoogle,
        onOpen: dmx.loadEnumValues
    });
    dmx.dataAttrRefSelectize = $("#dataAttrRef").selectize({
        onItemAdd: dmx.saveToGoogle,
        onOpen: dmx.loadRefs
    });
    dmx.dataTypeSelectize = $("#dataType").selectize({
        //onItemAdd : dmx.ondataTypeInput
    });
    dmx.dataTypeSelectize[0].selectize.disable();
    $("#dataId").prop('disabled', true);

    dog.authorize(false, dmx.onAuthResult);

    dmx.hideProgressBarGroup();
};

$(window).ready(function() {
    google.setOnLoadCallback(dmx.start);
});
