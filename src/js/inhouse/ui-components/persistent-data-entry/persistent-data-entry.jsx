var Body=require('./body.jsx');
var Header=require('./header.jsx');
var EventType=require('../../constants/event-type.js');
var userStore = require('../../stores/user-store.js');
var googleDriveService = require('../../services/google-drive-service.js');
var GCons = require('../../constants/google-drive-constants.js');
//var UserLoginFailRedirectHome = require('../common/user-login-fail-redirect-home.jsx');

module.exports=React.createClass({
    mixins: [Navigation, Router.State],
	/* ******************************************
                LIFE CYCLE FUNCTIONS
    ****************************************** */
    componentWillMount: function() {
    	this.model={};
    	this.model.title='sample title';
    	this.model.description='sample description';
    	this.model.attributes=['unreasonablylongattributename','a','b','c'];

        // load project objects on user logged in
        Bullet.on(EventType.App.USER_LOGGED_IN, 'persistent-data-entry.jsx>>userLoggedIn', this.initialize);
        // if user is already logged in, still need to initialize
        if (userStore.isLoggedIn)
        {
            this.initialize();
        }
    },
    
    componentDidMount: function() {
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
        var customModel = model.create(googleDriveService.getPersistentDataModel());
        customModel.title = 'New Persistent Data';
        customModel.description = '';
        model.getRoot().set(GCons.CustomObjectKey.PERSISTENT_DATA, customModel);
    },

    render: function() {
		return(
			<div id='persistent-data-form-container' className='container'>
				<PersistentDataHeader title={this.model.title} description={this.model.description} />
				<PersistentDataBody attributes={this.model.attributes} />
			</div>
		);
	}
}); 