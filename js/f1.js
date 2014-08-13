"use strict";

var f1 = f1 || {};

f1.doc = null;

f1.fileList = new List('fileList', {
	valueNames : ['name', 'desc'],
	item : '<li><h3 class="name"></h3><p class="desc"></p></li>'
	//<a class="btn btn-lg" id="createFile"><i class="clip-plus-circle"></i></a>
});

f1.hideProgressBarGroup = function() {
	$("#progressBarGroup").hide();
};

f1.renameProject = function() {
	console.log("begin f1.renameProject()");

	var newName = $('#projectNameEdit').val();

	if (ball.isFileNamePatternValid(newName) == false) {
		console.log("Nothing changed");
		$("#renameAlertMsg").fadeIn().delay(2000).fadeOut();
		return;
	}

	if (newName == ball.projectFile.title) {
		console.log("Nothing changed");
		return;
	}

	dog.renameFile(ball.projectFile.id, newName, function(projectFile) {
		var folderId = projectFile.parents[0].id;
		dog.renameFile(folderId, newName, function(resp) {
			f1.onOpenProject(projectFile);
			$("#projectName").html("<span>" + ball.projectFile.title + "</span>");

			$("#lean_overlay").fadeOut(200);
			$("#changeNameModal").css({
				'display' : 'none'
			});
		});
	});
};

f1.sortFileList = function() {
	console.log("in f1.sortFileList");
	var ul = $("#fileList ul");
	var arr = $.makeArray(ul.children("li"));

	arr.sort(function(a, b) {
		var textA = $(a).text();
		var textB = $(b).text();

		if (textA < textB)
			return -1;
		if (textA > textB)
			return 1;

		return 0;
	});

	ul.empty();

	$.each(arr, function() {
		ul.append(this);
	});
};

f1.getDMXfiles = function() {
	console.log("begin getDMXfiles()");
	dog.getFiles(ball.projectFolder.id, ball.DMX_MIMETYPE, function(file) {
		console.log("Inside Id: " + file.id + "   Title:" + file.title);
		f1.addDMXToList(file.id);
	});
};

f1.addDMXToList = function(fileId) {
	ball.getDMXModel(fileId, function(doc) {
		var name = doc.name;
		var desc = doc.description;

		var itemTitle = '<div style="margin: 3px; width: 32px; height: 32px; display:inline-block; background-color: #2a6496; color: #fff;">D</div> <a href="' + cat.getRedirectStr(ball.DMX_HTM, '&dmxFileId=' + fileId) + '">' + name + '</a>';
		f1.fileList.add({
			"name" : itemTitle,
			"desc" : desc
		});
		console.log("Id: " + fileId + "   Title:" + name);
		f1.sortFileList();
	});
};

f1.getDMXEfiles = function() {
	console.log("begin getDMXEfiles()");
	dog.getFiles(ball.projectFolder.id, ball.DMXE_MIMETYPE, function(file) {
		console.log("Inside Id: " + file.id + "   Title:" + file.title);
		f1.addDMXEToList(file.id);
	});
};

f1.addDMXEToList = function(fileId) {
	ball.getDMXEModel(fileId, function(doc) {
		var name = doc.name;
		var desc = doc.description;

		var itemTitle = '<div style="margin: 3px; width: 32px; height: 32px; display:inline-block; background-color: #2E9629; color: #fff;">E</div> <a href="' + cat.getRedirectStr(ball.DMXE_HTM, '&dmxeFileId=' + fileId) + '">' + name + '</a>';
		f1.fileList.add({
			"name" : itemTitle,
			"desc" : desc
		});
		console.log("Id: " + fileId + "   Title:" + name);
		f1.sortFileList();
	});
};

f1.getFMXfiles = function() {
	console.log("begin getFMXfiles()");
	dog.getFiles(ball.projectFolder.id, ball.FMX_MIMETYPE, function(file) {
		console.log("Inside Id: " + file.id + "   Title:" + file.title);
		f1.addFMXToList(file.id);
	});
};

f1.addFMXToList = function(fileId) {
	ball.getFMXModel(fileId, function(doc) {
		var name = doc.name;
		var desc = doc.description;

		var itemTitle = '<div style="margin: 3px; width: 32px; height: 32px; display:inline-block; background-color: #912996; color: #fff;">F</div> <a href="' + cat.getRedirectStr(ball.FMX_HTM, '&fmxFileId=' + fileId) + '">' + name + '</a>';
		f1.fileList.add({
			"name" : itemTitle,
			"desc" : desc
		});
		console.log("Id: " + fileId + "   Title:" + name);
		f1.sortFileList();
	});
};

f1.createProject = function(callback) {
	dog.createFolder(ball.PROJECT_DEFAULTNAME, null, function(folder) {
		console.log('new project folder: ' + folder);
		console.log(folder);

		if (!folder) {
			console.error('Error creating new folder.');
			console.error(folder);
		}

		dog.createFile(folder.title, [folder], ball.PROJECT_MIMETYPE, function(projectFile) {
			if (projectFile.id) {
				if (callback) {
					callback(projectFile);
				}
			}
			// File failed to be created, log why and do not attempt to redirect.
			else {
				console.error('Error creating project file.');
				console.error(projectFile);
			}
		});
	});
};

f1.createDMX = function(name, callback) {
	console.log("begin createDMX()");
	console.log("ball.projectFolder:" + ball.projectFolder);
	if (name == null) {
		name = ball.DMX_DEFAULTNAME;
	}
	dog.createFile(name, [ball.projectFolder], ball.DMX_MIMETYPE, function(dmxFile) {
		if (dmxFile.id) {
			if (callback) {
				callback(dmxFile.id, f1.dataTypeSelectize[0].selectize.getValue());
			}
		}
		// File failed to be created, log why and do not attempt to redirect.
		else {
			console.error('Error creating dmx file.');
			console.error(dmxFile);
		}
	});
};

f1.createDMXE = function(name, callback) {
	console.log("begin createDMXE()");
	console.log("ball.projectFolder:" + ball.projectFolder);
	if (name == null) {
		name = ball.DMXE_DEFAULTNAME;
	}
	dog.createFile(name, [ball.projectFolder], ball.DMXE_MIMETYPE, function(dmxeFile) {
		if (dmxeFile.id) {
			if (callback) {
				callback(dmxeFile.id);
			}
		}
		// File failed to be created, log why and do not attempt to redirect.
		else {
			console.error('Error creating dmxe file.');
			console.error(dmxeFile);
		}
	});
};

f1.createFMX = function(name, callback) {
	console.log("begin createFMX()");
	console.log("ball.projectFolder:" + ball.projectFolder);
	if (name == null) {
		name = ball.FMX_DEFAULTNAME;
	}
	dog.createFile(name, [ball.projectFolder], ball.FMX_MIMETYPE, function(fmxFile) {
		if (fmxFile.id) {
			if (callback) {
				callback(fmxFile.id);
			}
		}
		// File failed to be created, log why and do not attempt to redirect.
		else {
			console.error('Error creating fmx file.');
			console.error(fmxFile);
		}
	});
};

f1.onOpenDMX = function(dmxFileId, dataType) {
	console.log("begin onOpenDMX()");

	window.location = cat.getRedirectStr(ball.DMX_HTM, '&dmxFileId=' + dmxFileId + '&dataType=' + dataType);
};

f1.onOpenDMXE = function(dmxeFileId) {
	console.log("begin onOpenDMXE()");

	window.location = cat.getRedirectStr(ball.DMXE_HTM, '&dmxeFileId=' + dmxeFileId);
};

f1.onOpenFMX = function(fmxFileId) {
	console.log("begin onOpenFMX()");

	window.location = cat.getRedirectStr(ball.FMX_HTM, '&fmxFileId=' + fmxFileId);
};

f1.onOpenProject = function(projectFile) {
	console.log("begin onOpenProject()");

	$('#sharingButtonGroup').show();
	$('#docButtonGroup').hide();

	cat.appendAnchorParams("projectFileId", projectFile.id);

	dog.getFile(projectFile.id, function(resp) {
		ball.projectFile = resp;
		$("#projectName").html("<span>" + ball.projectFile.title + "</span>");
                document.getElementById("the-breadcrumb").docLabel = ball.projectFile.title;
		ball.getNextId(ball.projectFile.id, function(currentId) {
			console.log("Current ID: " + currentId);
		}, 0);

		$("#projectName span").leanModal({
			modal : "#changeNameModal",
			closeButton : "#closeChangeNameModal",
			onBeforeDisplay : function() {
				$("#projectNameEdit").val(ball.projectFile.title);
			}
		});

		dog.getParentFolder(ball.projectFile.id, function(folder) {
			ball.projectFolder = folder;

			f1.getDMXEfiles();
			f1.getDMXfiles();
			f1.getFMXfiles();

			$("#f1link").attr("href", cat.getRedirectStr("./f1.htm"));
			$("#f1link").html(ball.projectFile.title);

			$('#docButtonGroupDMX').show();
			$('#contentGroup').show();
		});
	});
};

f1.onAuthResult = function(authResult) {
	console.log("begin onAuthResult()");

	if (authResult && !authResult.error) {
		var onLoaded = function() {
			if (cat.anchorParams.disableButtonGroup) {
				console.log("cat.anchorParams.disableButtonGroup has a value");
				$('#docButtonGroup').hide();
			} else {
				console.log("cat.anchorParams.disableButtonGroup has no value");
				$('#docButtonGroup').show();
			}
			$('#authorizeButtonGroup').hide();
			$('#docButtonGroupDMX').hide();
			$('#contentGroup').hide();

			if (ball.projectFile && ball.projectFile.id) {
				console.log("ball.projectFile is specified, loading the project.");
				f1.onOpenProject(ball.projectFile);
			} else {
				console.log("ball.projectFile is null, do nothing.");
			}
		};

		dog.loadParamsToBall(onLoaded);
	} else {
		$('#authorizeButton').click(function() {
			dog.authorize(true, f1.onAuthResult);
		});
		$('#authorizeButtonGroup').show();
		$('#docButtonGroupDMX').hide();
		$('#contentGroup').hide();
	}

	if ( typeof parent.iframeReady == 'function') {
		parent.iframeReady();
	}
	var pageReady = new Event('pageReady');
	parent.dispatchEvent(pageReady);
};

f1.generateAllEnumXML = function(callback) {

	var jsonRoot = [];

	var recvCount = 0;
	var dmxeFileIds = [];
	var getDMXEFilesCallback = function(resp, totalCount) {
		recvCount++;

		dmxeFileIds.push(resp.id);

		console.log("show some progress bar: " + (recvCount / totalCount) * 100 + "%");

		if (recvCount == totalCount) {
			console.log("recvCount == totalCount");
			loopDMXEFilesCallback();
		}
	};

	var loopDMXEFilesCallback = function() {
		console.log("in loopDMXEFilesCallback");
		console.log("dmxeFileIds.length: " + dmxeFileIds.length);
		var processedCount = 0;
		for (var i = 0; i < dmxeFileIds.length; i++) {
			ball.getDMXEModel(dmxeFileIds[i], function(doc) {
				var dmxeId = doc.id;
				var dmxeName = doc.name;
				var dmxeDesc = doc.description;

				var node = {
					_typeId : dmxeId,
					_name : dmxeName,
					"Annotation" : {
						"_name" : "description",
						"_svalue" : dmxeDesc
					},
					Choice : []
				};

				var elements = doc.attributes.asArray();
				for (var j = 0; j < elements.length; j++) {
					var array = elements[j].split("|");
					var id = array[0];
					var name = array[1];
					var desc = array[2];

					node.Choice[j] = {
						_name : name,
						_value : id,
						"Annotation" : {
							"_name" : "description",
							"_svalue" : desc
						}
					};
				}

				jsonRoot.push(node);

				processedCount++;
				console.log("processedCount: " + processedCount);
				if (processedCount == dmxeFileIds.length) {
					callback(jsonRoot);
				}
			});
		}
	};

	dog.getFiles(ball.projectFolder.id, ball.DMXE_MIMETYPE, getDMXEFilesCallback);
};

f1.generateAllDataXML = function(callback) {

	var jsonRoot = [];

	var recvCount = 0;
	var dmxFileIds = [];
	var getDMXFilesCallback = function(resp, totalCount) {
		recvCount++;

		dmxFileIds.push(resp.id);

		console.log("show some progress bar: " + (recvCount / totalCount) * 100 + "%");

		if (recvCount == totalCount) {
			console.log("recvCount == totalCount");
			loopDMXFilesCallback();
		}
	};

	var loopDMXFilesCallback = function() {
		console.log("in loopDMXFilesCallback");
		console.log("dmxFileIds.length: " + dmxFileIds.length);
		var processedCount = 0;
		for (var i = 0; i < dmxFileIds.length; i++) {
			ball.getDMXModel(dmxFileIds[i], function(doc) {
				var dmxId = doc.id;
				var dmxName = doc.name;
				var dmxType = doc.type;
				var dmxDesc = doc.description;

				var node = {
					_typeId : dmxId,
					_name : dmxName,
					_type : dmxType,
					_identifiable : "true",
					_stateChecked : "false",
					Annotation : [{
						"_name" : "description",
						"_svalue" : dmxDesc
					}, {
						"_name" : "type",
						"_svalue" : dmxType
					}],
					Field : []
				};

				var keys = doc.attributes.keys();
				keys.sort();
				var l = keys.length;
				for (var i = 0; i < l; i++) {
					var key = keys[i];
					var val = doc.attributes.get(key).split('|');

					node.Field[i] = {
						_name : val[0],
						_type : val[1],
						"Annotation" : {
							"_name" : "doc",
							"_svalue" : val[2]
						},
						_default : val[3],
						//_readOnly : val[4],
						_optional : val[5]
					};

					console.log("val[1]:" + val[1]);
					switch(val[1]) {//type
						case 'string':
							node.Field[i]._length = val[7];
							break;
						case 'ref':
							node.Field[i]._ref = val[10].split("=")[1];
							node.Field[i]._refType = val[11];
							break;
						case 'int':
						case 'double':
						case 'short':
						case 'long':
							if (isNaN(val[8])) {
							} else {
								node.Field[i]._min = val[8];
							}
							if (isNaN(val[9])) {
							} else {
								node.Field[i]._max = val[9];
							}
							break;
						case 'enum':
							node.Field[i]._enum = val[12].split("=")[1];
							node.Field[i]._default = val[13];
							break;
					}

					if (parseInt(val[6]) > 0) {
						node.Field[i]._sequenceLength = val[6];
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

				jsonRoot.push(node);

				processedCount++;
				console.log("processedCount: " + processedCount);
				if (processedCount == dmxFileIds.length) {
					callback(jsonRoot);
				}
			});
		}
	};

	dog.getFiles(ball.projectFolder.id, ball.DMX_MIMETYPE, getDMXFilesCallback);
};

f1.generateXML = function() {
	console.log('generateXML');

	var jsonRoot = {
		FlxSchema : {
			_name : ball.projectFile.title,
			_version : "1",
			Annotation : [{
				"_name" : "description",
				"_svalue" : "dataDesc"
			}],
			Enum : [],
			Data : []
		}
	};

	//1. get all DMXE
	f1.generateAllEnumXML(function(node) {
		jsonRoot.FlxSchema.Enum = node;
		//2. get all DMX
		f1.generateAllDataXML(function(node) {
			jsonRoot.FlxSchema.Data = node;
			showXML();
		});
	});

	var showXML = function() {
		var x2js = new X2JS();
		var xmlString = vkbeautify.xml('<?xml version="1.0" encoding="UTF-8" ?>' + x2js.json2xml_str(jsonRoot));
		$('#xmlOutputGroup').show();
		$('#xmlOutput').text(xmlString);
	};
};

// The entry point of the module
f1.start = function() {
	console.log("begin f1.start()");

	$("#createNew").click(function() {
		f1.createProject(f1.onOpenProject);
	});

	$("#saveNewDataName").click(function() {
		if (ball.isFileNamePatternValid($("#newDataName").val()) == false) {
			console.log("Nothing created due to invalid name pattern.");
			$("#dataNameError").fadeIn().delay(2000).fadeOut();
			return;
		}

		if (f1.dataTypeSelectize[0].selectize.getValue() == "enumeration") {
			f1.createDMXE($("#newDataName").val(), f1.onOpenDMXE);
		} else {
			f1.createDMX($("#newDataName").val(), f1.onOpenDMX);
		}
	});

	f1.dataTypeSelectize = $("#dataType").selectize();

	$("#createNewDMX").leanModal({
		modal : "#nameDataModal",
		closeButton : "#closeNameDataModal",
		onBeforeDisplay : function() {
			$("#newDataName").val(ball.DMX_DEFAULTNAME);
		}
	});

	$("#saveNewFlowName").click(function() {
		f1.createFMX($("#newFlowName").val(), f1.onOpenFMX);
	});

	$("#createNewFMX").leanModal({
		modal : "#nameFlowModal",
		closeButton : "#closeNameFlowModal",
		onBeforeDisplay : function() {
			$("#newFlowName").val(ball.FMX_DEFAULTNAME);
		}
	});

	$("#generateXML").click(f1.generateXML);
	$("#saveChangeNameModal").click(f1.renameProject);

	$("#shareProject").click(function() {
		if (ball.projectFolder) {
			dog.popupShare(ball.projectFolder.id);
		} else {
			alert("Please open or create a project first.");
		}
	});

	$("#openExisting").click(function() {
		dog.popupOpen(ball.PROJECT_MIMETYPE, function(data) {
			if (data.action == google.picker.Action.PICKED) {
				f1.onOpenProject(data.docs[0]);
			}
		});
	});

	dog.authorize(false, f1.onAuthResult);

	f1.hideProgressBarGroup();
};

$(window).ready(function() {
	google.setOnLoadCallback(f1.start);
});
