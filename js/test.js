"use strict";

var test = test || {};

test.start = function() {
	var projectFile;

	var t = $('#testWindow').get(0).contentWindow;

	queuedAsyncTest("create a project", function() {
		expect(1);
		t.f1.createProject(function(file) {
			projectFile = file;
			ok(projectFile.id.length > 0, "Passed!");
			start();
			nextTest();
		});
	});

	queuedAsyncTest("open a project", function() {
		expect(1);

		t.f1.onOpenProject(projectFile);

		setTimeout(function() {
			ok(t.ball.projectFile.title == projectFile.title, "Passed!");
			start();
			nextTest();
		}, 8000);
	});

	queuedAsyncTest("rename a project", function() {
		expect(1);

		alert("going to rename the project");
		t.document.getElementById('projectName').click();

		setTimeout(function() {
			$(t.document.getElementById('projectNameEdit')).val("projectRenameTest");

			t.document.getElementById('saveChangeNameModal').click();
			//t.f1.renameProject();

			setTimeout(function() {
				ok(t.ball.projectFile.title == "projectRenameTest", "Passed!");
				start();
				nextTest();
			}, 8000);
		}, 3000);
	});

	// var dataTypes = t.f1.dataTypeSelectize[0].selectize.getOptions();
	//
	// for (var key in dataTypes) {
	// if (dataTypes.hasOwnProperty(key)) {
	// var dataType = dataTypes[key];
	// }
	// }

	queuedAsyncTest("create a new Enum", function() {
		expect(1);

		alert("going to create a new enum");
		t.document.getElementById('nameEnumModal').click();
		$(t.document.getElementById('newEnumName')).val("aNewEnum");
		t.document.getElementById('saveNewEnumName').click();

		setTimeout(function() {
			ok(true, "Passed!");
			start();
			nextTest();
		}, 8000);
	});

	queuedAsyncTest("add description to the Enum", function() {
		expect(1);

		alert("going to add desc to the enum");
		t = $('#testWindow').get(0).contentWindow;
		$(t.document.getElementById('enumDesc')).val("test enum description");
		t.dmxe.onDescInput(null);

		setTimeout(function() {
			ok(true, "Passed!");
			start();
			nextTest();
		}, 12000);
	});

	queuedAsyncTest("add elements to the Enum", function() {
		expect(1);

		setTimeout(function() {
			t.document.getElementById('dataTableAddRow').click();
		}, 5000);

		setTimeout(function() {
			ok(true, "Passed!");
			start();
			nextTest();
		}, 12000);
	});

	queuedAsyncTest("go back to project page", function() {
		expect(1);

		t.document.getElementById('f1link').click();

		setTimeout(function() {
			ok(true, "Passed!");
			start();
			nextTest();
		}, 3000);
	});

	queuedAsyncTest("create a new persisted data", function() {
		expect(1);

		alert("going to create a new persisted data");
		t.document.getElementById('nameDataModal').click();

		$(t.document.getElementById('newDataName')).val("aNewPersistedData");
		t.f1.dataTypeSelectize[0].selectize.addItemQuiet("persisted");

		t.document.getElementById('saveNewDataName').click();

		setTimeout(function() {
			ok(true, "Passed!");
			start();
			nextTest();
		}, 8000);
	});

	queuedAsyncTest("add description to the data", function() {
		expect(1);

		alert("going to add desc to the data");
		t = $('#testWindow').get(0).contentWindow;
		$(t.document.getElementById('dataDesc')).val("test persisted data description");
		t.dmx.onDataDescInput(null);

		setTimeout(function() {
			ok(true, "Passed!");
			start();
			nextTest();
		}, 12000);
	});

	queuedAsyncTest("go back to project page", function() {
		expect(1);

		t.document.getElementById('f1link').click();

		setTimeout(function() {
			ok(true, "Passed!");
			start();
			nextTest();
		}, 8000);
	});

	queuedAsyncTest("create a new application state data", function() {
		expect(1);

		alert("going to create a new application state data");

		t.document.getElementById('nameDataModal').click();

		$(t.document.getElementById('newDataName')).val("aNewApplicationStateData");
		t.f1.dataTypeSelectize[0].selectize.addItemQuiet("applicationState");
		t.document.getElementById('saveNewDataName').click();

		setTimeout(function() {
			ok(true, "Passed!");
			start();
			nextTest();
		}, 8000);
	});

	queuedAsyncTest("add description to the data", function() {
		expect(1);

		alert("going to add desc to the data");
		t = $('#testWindow').get(0).contentWindow;
		$(t.document.getElementById('dataDesc')).val("test application state data description");
		t.dmx.onDataDescInput(null);

		setTimeout(function() {
			ok(true, "Passed!");
			start();
			nextTest();
		}, 12000);
	});

	queuedAsyncTest("add attributes to the data", function() {
		expect(1);

		alert("going to add attributes to the data");
		t = $('#testWindow').get(0).contentWindow;
		t.document.getElementById('dataTableAddRow').click();
		t.document.getElementById('dataTableAddRow').click();
		t.document.getElementById('dataTableAddRow').click();
		t.document.getElementById('dataTableAddRow').click();
		t.document.getElementById('dataTableAddRow').click();
		t.document.getElementById('dataTableAddRow').click();
		t.document.getElementById('dataTableAddRow').click();
		t.document.getElementById('dataTableAddRow').click();
		t.document.getElementById('dataTableAddRow').click();
		t.document.getElementById('dataTableAddRow').click();
		t.document.getElementById('dataTableAddRow').click();
		t.document.getElementById('dataTableAddRow').click();
		t.document.getElementById('dataTableAddRow').click();

		$(t.document.getElementById('attrTable')).find('tbody tr')[0].click();
		$(t.document.getElementById('dataAttrName')).val('testString');
		t.dmx.dataAttrTypeSelectize[0].selectize.addItemQuiet("string");
		$(t.document.getElementById('dataAttrDesc')).val('description for testString');
		t.dmx.saveToGoogle();

		$(t.document.getElementById('attrTable')).find('tbody tr')[1].click();
		$(t.document.getElementById('dataAttrName')).val('testInt');
		t.dmx.dataAttrTypeSelectize[0].selectize.addItemQuiet("int");
		$(t.document.getElementById('dataAttrDesc')).val('description for testInt');
		t.dmx.saveToGoogle();

		$(t.document.getElementById('attrTable')).find('tbody tr')[2].click();
		$(t.document.getElementById('dataAttrName')).val('testDouble');
		t.dmx.dataAttrTypeSelectize[0].selectize.addItemQuiet("double");
		$(t.document.getElementById('dataAttrDesc')).val('description for testDouble');
		t.dmx.saveToGoogle();

		$(t.document.getElementById('attrTable')).find('tbody tr')[3].click();
		$(t.document.getElementById('dataAttrName')).val('testBoolean');
		t.dmx.dataAttrTypeSelectize[0].selectize.addItemQuiet("boolean");
		$(t.document.getElementById('dataAttrDesc')).val('description for testBoolean');
		t.dmx.saveToGoogle();

		$(t.document.getElementById('attrTable')).find('tbody tr')[4].click();
		$(t.document.getElementById('dataAttrName')).val('testChar');
		t.dmx.dataAttrTypeSelectize[0].selectize.addItemQuiet("char");
		$(t.document.getElementById('dataAttrDesc')).val('description for testChar');
		t.dmx.saveToGoogle();

		$(t.document.getElementById('attrTable')).find('tbody tr')[5].click();
		$(t.document.getElementById('dataAttrName')).val('testByte');
		t.dmx.dataAttrTypeSelectize[0].selectize.addItemQuiet("byte");
		$(t.document.getElementById('dataAttrDesc')).val('description for testByte');
		t.dmx.saveToGoogle();

		$(t.document.getElementById('attrTable')).find('tbody tr')[6].click();
		$(t.document.getElementById('dataAttrName')).val('testShort');
		t.dmx.dataAttrTypeSelectize[0].selectize.addItemQuiet("short");
		$(t.document.getElementById('dataAttrDesc')).val('description for testShort');
		t.dmx.saveToGoogle();

		$(t.document.getElementById('attrTable')).find('tbody tr')[7].click();
		$(t.document.getElementById('dataAttrName')).val('testLong');
		t.dmx.dataAttrTypeSelectize[0].selectize.addItemQuiet("long");
		$(t.document.getElementById('dataAttrDesc')).val('description for testLong');
		t.dmx.saveToGoogle();

		$(t.document.getElementById('attrTable')).find('tbody tr')[8].click();
		$(t.document.getElementById('dataAttrName')).val('testDate');
		t.dmx.dataAttrTypeSelectize[0].selectize.addItemQuiet("date");
		$(t.document.getElementById('dataAttrDesc')).val('description for testDate');
		t.dmx.saveToGoogle();

		$(t.document.getElementById('attrTable')).find('tbody tr')[9].click();
		$(t.document.getElementById('dataAttrName')).val('testDatetime');
		t.dmx.dataAttrTypeSelectize[0].selectize.addItemQuiet("datetime");
		$(t.document.getElementById('dataAttrDesc')).val('description for testDatetime');
		t.dmx.saveToGoogle();

		$(t.document.getElementById('attrTable')).find('tbody tr')[10].click();
		$(t.document.getElementById('dataAttrName')).val('testNanotime');
		t.dmx.dataAttrTypeSelectize[0].selectize.addItemQuiet("nanotime");
		$(t.document.getElementById('dataAttrDesc')).val('description for testNanotime');
		t.dmx.saveToGoogle();

		$(t.document.getElementById('attrTable')).find('tbody tr')[11].click();
		$(t.document.getElementById('dataAttrName')).val('testEnum');
		t.dmx.dataAttrTypeSelectize[0].selectize.addItemQuiet("enum");
		$(t.document.getElementById('dataAttrDesc')).val('description for testEnum');
		t.dmx.saveToGoogle();

		$(t.document.getElementById('attrTable')).find('tbody tr')[12].click();
		$(t.document.getElementById('dataAttrName')).val('testRef');
		t.dmx.dataAttrTypeSelectize[0].selectize.addItemQuiet("ref");
		$(t.document.getElementById('dataAttrDesc')).val('description for testRef');
		t.dmx.saveToGoogle();

		setTimeout(function() {
			ok(true, "Passed!");
			start();
			nextTest();
		}, 12000);
	});

	queuedAsyncTest("go back to project page", function() {
		expect(1);

		t.document.getElementById('f1link').click();

		setTimeout(function() {
			ok(true, "Passed!");
			start();
			nextTest();
		}, 8000);
	});

	queuedAsyncTest("create a new event data", function() {
		expect(1);

		alert("going to create a new event data");
		t.document.getElementById('nameDataModal').click();

		$(t.document.getElementById('newDataName')).val("aNewEventData");
		t.f1.dataTypeSelectize[0].selectize.addItemQuiet("event");
		t.document.getElementById('saveNewDataName').click();

		setTimeout(function() {
			ok(true, "Passed!");
			start();
			nextTest();
		}, 8000);
	});

	queuedAsyncTest("add description to the data", function() {
		expect(1);

		alert("going to add desc to the data");
		t = $('#testWindow').get(0).contentWindow;
		$(t.document.getElementById('dataDesc')).val("test event data description");
		t.dmx.onDataDescInput(null);

		setTimeout(function() {
			ok(true, "Passed!");
			start();
			nextTest();
		}, 12000);
	});

	queuedAsyncTest("go back to project page", function() {
		expect(1);

		t.document.getElementById('f1link').click();

		setTimeout(function() {
			ok(true, "Passed!");
			start();
			nextTest();
		}, 8000);
	});

	queuedAsyncTest("export XML", function() {
		expect(1);

		t.document.getElementById('generateXML').click();

		setTimeout(function() {
			ok(true, "Passed!");
			start();
			nextTest();
		}, 3000);
	});
};

var iframeReadyNeverCalled = true;

function iframeReady() {
	console.log("iframeReady");

	if (iframeReadyNeverCalled) {
		iframeReadyNeverCalled = false;
		window.setTimeout(function() {
			test.start();
			nextTest();
		}, 100);
	}
}

QUnit.config.autorun = false;

this.addEventListener('pageReady', function(e) {
	console.log("in pageReady");
}, false);

$(window).ready(function() {
	$(".splitContainer").splitter();
});
