var EventType = require('../../constants/event-type.js');
var GDriveConstants = require('../../constants/google-drive-constants.js');
var DefaultValueConstants = require('../../constants/default-value-constants.js');
var ObjectTypes = GDriveConstants.ObjectType;

var UserLoginFailRedirectHome = require('../common/user-login-fail-redirect-home.jsx');
var UserStore = require('../../stores/user-store.js');
var GDriveService = require('../../services/google-drive-service.js');

// var Body = require('./body.jsx');
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
		this.objectFileId = this.getParams().fileId;
		this.controller = new Controller(this.objectFileType, projectFileId, this.objectFileId);

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
		var _this = this;
		this.controller.initialize(onInitializeFinished);

		function onInitializeFinished(gMetadataModel, gModel)
		{
			_this.editor = 	<div>
								<Header gMetadataModel={gMetadataModel}
									gModel={gModel}
									objectFileId={_this.objectFileId}
									objectFileType={_this.objectFileType} />
								<Body controller={_this.controller} />								
							</div>

			_this.forceUpdate();
		}
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
		return (
			<div id = 'form-container' className = 'persistent-data-form container'>
				<i id = "to-project-btn" className = 'medium mdi-navigation-arrow-back' onClick = {this.onToProjectBtnClick} />
				{this.editor}
			</div>
		);
	}
});
