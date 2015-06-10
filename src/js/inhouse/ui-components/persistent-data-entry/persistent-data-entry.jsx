var Body=require('./body.jsx');
var Header=require('./header.jsx');
var EventType=require('../../constants/event-type.js');
var userStore = require('../../stores/user-store.js');
var DefaultValueCons = require('../../constants/default-value-constants.js');
var googleDriveService = require('../../services/google-drive-service.js');
var GCons = require('../../constants/google-drive-constants.js');
var UserLoginFailRedirectHome = require('../common/user-login-fail-redirect-home.jsx');

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
        if (userStore.isLoggedIn)
        {
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
        gapi.drive.realtime.load(this.getParams().persistentDataFileId, this.onDataFileLoaded, this.initializeModel);
    },

    onDataFileLoaded: function(doc) {
        Bullet.trigger(EventType.PersistentDataEntry.GAPI_FILE_LOADED, doc);
    },

    initializeModel: function(model)
    {
        var customModel = model.create(GCons.CustomObjectKey.PERSISTENT_DATA);
        model.getRoot().set(GCons.CustomObjectKey.PERSISTENT_DATA, customModel);

        customModel.title = DefaultValueCons.NewFileValues.PERSISTENT_DATA_TITLE;
        customModel.description = DefaultValueCons.NewFileValues.PERSISTENT_DATA_DESCRIPTION;
        customModel.fields=model.createList();
    },

    onToProjectBtnClick: function(e) {
        var params = {};
        params.projectFileId = this.getParams().projectFileId;
        params.projectFolderFileId = this.getParams().projectFolderFileId;
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