var EventType = require('../../../constants/event-type.js');
var GDriveConstants = require('../../../constants/google-drive-constants.js');
var DefaultValueConstants = require('../../../constants/default-value-constants.js');

var UserLoginFailRedirectHome = require('../../common/user-login-fail-redirect-home.jsx');
var UserStore = require('../../../stores/user-store.js');
var GDriveService = require('../../../services/google-drive-service.js');

var Body = require('./body.jsx');
var Header = require('../header.jsx');
var XMLModal = require('../xml-modal.jsx');

module.exports = React.createClass({
	mixins: [Navigation, State, UserLoginFailRedirectHome],
	/* ******************************************
	            LIFE CYCLE FUNCTIONS
	****************************************** */
	componentWillMount: function() {
		this.xmlData = null;

		if (UserStore.isLoggedIn) {
			// if user is already logged in, just initialize
			this.initialize();
		}

		// load project objects on user logged in
		Bullet.on(EventType.App.USER_LOGGED_IN, 'entry.jsx>>userLoggedIn', this.initialize);
	},

	componentWillUnmount: function() {
		Bullet.off(EventType.App.USER_LOGGED_IN, 'entry.jsx>>userLoggedIn');
	},

	/* ******************************************
	            NON LIFE CYCLE FUNCTIONS
	****************************************** */
	initialize: function()
	{
		GDriveService.getMetadataModel(this.getParams().projectFileId, this.onMetadataModelLoaded);
		gapi.drive.realtime.load(this.getParams().fileId, this.onDataFileLoaded, this.initializeModel);
	},

	onMetadataModelLoaded: function(metadataModel) {
		Bullet.trigger(EventType.EntryForm.METADATA_MODEL_LOADED, metadataModel);
	},

	onDataFileLoaded: function(doc) {
		var gModel = doc.getModel().getRoot().get(GDriveConstants.CustomObjectKey.SNIPPET);
		if (!gModel) { //if the model was not initialized properly, reinitialize
			this.initializeModel(doc.getModel());
			this.onDataFileLoaded(doc);
		} else {
			Bullet.trigger(EventType.EntryForm.GAPI_FILE_LOADED, doc);
		}
	},

	initializeModel: function(model)
	{
		var gModel = model.create(GDriveConstants.CustomObjectKey.SNIPPET);

		model.getRoot().set(GDriveConstants.CustomObjectKey.SNIPPET, gModel);
		gModel.title = model.createString(DefaultValueConstants.NewFileValues.SNIPPET_TITLE);
		gModel.description = model.createString(DefaultValueConstants.NewFileValues.SNIPPET_DESCRIPTION);
		gModel.fields = model.createList();
		GDriveService.getMetadataModelId(this.getParams().projectFileId, function(id) {
			var thisId = id;
			gModel.id = thisId;
		}, 1);
	},

	onToProjectBtnClick: function() {
		var params = {
			projectFileId: this.getParams().projectFileId,
			projectFolderFileId: this.getParams().projectFolderFileId
		};
		this.transitionTo('project', params);
	},

	render: function() {
		var projectFileId = this.getParams().projectFileId;
		var projectFolderFileId = this.getParams().projectFolderFileId;
		var fileId = this.getParams().fileId;
		var fileType = GDriveConstants.ObjectType.SNIPPET;
		var gapiKey = GDriveConstants.CustomObjectKey.SNIPPET;
		return (
			<div id = 'form-container' className = 'snippet-form container'>
				<i id = "to-project-btn" className = 'medium mdi-navigation-arrow-back' onClick = {this.onToProjectBtnClick} />
				<Header
					projectFileId = {projectFileId} projectFolderFileId = {projectFolderFileId}
					fileId = {fileId} fileType = {fileType} gapiKey = {gapiKey} />
				<Body
					projectFileId = {projectFileId} projectFolderFileId = {projectFolderFileId}
					fileId = {fileId} fileType = {fileType} gapiKey = {gapiKey} />
				<XMLModal 
					projectFileId = {projectFileId} projectFolderFileId = {projectFolderFileId}
					fileType = {fileType} gapiKey = {gapiKey} />
			</div>
		);
	}
});

