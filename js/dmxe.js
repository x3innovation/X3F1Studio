"use strict";

var dmxe = dmxe || {};

dmxe.file = null;
dmxe.fileId = null;
dmxe.rtDoc = null;
dmxe.doc = null;
dmxe.oTable = null;

dmxe.hideProgressBarGroup = function() {
	$("#progressBarGroup").hide();
};

dmxe.onAuthResult = function(authResult) {
	console.log("begin onAuthResult()");
	if (authResult && !authResult.error) {
		console.log("authorized.");

		$('#contentGroup').hide();
		dog.loadParamsToBall(function() {
			$("#f1link").attr("href", cat.getRedirectStr("./f1.htm"));
			$("#f1link").html(ball.projectFile.title);

			ball.registerDMXE();

			dmxe.fileId = cat.anchorParams.dmxeFileId;
			if (dmxe.fileId) {
				dmxe.loadFile();
			}
		});
	} else {
		$('#authorizeButton').click(function() {
			dog.authorize(true, dmxe.onAuthResult);
		});

		console.log("not authorized.");
		$('#contentGroup').hide();
	}
};

dmxe.renameData = function() {
	console.log("begin dmxe.renameData()");

	var newName = $('#dataNameEdit').val();

	if (ball.isFileNamePatternValid(newName) == false) {
		console.log("Nothing changed");
		$("#renameAlertMsg").fadeIn().delay(2000).fadeOut();
		return;
	}

	if (newName == dmxe.file.title) {
		console.log("Nothing changed");
		return;
	}

	dmxe.doc.name = newName;
	dog.renameFile(dmxe.file.id, newName, function(dataFile) {
		dmxe.loadFile();
		$("#lean_overlay").fadeOut(200);
		$("#changeNameModal").css({
			'display' : 'none'
		});
	});
};

dmxe.loadFile = function() {
	console.log('begin dmxe.loadFile()');
	console.log("dmxe.fileId:");
	console.log(dmxe.fileId);
	gapi.drive.realtime.load(dmxe.fileId, dmxe.onFileLoaded, dmxe.initializeModel, dog.handleErrors);
	console.log('end dmxe.loadFile()');
};

dmxe.onFileLoaded = function(rtDoc) {
	console.log("begin dmxe.onFileLoaded()");
	dmxe.rtDoc = rtDoc;
	dmxe.doc = dmxe.rtDoc.getModel().getRoot().get(ball.DMXE_MODEL);

	dog.getFile(dmxe.fileId, function(file) {
		console.log(file);
		dmxe.file = file;
		console.log("dmxe.doc:");
		console.log(dmxe.doc);
		$('#docName').html("<span>" + dmxe.doc.name + "</span>");

		$("#dmxelink").attr("href", cat.getRedirectStr("./dmxe.htm", "&dmxFileId=" + dmxe.fileId));
		$("#dmxelink").html(dmxe.doc.name);

		$("#docName span").leanModal({
			modal : "#changeNameModal",
			closeButton : "#closeChangeNameModal",
			onBeforeDisplay : function() {
				$("#dataNameEdit").val(file.title);
			}
		});
	});

	$('#contentGroup').show();
	dmxe.updateUi();

	dmxe.doc.addEventListener(gapi.drive.realtime.EventType.VALUE_CHANGED, dmxe.updateUi);
	dmxe.doc.attributes.addEventListener(gapi.drive.realtime.EventType.VALUES_ADDED, dmxe.updateUi);
	dmxe.doc.attributes.addEventListener(gapi.drive.realtime.EventType.VALUES_REMOVED, dmxe.updateUi);
	dmxe.doc.attributes.addEventListener(gapi.drive.realtime.EventType.VALUES_SET, dmxe.updateUi);
};

dmxe.initializeModel = function(model) {
	console.log("begin dmxe.initializeModel()");

	var field = model.create(ball.dmxeModel);
	field.attributes = model.createList();

	console.log('dmxe.initializeModel attributes: ' + field.attributes);

	ball.getNextId(ball.projectFile.id, function(nextId) {
		console.log("nextId: " + nextId);
		field.id = nextId;
		console.log("field:");
		console.log(field);
	});

	dog.getFile(dmxe.fileId, function(file) {
		field.name = file.title;
	});

	model.getRoot().set(ball.DMXE_MODEL, field);
};

dmxe.updateUi = function() {
	console.log('begin dmxe.updateUi()');

	$("#enumId").val(dmxe.doc.id);
	$("#enumDesc").val(dmxe.doc.description);

	dmxe.oTable.fnClearTable(dmxe.oTable);

	var elements = dmxe.doc.attributes.asArray();
	var l = elements.length;

	for (var i = 0; i < l; i++) {
		var array = elements[i].split("|");
		dmxe.oTable.fnAddData([i, array[0], array[1], array[2], array[3]]);
	}

	console.log("dmxe.nextInputFocusXY: ");
	console.log(dmxe.nextInputFocusXY);
	if (dmxe.nextInputFocusXY != null) {
		var row = dmxe.oTable.fnGetNodes(dmxe.nextInputFocusXY[0]);
		var cell = $(row).children()[dmxe.nextInputFocusXY[1]];
		console.log("cell:");
		console.log(cell);
		//console.log('click and focus');
		$(cell).click().find('input,select,textarea').focus();
	}
};

dmxe.onDescInput = function() {
	console.log("begin dmxe.onDescInput");
	var newValue = $('#enumDesc').val();
	dmxe.doc.description = newValue;
};

dmxe.generateXML = function() {
	console.log('in dmxe.generateXML()');

	var x2js = new X2JS();
	var enumName = dmxe.doc.name;
	var enumId = dmxe.doc.id;
	var enumDesc = dmxe.doc.description;
	var jsonObj1 = {
		Enum : {
			_name : enumName,
			_typeId : enumId,
			Annotation : [{
				"_name" : "description",
				"_svalue" : enumDesc
			}],
			Choice : []
		}
	};

	var elements = dmxe.doc.attributes.asArray();
	var l = elements.length;

	for (var i = 0; i < l; i++) {
		var array = dmxe.doc.attributes.get(i).split("|");
		var id = array[0];
		var name = array[1];
		var desc = array[2];

		jsonObj1.Enum.Choice[i] = {
			_name : name,
			_value : id,
			"Annotation" : {
				"_name" : "description",
				"_svalue" : desc
			}
		};
	}

	var xmlAsStr = x2js.json2xml_str(jsonObj1);
	$('#xmlOutputGroup').show();
	$('#xmlOutput').text(vkbeautify.xml(xmlAsStr));
};

dmxe.addAttribute = function() {
	var elements = dmxe.doc.attributes.asArray();
	var l = elements.length;
	var largestKey = 0;
	var largestNbrInName = 0;

	for (var i = 0; i < l; i++) {
		var array = dmxe.doc.attributes.get(i).split("|");
		if (isNaN(array[0])) {
		} else {
			var currentKey = parseInt(array[0]);
			if (largestKey < currentKey) {
				largestKey = currentKey;
			}
		}

		var digits;
		if (array[1].startWith("NEW_ELEMENT_")) {
			digits = array[1].substr(12);
			if (isNaN(digits)) {
			} else {
				var nbrInName = parseInt(digits);
				if (largestNbrInName < nbrInName) {
					largestNbrInName = nbrInName;
				}
			}
		}
	}

	var id = largestKey + 1;
	var element = "NEW_ELEMENT_" + (largestNbrInName + 1);
	dmxe.doc.attributes.push(id + "|" + element + "|" + "description for " + element);

	console.log('addAttribute: ' + id + "|" + element);
};

dmxe.delAttribute = function() {
	console.log('delAttribute');

	$("#dataTableDeleteRow").addClass('disabled');
	var anSelected = dmxe.oTable.$('tr.row_selected');
	var idx = dmxe.oTable.fnGetPosition(anSelected[0]);

	dmxe.doc.attributes.remove(idx);
};

dmxe.nextInputFocusXY = null;

dmxe.setupDataTable = function() {

	var fnDrawCallback = function(oSettings) {
		$('#enumElementTable tbody td.jeditable_editable_td').editable(function(value, settings) {
			var aPos = dmxe.oTable.fnGetPosition(this);
			var aData = dmxe.oTable.fnGetData(aPos[0]);
			if (aPos[2] == 1) {
				console.log(aPos[0], value + "|" + aData[2] + "|" + aData[3]);
				dmxe.doc.attributes.set(aPos[0], value + "|" + aData[2] + "|" + aData[3]);
			} else if (aPos[2] == 2) {
				console.log(aPos[0], aData[1] + "|" + value + "|" + aData[3]);
				dmxe.doc.attributes.set(aPos[0], aData[1] + "|" + value + "|" + aData[3]);
			} else if (aPos[2] == 3) {
				console.log(aPos[0], aData[1] + "|" + aData[2] + "|" + value);
				dmxe.doc.attributes.set(aPos[0], aData[1] + "|" + aData[2] + "|" + value);
			}
		}, {
			"height" : "30px",
			"width" : "100%"
		}).click(function(evt) {
			$(this).find('input').keydown(function(e) {
				if (event.which == 9)//'TAB'
				{
					dmxe.nextInputFocusXY = null;

					e.preventDefault();
					e.stopPropagation();

					var oInput = $(this);

					// Function to find next editable cell in row
					var fnNextInput = function(oTds) {

						// Loop through cells
						oTds.each(function() {

							// Get column position of cell
							var cellXY = dmxe.oTable.fnGetPosition(this);
							// If cell is editable then click and focus on input
							//$(this).click().find('input,select,textarea').focus();
							console.log("next input:");
							console.log(cellXY);
							dmxe.nextInputFocusXY = cellXY;
							return false;

						});

						if (oTds.length == 0) {
							if (oInput.closest('tr').next().length > 0) {
								fnNextInput(oInput.closest('tr').next().children());
							}
						}
					};

					// Call fnNextInput with all the cells in the row to the right of the current cell
					fnNextInput(oInput.closest('td').nextAll());

					$(this).closest('form').submit();
				}
			});
		});

	};

	dmxe.oTable = $('#enumElementTable').dataTable({
		"bPaginate" : false,
		"bLengthChange" : false,
		"bFilter" : true,
		"bSort" : false,
		"bInfo" : false,
		"bAutoWidth" : false,
		"fnDrawCallback" : fnDrawCallback,
		"aoColumnDefs" : [{
			"sClass" : "jeditable_editable_td",
			"aTargets" : [1, 2, 3]
		}],
	});

	dmxe.oTable.fnSetColumnVis(0, false);

	$("#enumElementTable tbody").on('click', 'tr', function() {
		if ($(this).children(".dataTables_empty").is(':visible')) {
			return;
		}
		if ($(this).hasClass('row_selected')) {
			$(this).removeClass('row_selected');
			$("#dataTableDeleteRow").addClass('disabled');
		} else {
			dmxe.oTable.$('tr.row_selected').removeClass('row_selected');
			$(this).addClass('row_selected');
			$("#dataTableDeleteRow").removeClass('disabled');
		}
	});

	$('#dataTableAddRow').click(function() {
		dmxe.addAttribute();
	});

	$('#dataTableDeleteRow').click(function() {
		dmxe.delAttribute();
	});
};

// The entry point of the module
dmxe.start = function() {
	console.log("begin dmxe.start()");

	$("#saveChangeNameModal").click(dmxe.renameData);

	$("#enumId").prop('disabled', true);
	dmxe.setupDataTable();

	$("#enumDesc").keyup(dmxe.onDescInput);

	$("#generateXML").click(dmxe.generateXML);

	dog.authorize(false, dmxe.onAuthResult);

	dmxe.hideProgressBarGroup();
};

google.setOnLoadCallback(dmxe.start);
