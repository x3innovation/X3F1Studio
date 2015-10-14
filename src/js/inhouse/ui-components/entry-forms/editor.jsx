var EventType = require('../../constants/event-type.js');
var GDriveConstants = require('../../constants/google-drive-constants.js');
var DefaultValueConstants = require('../../constants/default-value-constants.js');
var ObjectTypes = GDriveConstants.ObjectType;

var UserLoginFailRedirectHome = require('../common/user-login-fail-redirect-home.jsx');
var UserStore = require('../../stores/user-store.js');
var GDriveUtils = require('../../utils/google-drive-utils.js');

var Body = require('./body.jsx');
var Header = require('./header.jsx');

var Controller = require('./editor-controller.js');

module.exports = React.createClass({
	mixins: [Navigation, State, UserLoginFailRedirectHome],
	/* ******************************************
	            LIFE CYCLE FUNCTIONS
	****************************************** */ 
	componentWillMount: function() {
		this.objectFileType = this.getQuery().fileType;
		var projectFileId = this.getParams().projectFileId;
		this.projectFolderFileId = this.getParams().projectFolderFileId;
		this.objectFileId = this.getParams().fileId;
		this.controller = new Controller(this.objectFileType, 
			projectFileId, 
			this.objectFileId,
			this.projectFolderFileId);

		if (UserStore.isLoggedIn) {
			// if user is already logged in, just initialize
			this.initialize();
		}

		// load project objects on user logged in
		Bullet.on(EventType.App.USER_LOGGED_IN, 'entry.jsx>>userLoggedIn', this.initialize);
	},

	componentDidMount: function()
	{
		var pageTitle = this.controller.getPageTitle();
		Bullet.trigger(EventType.App.PAGE_CHANGE, {title: pageTitle});
	},

	componentWillUnmount: function() {
		Bullet.off(EventType.App.USER_LOGGED_IN, 'entry.jsx>>userLoggedIn');
		this.controller.dispose();
	},

	/* ******************************************
	            NON LIFE CYCLE FUNCTIONS
	****************************************** */
	initialize: function()
	{
		var _this = this;
		this.controller.initialize(onInitializeFinished);

		function onInitializeFinished(gMetadataModel, gMetadataCustomObject, gFileCustomObject, gFileModel)
		{
			_this.editor = 	<div>
								<Header gMetadataModel={gMetadataModel}
									gFileCustomObject={gFileCustomObject}
									objectFileId={_this.objectFileId}
									objectFileType={_this.objectFileType}
									gMetadataCustomObject = {gMetadataCustomObject} />
								<Body gFileCustomObject={gFileCustomObject} 
									objectFileType={_this.objectFileType}
									gMetadataModel={gMetadataModel}
									projectFolderFileId={_this.projectFolderFileId}
									objectFileId={_this.objectFileId}
									gFileModel = {gFileModel}
									gMetadataCustomObject = {gMetadataCustomObject} />
							</div>

			_this.forceUpdate();
			$('#to-project-btn').css('display', 'initial');
		}
	},

	onToProjectBtnClick: function() {
		if ($('.body-wrapper').find('.invalid-input').length) { //form wasn't properly filled in, so don't navigate away
			return;
		}
		var params = {
			projectFileId: this.getParams().projectFileId,
			projectFolderFileId: this.projectFolderFileId
		};
		this.transitionTo('project', params);
	},

	render: function() {
		return (
			<div id = 'form-container' className = 'persistent-data-form container'>
				<i id = "to-project-btn"
				   className = 'medium mdi-navigation-arrow-back'
				   style = {{display: 'none'}}
				   onClick = {this.onToProjectBtnClick} />
				{this.editor}
			</div>
		);
	}
});
