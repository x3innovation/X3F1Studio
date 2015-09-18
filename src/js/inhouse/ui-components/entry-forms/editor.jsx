var EventType = require('../../constants/event-type.js');
var GDriveConstants = require('../../constants/google-drive-constants.js');
var DefaultValueConstants = require('../../constants/default-value-constants.js');
var ObjectTypes = GDriveConstants.ObjectType;

var UserLoginFailRedirectHome = require('../common/user-login-fail-redirect-home.jsx');
var UserStore = require('../../stores/user-store.js');
var GDriveService = require('../../services/google-drive-service.js');

var Body = require('./body.jsx');
var Header = require('./header.jsx');

var Controller = require('./editor-controller.js');

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

		var fileType = this.getQuery().fileType;
		var projectFileId = this.getParams().projectFileId;
		var objectFileId = this.getParams().fileId;
		this.controller = new Controller(fileType, projectFileId, objectFileId);

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

		function onInitializeFinished()
		{
			_this.editor = 	<div>
								<Header controller={_this.controller} />
								<Body controller={_this.controller} />
							</div>
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
		var projectFileId = this.getParams().projectFileId;
		var projectFolderFileId = this.getParams().projectFolderFileId;
		var fileId = this.getParams().fileId;
		var fileType = this.fileType;
		var gapiKey = this.gapiKey;
		return (
			<div id = 'form-container' className = 'persistent-data-form container'>
				<i id = "to-project-btn" className = 'medium mdi-navigation-arrow-back' onClick = {this.onToProjectBtnClick} />
				{this.editor}
			</div>
		);
	}
});
