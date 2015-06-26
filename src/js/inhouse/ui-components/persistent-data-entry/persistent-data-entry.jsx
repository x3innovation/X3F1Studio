var EventType = require('../../constants/event-type.js');
var GDriveConstants = require('../../constants/google-drive-constants.js');
var DefaultValueConstants = require('../../constants/default-value-constants.js');

var UserLoginFailRedirectHome = require('../common/user-login-fail-redirect-home.jsx');
var UserStore = require('../../stores/user-store.js');
var GDriveService = require('../../services/google-drive-service.js');

var Body = require('./body.jsx');
var Header = require('./header.jsx');

module.exports = React.createClass({
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
		if (UserStore.isLoggedIn) {
			this.initialize();
		}
	}, 

	componentWillUnmount: function() {
		Bullet.off(EventType.App.USER_LOGGED_IN, 'persistent-data-entry.jsx>>userLoggedIn');
	}, 

	/* ******************************************
	            NON LIFE CYCLE FUNCTIONS
	****************************************** */
	initialize: function()
	{
		GDriveService.getMetadataModel(this.getParams().projectFileId, this.onMetadataModelLoaded);
		gapi.drive.realtime.load(this.getParams().persistentDataFileId, this.onDataFileLoaded, this.initializeModel);
	}, 

	onMetadataModelLoaded: function(metadataModel) {
		Bullet.trigger(EventType.PersistentDataEntry.METADATA_MODEL_LOADED, metadataModel);
	}, 

	onDataFileLoaded: function(doc) {
		var gModel = doc.getModel().getRoot().get(GDriveConstants.CustomObjectKey.PERSISTENT_DATA);
		if (!gModel) { //if the model was not initialized properly, reinitialize
			this.initializeModel(doc.getModel());
			this.onDataFileLoaded(doc);
		} else {
			Bullet.trigger(EventType.PersistentDataEntry.GAPI_FILE_LOADED, doc);
		}
	}, 

	initializeModel: function(model)
	{
		var gModel = model.create(GDriveConstants.CustomObjectKey.PERSISTENT_DATA);

		model.getRoot().set(GDriveConstants.CustomObjectKey.PERSISTENT_DATA, gModel);
		gModel.title = DefaultValueConstants.NewFileValues.PERSISTENT_DATA_TITLE;
		gModel.description = DefaultValueConstants.NewFileValues.PERSISTENT_DATA_DESCRIPTION;
		gModel.fields = model.createList();
		gModel.queries = model.createList();
		GDriveService.getMetadataModelId(this.getParams().projectFileId, function(id) {
			var thisId = id;
			gModel.id = thisId;
			gModel.UpdatePersistenceEventTypeId = ++thisId;
			gModel.CreatePersistenceEventTypeId = ++thisId;
			gModel.RemovePersistenceEventTypeId = ++thisId;
			gModel.UpdatedPersistenceEventTypeId = ++thisId;
			gModel.CreatedPersistenceEventTypeId = ++thisId;
			gModel.RemovedPersistenceEventTypeId = ++thisId;
			gModel.RejectedUpdatePersistenceEventTypeId = ++thisId;
			gModel.RejectedCreatePersistenceEventTypeId = ++thisId;
			gModel.RejectedRemovePersistenceEventTypeId = ++thisId;
		}, 11);
	}, 

	onToProjectBtnClick: function(e) {
		var params = {
			projectFileId: this.getParams().projectFileId,
			projectFolderFileId: this.getParams().projectFolderFileId};
		this.transitionTo('project', params);
	}, 

	render: function() {
		var projectFileId = this.getParams().projectFileId; 
		var projectFolderFileId = this.getParams().projectFolderFileId;
		var fileId = this.getParams().persistentDataFileId;
		var fileType = GDriveConstants.ObjectType.PERSISTENT_DATA;
		var gapiKey = GDriveConstants.CustomObjectKey.PERSISTENT_DATA;
		return(
			<div id = 'persistent-data-form-container' className = 'container'>
				<i id = "to-project-btn" className = 'medium mdi-navigation-arrow-back' onClick = {this.onToProjectBtnClick}></i>
				<Header projectFileId = {projectFileId} projectFolderFileId = {projectFolderFileId}
				        fileId = {fileId} fileType = {fileType} gapiKey = {gapiKey} />
				<Body projectFileId = {projectFileId} projectFolderFileId = {projectFolderFileId}
				      fileId = {fileId} fileType = {fileType} gapiKey = {gapiKey} />
			</div>
		);
	}
}); 
