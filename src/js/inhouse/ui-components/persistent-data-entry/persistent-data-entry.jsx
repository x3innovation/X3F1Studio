var Body=require('./body.jsx');
var Header=require('./header.jsx');
var EventType=require('../../constants/event-type.js');
var userStore=require('../../stores/user-store.js');
var DefaultValueCons=require('../../constants/default-value-constants.js');
var googleDriveService=require('../../services/google-drive-service.js');
var GCons=require('../../constants/google-drive-constants.js');
var UserLoginFailRedirectHome=require('../common/user-login-fail-redirect-home.jsx');

module.exports=React.createClass({
    mixins: [Navigation, State, UserLoginFailRedirectHome],
	/* ******************************************
                LIFE CYCLE FUNCTIONS
    ****************************************** */
    componentWillMount: function() {
        // load project objects on user logged in
        Bullet.on(EventType.App.USER_LOGGED_IN, 'persistent-data-entry.jsx>>userLoggedIn', this.initialize);
    },

    componentDidMount: function() {
        // if user is already logged in, just initialize
        if (userStore.isLoggedIn) {
            this.initialize();
        }
    
        Bullet.on(EventType.PersistentDataEntry.TITLE_CHANGED, 'persistent-data-entry.jsx>>titleChanged', this.onTitleChange);
        Bullet.on(EventType.PersistentDataEntry.GET_REF_NAMES, 'persistent-data-entry.jsx>>getRefNames', this.getRefNames);
    },

    componentWillUnmount: function() {
        Bullet.off(EventType.App.USER_LOGGED_IN, 'persistent-data-entry.jsx>>userLoggedIn');
        Bullet.off(EventType.PersistentDataEntry.TITLE_CHANGED, 'persistent-data-entry.jsx>>titleChanged');
        Bullet.off(EventType.PersistentDataEntry.GET_REF_NAMES, 'persistent-data-entry.jsx>>getRefNames');
    },

	/* ******************************************
               NON LIFE CYCLE FUNCTIONS
    ****************************************** */
    initialize: function()
    {
        gapi.drive.realtime.load(this.getParams().persistentDataFileId, this.onDataFileLoaded, this.initializeModel);
    },

    onDataFileLoaded: function(doc) {
        var gModel=doc.getModel().getRoot().get(GCons.CustomObjectKey.PERSISTENT_DATA);
        if (!gModel) { //if the model was not initialized properly, reinitialize
            this.initializeModel(doc.getModel());
        }
        Bullet.trigger(EventType.PersistentDataEntry.GAPI_FILE_LOADED, doc);
    },

    initializeModel: function(model)
    {
        var gModel=model.create(GCons.CustomObjectKey.PERSISTENT_DATA);

        gModel.title=DefaultValueCons.NewFileValues.PERSISTENT_DATA_TITLE;
        gModel.description=DefaultValueCons.NewFileValues.PERSISTENT_DATA_DESCRIPTION;
        gModel.fields=model.createList();
        googleDriveService.getMetadataModelId(this.getParams().projectFileId, function(id) {
            gModel.id=id;
            gModel.UpdatePersistenceEventTypeId=++id;
            gModel.CreatePersistenceEventTypeId=++id;
            gModel.RemovePersistenceEventTypeId=++id;
            gModel.UpdatedPersistenceEventTypeId=++id;
            gModel.CreatedPersistenceEventTypeId=++id;
            gModel.RemovedPersistenceEventTypeId=++id;
            gModel.RejectedUpdatePersistenceEventTypeId=++id;
            gModel.RejectedCreatePersistenceEventTypeId=++id;
            gModel.RejectedRemovePersistenceEventTypeId=++id;
        }, 11);

        model.getRoot().set(GCons.CustomObjectKey.PERSISTENT_DATA, gModel);
    },

    getRefNames: function() {
        googleDriveService.getProjectObjects(
            this.getParams().projectFolderFileId, 
            "",true,false,true,false, //only load persistent data and event data
            this.saveDataObjectNames);
    },

    saveDataObjectNames: function(dataObjects) {
        var dataObjectNames=dataObjects.map(function(dataObj) {
            dataObj.title;
        });
    },

    onTitleChange: function() {
        clearTimeout(this.saveTitleTimeout);
        this.saveTitleTimeout = setTimeout(this.saveTitle, 500);
    },

    saveTitle: function() {
        var title=$('#header-title').val();
        googleDriveService.saveFileTitle(this.getParams().persistentDataFileId, title)
    },

    onToProjectBtnClick: function(e) {
        var params={};
        params.projectFileId=this.getParams().projectFileId;
        params.projectFolderFileId=this.getParams().projectFolderFileId;
        this.transitionTo('project', params);
    },

    render: function() {
		return(
			<div id='persistent-data-form-container' className='container'>
                <i id="to-project-btn" className='medium mdi-navigation-arrow-back' onClick={this.onToProjectBtnClick}></i>
				<Header />
				<Body />
			</div>
		);
	}
}); 