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
    fmx.editor.graph.name = newName;
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
        console.log(keys.length + " tasks in doc");
        for (var i = 0; i < keys.length; i++) {
            var gdriveNode = fmx.doc.tasks.get(keys[i]);
            var canvasNode = fmx.editor.graph.getNode(keys[i]);

            if (canvasNode === null) {
                console.log('addNode: ' + keys[i]);
                fmx.editor.graph.addNode(keys[i], gdriveNode.component, gdriveNode.metadata);
            } else {
                console.log('updateNode: ' + keys[i]);
                console.log(gdriveNode.metadata);
                console.log(canvasNode.metadata);
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
                    console.log('removeNode: ' + key);
                    fmx.editor.graph.removeNode(key);
                }
            }
        }
    }



    {
        var keys = fmx.doc.flows.keys();
        console.log(keys.length + " flows in doc");
        console.log("keys:");
        console.log(keys);
        for (var i = 0; i < keys.length; i++) {
            var flow = fmx.doc.flows.get(keys[i]);
            console.log("flow:");
            console.log(flow);
            var metadata = flow.metadata ? flow.metadata : {};
            if (flow.data !== void 0) {
                if (typeof flow.to.index === 'number') {
                    fmx.editor.graph.addInitialIndex(flow.data, flow.to.node, flow.to.port.toLowerCase(), flow.to.index, metadata);
                }
                fmx.editor.graph.addInitial(flow.data, flow.to.node, flow.to.port.toLowerCase(), metadata);
                continue;
            }
//            if (typeof flow.from.index === 'number' || typeof flow.to.index === 'number') {
//                fmx.editor.graph.addEdgeIndex(flow.from.node, flow.from.port.toLowerCase(), flow.from.index, flow.to.node, flow.to.port.toLowerCase(), flow.to.index, metadata);
//                continue;
//            }
            fmx.editor.graph.addEdge(flow.from.node, flow.from.port, flow.to.node, flow.to.port, metadata);
        }
        //if true, means there are flows have been deleted
        if (fmx.editor.graph.edges.length > keys.length) {
            console.log("some flow has been deleted");
            for (var i = 0; i < fmx.editor.graph.edges.length; i++) {
                var canvasFlow = fmx.editor.graph.edges[i];
                console.log(canvasFlow);
                var canvasFlowId = (canvasFlow.from.node + '_' + canvasFlow.from.port + '_' + canvasFlow.to.node + '_' + canvasFlow.to.port).toLowerCase();
                
                if (!fmx.doc.flows.has(canvasFlowId)) {
                    console.log('removeFlow: ' + canvasFlowId);
                    fmx.editor.graph.removeEdge(canvasFlow.from.node, canvasFlow.from.port, canvasFlow.to.node, canvasFlow.to.port);
                }
            }
        }
    }

//    var jsonGraph = {
//        "properties": {},
//        "inports": {},
//        "outports": {},
//        "groups": [],
//        "nodees": tasks,
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
    fmx.editor.graph.name = fmx.doc.name;
};

fmx.generateXML = function() {
    console.log('in fmx.generateXML()');
    var graphJSON = document.getElementById("editor").nofloGraph.toJSON();
    console.log(graphJSON);
    var jsonObj1 = {
        Flow: {
            _name: graphJSON.properties.name,
            Annotation: [{
                    "_name": "description",
                    "_svalue": "description of the flow"
                }],
            Task: [],
            EventFlow: [],
            TaskFlow: []
        }
    };

    {
        var i = 0;
        for (var taskId in graphJSON.tasks) {
            if (graphJSON.tasks.hasOwnProperty(taskId)) {
                jsonObj1.Flow.Task[i] = {
                    _name: graphJSON.tasks[taskId].metadata.label,
                    _description: graphJSON.tasks[taskId].metadata.description, //should be metadata.description
                    _taskId: taskId,
                    EventData: {
                        _type: graphJSON.tasks[taskId].metadata.inports[0].type.label,
                        _access: graphJSON.tasks[taskId].metadata.inports[0].access
                    },
                    TaskOutput: []
                };

                for (var j = 0, l = graphJSON.tasks[taskId].component.outports.length; j < l; j++) {
                    var outport = graphJSON.tasks[taskId].component.outports[j];
                    jsonObj1.Flow.Task[i].TaskOutput.push({
                        _name: outport.name,
                        EventData: {
                            _type: outport.type.label,
                            _access: outport.access
                        }
                    });
                }

                i++;
            }
        }
    }

    {
        var i = 0;
        for (var flowId in graphJSON.flows) {
            if (graphJSON.flows.hasOwnProperty(flowId)) {
                console.log(graphJSON.flows[flowId]);
                var flowName = (graphJSON.flows[flowId].metadata || {}).label || '';
                var flowDescription = (graphJSON.flows[flowId].metadata || {}).description || '';
                jsonObj1.Flow.TaskFlow[i] = {
                    _name: flowName,
                    _description: flowDescription,
                    _flowId: flowId
                };
                i++;
            }
        }
    }
    var x2js = new X2JS();
    var xmlAsStr = x2js.json2xml_str(jsonObj1);
    return vkbeautify.xml(xmlAsStr);
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
