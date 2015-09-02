var EventType = require('../../constants/event-type.js');
var GDriveConstants = require('../../constants/google-drive-constants.js');
var DefaultValueConstants = require('../../constants/default-value-constants.js');
var ObjectTypes = GDriveConstants.ObjectType;

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
		if (UserStore.isLoggedIn) {
			// if user is already logged in, just initialize
			this.initialize();
		}

		this.fileType = this.getQuery().fileType;

		var gapiKeyMap = {};
		gapiKeyMap[ObjectTypes.PERSISTENT_DATA] = GDriveConstants.CustomObjectKey.PERSISTENT_DATA;
		gapiKeyMap[ObjectTypes.ENUM] = GDriveConstants.CustomObjectKey.ENUM;
		gapiKeyMap[ObjectTypes.EVENT] = GDriveConstants.CustomObjectKey.EVENT;
		gapiKeyMap[ObjectTypes.SNIPPET] = GDriveConstants.CustomObjectKey.SNIPPET;
		/* TO ADD similar for flows and any other data types to use */

		this.gapiKey = gapiKeyMap[this.fileType];

		// load project objects on user logged in
		Bullet.on(EventType.App.USER_LOGGED_IN, 'entry.jsx>>userLoggedIn', this.initialize);
	},

	componentDidMount: function() {
		var PageTitleCons = DefaultValueConstants.PageTitleValues;
		var pageTitleMap = {};
		pageTitleMap[ObjectTypes.PERSISTENT_DATA] = PageTitleCons.PERSISTENT_DATA_FORM_PAGE_TITLE;
		pageTitleMap[ObjectTypes.ENUM] = PageTitleCons.ENUM_FORM_PAGE_TITLE;
		pageTitleMap[ObjectTypes.EVENT] = PageTitleCons.EVENT_FORM_PAGE_TITLE;
		pageTitleMap[ObjectTypes.SNIPPET] = PageTitleCons.SNIPPET_FORM_PAGE_TITLE;
		/* TO ADD similar for flows and any other data types to use */

		var pageTitle = pageTitleMap[this.fileType];
		Bullet.trigger(EventType.App.PAGE_CHANGE, {title: pageTitle});
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
		var gModel = doc.getModel().getRoot().get(this.gapiKey);
		if (!gModel.creatingUser) {
			this.setCreatingUserData(gModel, function() {
				Bullet.trigger(EventType.EntryForm.GAPI_FILE_LOADED, doc);
			});
		} else {
			Bullet.trigger(EventType.EntryForm.GAPI_FILE_LOADED, doc);
		}
	},

	initializeModel: function(model) {
		var gModel = model.create(this.gapiKey);
		model.getRoot().set(this.gapiKey, gModel);

		switch (this.fileType) {
			case ObjectTypes.PERSISTENT_DATA:
				gModel.title = model.createString(DefaultValueConstants.NewFileValues.PERSISTENT_DATA_TITLE);
				gModel.description = model.createString(DefaultValueConstants.NewFileValues.PERSISTENT_DATA_DESCRIPTION);
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
				break;
			case ObjectTypes.EVENT:
				gModel.title = model.createString(DefaultValueConstants.NewFileValues.EVENT_TITLE);
				gModel.description = model.createString(DefaultValueConstants.NewFileValues.EVENT_DESCRIPTION);
				gModel.fields = model.createList();
				gModel.queries = model.createList();
				GDriveService.getMetadataModelId(this.getParams().projectFileId, function(id) {
					var thisId = id;
					gModel.id = thisId;
				}, 1);
				break;
			case ObjectTypes.SNIPPET:
				gModel.title = model.createString(DefaultValueConstants.NewFileValues.SNIPPET_TITLE);
				gModel.description = model.createString(DefaultValueConstants.NewFileValues.SNIPPET_DESCRIPTION);
				gModel.fields = model.createList();
				GDriveService.getMetadataModelId(this.getParams().projectFileId, function(id) {
					var thisId = id;
					gModel.id = thisId;
				}, 1);
				break;
			case ObjectTypes.ENUM:
				gModel.title = model.createString(DefaultValueConstants.NewFileValues.ENUM_TITLE);
				gModel.description = model.createString(DefaultValueConstants.NewFileValues.ENUM_DESCRIPTION);
				gModel.fields = model.createList();
				GDriveService.getMetadataModelId(this.getParams().projectFileId, function(id) {
					var thisId = id;
					gModel.id = thisId;
				}, 1);
				break;
			default: break;
		}
		this.setCreatingUserData(gModel);
	},

	setCreatingUserData: function(gModel, callback) {
		GDriveService.getFileMetadata(this.getParams().fileId, function(respData) {
			gModel.createdDate = respData.createdDate;
			gModel.creatingUser = {
				name: respData.owners[0].displayName,
				userId: respData.owners[0].permissionId
			};

			if (typeof callback === 'function') {
				callback();
			}
		});
	},

	onToProjectBtnClick: function() {
		if ($('.body-wrapper').find('.invalid-input').length) { //form wasn't properly filled in, so don't navigate away
			return;
		}
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
		var fileType = this.fileType;
		var gapiKey = this.gapiKey;
		return (
			<div id = 'form-container' className = 'persistent-data-form container'>
				<i id = "to-project-btn" className = 'medium mdi-navigation-arrow-back' onClick = {this.onToProjectBtnClick} />
				<Header
					projectFileId = {projectFileId} projectFolderFileId = {projectFolderFileId}
					fileId = {fileId} fileType = {fileType} gapiKey = {gapiKey} />
				<Body
					projectFileId = {projectFileId} projectFolderFileId = {projectFolderFileId}
					fileId = {fileId} fileType = {fileType} gapiKey = {gapiKey} />
			</div>
		);
	}
});
