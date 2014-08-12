"use strict";

var fmx = fmx || {};

fmx.file = null;
fmx.fileId = null;
fmx.rtDoc = null;
fmx.doc = null;
fmx.noflo = null;
fmx.editor = null;
fmx.f1Doc = null;

fmx.onAnnouncement = function() {
    console.log("fmx.onAnnouncement");
    console.log(fmx.f1Doc.announcement);
}

fmx.onAuthResult = function(authResult) {
    console.log("begin onAuthResult()");
    if (authResult && !authResult.error) {
        console.log("authorized.");

        $('#contentGroup').hide();
        dog.loadParamsToBall(function() {
            document.getElementById("the-breadcrumb").f1Url = cat.getRedirectStr("./f1.htm");
            document.getElementById("the-breadcrumb").f1Label = ball.projectFile.title;

            ball.registerFMX();

            fmx.fileId = cat.anchorParams.fmxFileId;
            if (fmx.fileId) {
                fmx.loadFile();
            }
            ball.getF1Model(ball.projectFile.id, function(f1Doc) {
                fmx.f1Doc = f1Doc;
                ball.registerAnnouncement(fmx.f1Doc, fmx.onAnnouncement);
            });
        });
    } else {
        // Remove loading message
        document.body.removeChild(document.getElementById("loading"));

        console.log("not authorized.");
        // $('#contentGroup').hide();
    }
};

fmx.renameData = function() {
    console.log("begin fmx.renameData()");

    var newName = $('#dataNameEdit').val();

    if (ball.isFileNamePatternValid(newName) == false) {
        console.log("Nothing changed");
        $("#renameAlertMsg").fadeIn().delay(2000).fadeOut();
        return;
    }

    if (newName == fmx.file.title) {
        console.log("Nothing changed");
        return;
    }

    fmx.doc.name = newName;
    dog.renameFile(fmx.file.id, newName, function(dataFile) {
        fmx.loadFile();
        $("#lean_overlay").fadeOut(200);
        $("#changeNameModal").css({
            'display': 'none'
        });
    });
};

fmx.loadFile = function() {
    console.log('begin fmx.loadFile()');
    console.log("fmx.fileId:");
    console.log(fmx.fileId);
    gapi.drive.realtime.load(fmx.fileId, fmx.onFileLoaded, fmx.initializeModel, dog.handleErrors);
    console.log('end fmx.loadFile()');
};

fmx.onFileLoaded = function(rtDoc) {
    console.log("begin fmx.onFileLoaded()");
    fmx.rtDoc = rtDoc;
    fmx.doc = fmx.rtDoc.getModel().getRoot().get(ball.FMX_MODEL);

    dog.getFile(fmx.fileId, function(file) {
        console.log(file);
        fmx.file = file;
        console.log("fmx.doc:");
        console.log(fmx.doc);

        document.getElementById("the-breadcrumb").docUrl = cat.getRedirectStr("./fmx.htm", "&fmxFileId=" + fmx.fileId);
        document.getElementById("the-breadcrumb").docLabel = fmx.doc.name;
        document.getElementById("the-breadcrumb").docType = ball.FMX_TYPE;
    });

    fmx.updateNameAndDesc();
    fmx.updateTasksAndFlows();

    fmx.doc.addEventListener(gapi.drive.realtime.EventType.VALUE_CHANGED, fmx.updateNameAndDesc);

    fmx.doc.tasks.addEventListener(gapi.drive.realtime.EventType.VALUES_ADDED, fmx.updateTasksAndFlows);
    fmx.doc.tasks.addEventListener(gapi.drive.realtime.EventType.VALUES_REMOVED, fmx.updateTasksAndFlows);
    fmx.doc.tasks.addEventListener(gapi.drive.realtime.EventType.VALUES_SET, fmx.updateTasksAndFlows);
    fmx.doc.tasks.addEventListener(gapi.drive.realtime.EventType.VALUE_CHANGED, fmx.updateTasksAndFlows);

    fmx.doc.flows.addEventListener(gapi.drive.realtime.EventType.VALUES_ADDED, fmx.updateTasksAndFlows);
    fmx.doc.flows.addEventListener(gapi.drive.realtime.EventType.VALUES_REMOVED, fmx.updateTasksAndFlows);
    fmx.doc.flows.addEventListener(gapi.drive.realtime.EventType.VALUES_SET, fmx.updateTasksAndFlows);
    fmx.doc.flows.addEventListener(gapi.drive.realtime.EventType.VALUE_CHANGED, fmx.updateTasksAndFlows);

    // Remove loading message
    document.body.removeChild(document.getElementById("loading"));
};

fmx.initializeModel = function(model) {
    console.log("begin fmx.initializeModel()");

    var field = model.create(ball.fmxModel);
    field.tasks = model.createMap();
    field.flows = model.createMap();

    console.log('fmx.initializeModel tasks: ' + field.tasks);
    console.log('fmx.initializeModel flows: ' + field.flows);

    ball.getNextId(ball.projectFile.id, function(nextId) {
        console.log("nextId: " + nextId);
        field.id = nextId;
        console.log("field:");
        console.log(field);
    });

    dog.getFile(fmx.fileId, function(file) {
        field.name = file.title;
    });

    model.getRoot().set(ball.FMX_MODEL, field);
};

fmx.updateTasksAndFlows = function() {
    console.log('begin fmx.updateTasksAndFlows()');

    //this block is for tasks
    {
        var keys = fmx.doc.tasks.keys();
        for (var i = 0; i < keys.length; i++) {
            var gdriveNode = fmx.doc.tasks.get(keys[i]);
            var canvasNode = fmx.editor.graph.getNode(keys[i]);

            if (canvasNode === null) {
                fmx.editor.graph.addNode(keys[i], gdriveNode.component, gdriveNode.metadata);
            } else {
                //update
                if (JSON.stringify(gdriveNode.metadata) !== JSON.stringify(canvasNode.metadata)) {
                    fmx.editor.graph.setNodeMetadata(keys[i], gdriveNode.metadata);
                }
                if (JSON.stringify(gdriveNode.component) !== JSON.stringify(canvasNode.component)) {
                    fmx.editor.graph.setNodeComponent(keys[i], gdriveNode.component);
                }
            }
        }
        //if true, means there are nodes have been deleted
        if (fmx.editor.graph.nodes.length > keys.length) {
            for (var i = 0; i < fmx.editor.graph.nodes.length; i++) {
                var canvasNode = fmx.editor.graph.nodes[i];
                var key = canvasNode.id;
                if (!fmx.doc.tasks.has(key)) {
                    fmx.editor.graph.removeNode(key);
                }
            }
        }
    }



    {
        var flows = fmx.doc.flows.values();
        var len = flows.length;
        for (var i = 0; i < len; i++) {
            var flow = flows[i];
            var metadata = flow.metadata ? flow.metadata : {};
            if (flow.data !== void 0) {
                if (typeof flow.tgt.index === 'number') {
                    fmx.editor.graph.addInitialIndex(flow.data, flow.tgt.process, flow.tgt.port.toLowerCase(), flow.tgt.index, metadata);
                }
                fmx.editor.graph.addInitial(flow.data, flow.tgt.process, flow.tgt.port.toLowerCase(), metadata);
                continue;
            }
            if (typeof flow.src.index === 'number' || typeof flow.tgt.index === 'number') {
                fmx.editor.graph.addEdgeIndex(flow.src.process, flow.src.port.toLowerCase(), flow.src.index, flow.tgt.process, flow.tgt.port.toLowerCase(), flow.tgt.index, metadata);
                continue;
            }
            fmx.editor.graph.addEdge(flow.src.process, flow.src.port.toLowerCase(), flow.tgt.process, flow.tgt.port.toLowerCase(), metadata);
        }
    }

//    var jsonGraph = {
//        "properties": {},
//        "inports": {},
//        "outports": {},
//        "groups": [],
//        "processes": tasks,
//        "connections": flows
//    };
//
//    console.log(jsonGraph);
//
//    fmx.noflo.graph.loadJSON(jsonGraph, function(graph) {
//        fmx.editor.graph = graph;
//    }, null);
};

fmx.updateNameAndDesc = function() {
    console.log('begin fmx.updateUi()');
};

fmx.generateXML = function() {
    console.log('in fmx.generateXML()');

    var x2js = new X2JS();
    var enumName = fmx.doc.name;
    var enumId = fmx.doc.id;
    var enumDesc = fmx.doc.description;
    var jsonObj1 = {
        Enum: {
            _name: enumName,
            _typeId: enumId,
            Annotation: [{
                    "_name": "description",
                    "_svalue": enumDesc
                }],
            Choice: []
        }
    };

    var elements = fmx.doc.attributes.asArray();
    var l = elements.length;

    for (var i = 0; i < l; i++) {
        var array = fmx.doc.attributes.get(i).split("|");
        var id = array[0];
        var name = array[1];
        var desc = array[2];

        jsonObj1.Enum.Choice[i] = {
            _name: name,
            _value: id,
            "Annotation": {
                "_name": "description",
                "_svalue": desc
            }
        };
    }

    var xmlAsStr = x2js.json2xml_str(jsonObj1);
    $('#xmlOutputGroup').show();
    $('#xmlOutput').text(vkbeautify.xml(xmlAsStr));
};

// The entry point of the module
fmx.start = function() {
    console.log("begin fmx.start()");
    dog.authorize(false, fmx.onAuthResult);
};

Polymer.veiledElements = ["the-graph-editor"];

window.addEventListener('api-load', function(event) {
    console.log('api-load ');
    console.log(event);
    if (event.target.localName === "google-jsapi") {
        google.load('picker', '1');
        console.log(google);
    } else if (event.target.localName === "google-client-api") {
        console.log(gapi);
    }
    fmx.start();
});

window.addEventListener('polymer-ready', function() {
    console.log("polymer ready");

    // The graph editor
    fmx.editor = document.getElementById('editor');

    // Attach editor to nav
    var nav = document.getElementById('nav');
    nav.editor = fmx.editor;

    // Component library
    fmx.editor.$.graph.library = {};

    fmx.noflo = require('noflo');

    // Load empty graph
    var graph = new fmx.noflo.Graph("new graph");
    fmx.editor.graph = graph;

    // Attach editor to property-editor
//    var propertyEditor = document.getElementById('property-editor');
//    propertyEditor.editor = fmx.editor;
//    propertyEditor.nodes = fmx.editor.nodes;
//    propertyEditor.graphs = [fmx.editor.graph];
//    propertyEditor.getpanel();

//    var packets = document.getElementById('noflo-packets');
//    packets.currentgraph = editor.graph;
//    packets.panel = propertyEditor.$.context;

//        fmx.updateNameAndDesc();
//        fmx.updateTasksAndFlows();


//    // view node button
//    var viewNode = function() {
//        propertyEditor.graphs = [editor.graph];
//    };
//    document.getElementById("viewNode").addEventListener("click", viewNode);
//
//    // Add node button
//    var addnode = function() {
//        var id = Math.round(Math.random() * 100000).toString(36);
//        var component = 'basic';
//        var metadata = {
//            label: 'label',
//            x: Math.round(Math.random() * 800),
//            y: Math.round(Math.random() * 600)
//        };
//        var newNode = editor.nofloGraph.addNode(id, component, metadata);
//        console.log(newNode);
//    };
//    document.getElementById("addnode").addEventListener("click", addnode);
//
//    // Add node button
//    var addAnotherNode = function() {
//        var id = Math.round(Math.random() * 100000).toString(36);
//        var component = 'another';
//        var metadata = {
//            label: 'label',
//            x: Math.round(Math.random() * 800),
//            y: Math.round(Math.random() * 600)
//        };
//        var newNode = editor.nofloGraph.addNode(id, component, metadata);
//        console.log(newNode);
//    };
//    document.getElementById("addAnotherNode").addEventListener("click", addAnotherNode);
//
//    // Autolayout button
//    document.getElementById("autolayout").addEventListener("click", function() {
//        editor.triggerAutolayout();
//    });

    // Resize to fill window and also have explicit w/h attributes
    var resize = function() {
        fmx.editor.setAttribute("width", window.innerWidth);
        fmx.editor.setAttribute("height", window.innerHeight);
    };
    window.addEventListener("resize", resize);

    resize();
});
