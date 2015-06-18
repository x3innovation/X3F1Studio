var Body=require('./body.jsx');
var Header=require('./header.jsx');
var EventType=require('../../constants/event-type.js');
var userStore=require('../../stores/user-store.js');
var DefaultValueConstants=require('../../constants/default-value-constants.js');
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
	}, 

	componentWillUnmount: function() {
		Bullet.off(EventType.App.USER_LOGGED_IN, 'persistent-data-entry.jsx>>userLoggedIn');
	}, 

	/* ******************************************
				NON LIFE CYCLE FUNCTIONS
	****************************************** */
	initialize: function()
	{
		googleDriveService.getMetadataModel(this.getParams().projectFileId, this.onMetadataModelLoaded);
		gapi.drive.realtime.load(this.getParams().persistentDataFileId, this.onDataFileLoaded, this.initializeModel);
	}, 

	onMetadataModelLoaded: function(metadataModel) {
		Bullet.trigger(EventType.PersistentDataEntry.METADATA_MODEL_LOADED, metadataModel);
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

		model.getRoot().set(GCons.CustomObjectKey.PERSISTENT_DATA, gModel);
		gModel.title=DefaultValueConstants.NewFileValues.PERSISTENT_DATA_TITLE;
		gModel.description=DefaultValueConstants.NewFileValues.PERSISTENT_DATA_DESCRIPTION;
		gModel.fields=model.createList();
		googleDriveService.getMetadataModelId(this.getParams().projectFileId, function(id) {
			var thisId=id;
			gModel.id=thisId;
			gModel.UpdatePersistenceEventTypeId=++thisId;
			gModel.CreatePersistenceEventTypeId=++thisId;
			gModel.RemovePersistenceEventTypeId=++thisId;
			gModel.UpdatedPersistenceEventTypeId=++thisId;
			gModel.CreatedPersistenceEventTypeId=++thisId;
			gModel.RemovedPersistenceEventTypeId=++thisId;
			gModel.RejectedUpdatePersistenceEventTypeId=++thisId;
			gModel.RejectedCreatePersistenceEventTypeId=++thisId;
			gModel.RejectedRemovePersistenceEventTypeId=++thisId;
		}, 11);

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
				<Header projectFileId={this.getParams().projectFileId} 
						projectFolderFileId={this.getParams().projectFolderFileId}
						fileId={this.getParams().persistentDataFileId}/>
				<Body projectFileId={this.getParams().projectFileId} 
						projectFolderFileId={this.getParams().projectFolderFileId}
						fileId={this.getParams().persistentDataFileId}/>
			</div>
		);
	}
}); 
