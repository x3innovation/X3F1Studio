"use strict";

var ball = ball || {};

ball.DMX_TYPE ='data';
ball.FMX_TYPE ='flow';
ball.DMXE_TYPE ='enum';

ball.DMX_MIMETYPE = 'application/dmx';
ball.DMXE_MIMETYPE = 'application/dmxe';
ball.FMX_MIMETYPE = 'application/fmx';
ball.PROJECT_MIMETYPE = 'application/f1.project';
ball.FOLDER_MIMETYPE = 'application/vnd.google-apps.folder';

ball.DMX_MODEL = 'data';
ball.DMXE_MODEL = 'enum';
ball.FMX_MODEL = 'flow';
ball.F1_MODEL = 'f1';

ball.DMX_DEFAULTNAME = 'NewData';
ball.DMXE_DEFAULTNAME = 'NewEnum';
ball.FMX_DEFAULTNAME = 'NewFlow';
ball.PROJECT_DEFAULTNAME = 'NewProject';

ball.DMX_HTM = './dmx.htm';
ball.DMXE_HTM = './dmxe.htm';
ball.FMX_HTM = './fmx.htm';
ball.F1_HTM = './f1.htm';

ball.APP_ID = "serene-vim-452";
ball.CLIENT_ID = "924032194879-rvf4u88b7tg9fimtha2fg1gbunpm964r.apps.googleusercontent.com";

ball.projectFile = null;
ball.projectFolder = null;
ball.user = null;

ball.f1Model = function() {
};

ball.f1Model.prototype.initialize = function() {
    this.version = 1;
    this.nextId = 0;
};

ball.f1Registered = false;
ball.registerF1 = function() {
    console.log("in ball.registerF1");
    if (ball.f1Registered) {
        console.log("F1 is already registered. Do nothing");
        return;
    } else {
        ball.f1Registered = true;
    }
    var custom = gapi.drive.realtime.custom;
    custom.registerType(ball.f1Model, ball.F1_MODEL);
    ball.f1Model.prototype.version = custom.collaborativeField('version');
    ball.f1Model.prototype.nextId = custom.collaborativeField('nextId');
    ball.f1Model.prototype.announcement = custom.collaborativeField('announcement');
    custom.setInitializer(ball.f1Model, ball.f1Model.prototype.initialize);
};

ball.f1ModelUpgrade = function(rtDoc) {
    var f1Doc = rtDoc.getModel().getRoot().get(ball.F1_MODEL);
    if (f1Doc.version == null) {
        f1Doc.version = 1;
    }
    if (f1Doc.nextId == null) {
        f1Doc.nextId = 10;
    }
    if (f1Doc.announcement == null) {
        f1Doc.announcement = rtDoc.getModel().createList();
    }
};

ball.getF1Model = function(F1FileId, callback) {
    var f1Doc;
    var onFileLoaded = function(rtDoc) {
        console.log("in ball.getF1Model .. onFileLoaded");
        f1Doc = rtDoc.getModel().getRoot().get(ball.F1_MODEL);

        ball.f1ModelUpgrade(rtDoc);

        console.log("f1Doc.version:");
        console.log(f1Doc.version);
        console.log("f1Doc.nextId:");
        console.log(f1Doc.nextId);
        callback(f1Doc);
    };
    var initializeModel = function(model) {
        console.log("init model");
        var field = model.create(ball.f1Model);
        field.announcement = model.createList();
        model.getRoot().set(ball.F1_MODEL, field);
    };

    ball.registerF1();
    gapi.drive.realtime.load(F1FileId, onFileLoaded, initializeModel, dog.handleErrors);
};

var renameFileAnnouncement = {
    action: 'renameFile',
    fileType: 'dmxe',
    fileId: '(#@*$@#',
    fileNewName: 'NewData1'
};


var addFileAnnouncement = {
    action: 'addFile',
    fileType: 'dmxe',
    fileId: '(#@*$@#',
    fileName: 'NewData1'
};

var delFileAnnouncement = {
    action: 'delFile',
    fileType: 'dmxe',
    fileId: '(#@*$@#'
};

var addDMXEAttributeAnnouncement = {
    action: 'addDMXEAttribute',
    fileType: 'dmxe',
    fileId: '(#@*$@#',
    fileName: 'NewData1',
    fieldName: 'someField'
};

var updateDMXEAttributeAnnouncement = {
    action: 'updateDMXEAttribute',
    fileType: 'dmxe',
    fileId: '(#@*$@#',
    fileName: 'NewData1',
    fieldName: 'someField'
};

var delDMXEAttributeAnnouncement = {
    action: 'delDMXEAttribute',
    fileType: 'dmxe',
    fileId: '(#@*$@#',
    fileName: 'NewData1',
    fieldName: 'someField'
};

ball.announce = function(f1Doc, announcement) {
    f1Doc.announcement.clear();
    f1Doc.announcement.push(announcement);
};

ball.registerAnnouncement = function(f1Doc, callback) {
    console.log("ball.registerAnnouncement");
    f1Doc.announcement.addEventListener(gapi.drive.realtime.EventType.VALUES_ADDED, callback);
};

ball.getNextId = function(projectFileId, callback, step) {
    step = (typeof step !== 'undefined') ? step : 1;
    console.log("step: " + step);

    ball.getF1Model(projectFileId, function(f1Doc) {
        if (typeof f1Doc.nextId === 'undefined') {
            f1Doc.nextId = 0;
        }
        var thisId = f1Doc.nextId;
        f1Doc.nextId = f1Doc.nextId + step;
        callback(thisId);
    });
};

ball.dmxeModel = function() {
};

ball.dmxeModel.prototype.initialize = function() {
    this.version = 1;
};

ball.dmxeRegistered = false;
ball.registerDMXE = function() {
    console.log("in ball.registerDMXE");
    if (ball.dmxeRegistered) {
        console.log("DMXE is already registered. Do nothing");
        return;
    } else {
        ball.dmxeRegistered = true;
    }
    var custom = gapi.drive.realtime.custom;
    custom.registerType(ball.dmxeModel, ball.DMXE_MODEL);
    ball.dmxeModel.prototype.version = custom.collaborativeField('version');
    ball.dmxeModel.prototype.id = custom.collaborativeField('id');
    ball.dmxeModel.prototype.name = custom.collaborativeField('name');
    ball.dmxeModel.prototype.description = custom.collaborativeField('description');
    ball.dmxeModel.prototype.attributes = custom.collaborativeField('attributes');
    custom.setInitializer(ball.dmxeModel, ball.dmxeModel.prototype.initialize);
};

ball.dmxeModelUpgrade = function(doc) {
    console.log("in ball.dmxeModelUpgrade()");
    if (doc.version == null) {
        doc.version = 1;
    }
    if (doc.id == null) {
        doc.id = -1;
    }
};

ball.getDMXEModel = function(enumFileId, callback) {

    var dmxeDoc;
    var onFileLoaded = function(rtDoc) {
        dmxeDoc = rtDoc.getModel().getRoot().get(ball.DMXE_MODEL);

        //ball.dmxeModelUpgrade(dmxeDoc);

        callback(dmxeDoc);
    };
    var initializeModel = function(model) {
        console.log("init model");
        var field = model.create(ball.dmxeModel);
        model.getRoot().set(ball.DMXE_MODEL, field);
    };

    ball.registerDMXE();
    gapi.drive.realtime.load(enumFileId, onFileLoaded, initializeModel, dog.handleErrors);
};

ball.dmxModel = function() {
};

ball.dmxModel.prototype.initialize = function() {
    this.version = 1;
};

ball.dmxRegistered = false;
ball.registerDMX = function() {
    console.log("in ball.registerDMX");
    if (ball.dmxRegistered) {
        console.log("DMX is already registered. Do nothing");
        return;
    } else {
        ball.dmxRegistered = true;
    }
    var custom = gapi.drive.realtime.custom;
    custom.registerType(ball.dmxModel, ball.DMX_MODEL);
    ball.dmxModel.prototype.version = custom.collaborativeField('version');
    ball.dmxModel.prototype.id = custom.collaborativeField('id');
    ball.dmxModel.prototype.name = custom.collaborativeField('name');
    ball.dmxModel.prototype.type = custom.collaborativeField('type');
    ball.dmxModel.prototype.description = custom.collaborativeField('description');
    ball.dmxModel.prototype.attributes = custom.collaborativeField('attributes');
    ball.dmxModel.prototype.UpdatePersistenceEventTypeId = custom.collaborativeField('UpdatePersistenceEventTypeId');
    ball.dmxModel.prototype.CreatePersistenceEventTypeId = custom.collaborativeField('CreatePersistenceEventTypeId');
    ball.dmxModel.prototype.RemovePersistenceEventTypeId = custom.collaborativeField('RemovePersistenceEventTypeId');
    ball.dmxModel.prototype.UpdatedPersistenceEventTypeId = custom.collaborativeField('UpdatedPersistenceEventTypeId');
    ball.dmxModel.prototype.CreatedPersistenceEventTypeId = custom.collaborativeField('CreatedPersistenceEventTypeId');
    ball.dmxModel.prototype.RemovedPersistenceEventTypeId = custom.collaborativeField('RemovedPersistenceEventTypeId');
    ball.dmxModel.prototype.RejectUpdatePersistenceEventTypeId = custom.collaborativeField('RejectUpdatePersistenceEventTypeId');
    ball.dmxModel.prototype.RejectCreatePersistenceEventTypeId = custom.collaborativeField('RejectCreatePersistenceEventTypeId');
    ball.dmxModel.prototype.RejectRemovePersistenceEventTypeId = custom.collaborativeField('RejectRemovePersistenceEventTypeId');
    custom.setInitializer(ball.dmxModel, ball.dmxModel.prototype.initialize);
};

ball.dmxModelUpgrade = function(doc) {
    console.log("in ball.dmxModelUpgrade()");
    if (doc.version == null) {
        doc.version = 1;
    }
    if (doc.id == null) {
        doc.id = -1;
    }
    //doc.type = "persisted";
};

ball.getDMXModel = function(dataFileId, callback) {
    var dmxDoc;
    var onFileLoaded = function(rtDoc) {
        dmxDoc = rtDoc.getModel().getRoot().get(ball.DMX_MODEL);

        //ball.dmxModelUpgrade(dmxDoc);

        callback(dmxDoc);
    };
    var initializeModel = function(model) {
        console.log("init model");
        var field = model.create(ball.dmxModel);
        model.getRoot().set(ball.DMX_MODEL, field);
    };

    ball.registerDMX();
    gapi.drive.realtime.load(dataFileId, onFileLoaded, initializeModel, dog.handleErrors);
};

ball.fmxModel = function() {
};

ball.fmxModel.prototype.initialize = function() {
};

ball.fmxRegistered = false;
ball.registerFMX = function() {
    console.log("in ball.registerFMX");
    if (ball.fmxRegistered) {
        console.log("FMX is already registered. Do nothing");
        return;
    } else {
        ball.fmxRegistered = true;
    }
    var custom = gapi.drive.realtime.custom;
    custom.registerType(ball.fmxModel, ball.FMX_MODEL);
    ball.fmxModel.prototype.version = custom.collaborativeField('version');
    ball.fmxModel.prototype.id = custom.collaborativeField('id');
    ball.fmxModel.prototype.name = custom.collaborativeField('name');
    ball.fmxModel.prototype.description = custom.collaborativeField('description');
    ball.fmxModel.prototype.tasks = custom.collaborativeField('tasks');
    ball.fmxModel.prototype.flows = custom.collaborativeField('flows');
    custom.setInitializer(ball.fmxModel, ball.fmxModel.prototype.initialize);
};

ball.getFMXModel = function(dataFileId, callback) {
    var fmxDoc;
    var onFileLoaded = function(rtDoc) {
        fmxDoc = rtDoc.getModel().getRoot().get(ball.FMX_MODEL);
        callback(fmxDoc);
    };
    var initializeModel = function(model) {
        console.log("init model");
    };

    ball.registerFMX();
    gapi.drive.realtime.load(dataFileId, onFileLoaded, initializeModel, dog.handleErrors);
};

ball.isFileNamePatternValid = function(name) {
    return /^([A-Za-z])([0-9A-Za-z])*$/.test(name);
};

ball.isVariableNamePatternValid = function(name) {
    return /^([A-Za-z_])([0-9A-Za-z_])*$/.test(name);
};
