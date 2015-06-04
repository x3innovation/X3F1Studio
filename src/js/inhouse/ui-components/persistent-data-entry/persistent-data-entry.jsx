var Body=require('./body.jsx');
var Header=require('./header.jsx');
var EventType=require('../../constants/event-type.js');
var userStore = require('../../stores/user-store.js');
var defaultValueCons = require('../../constants/default-value-constants.js');
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
    	this.model.fields=
        [
            {
                name: 'unreasonablylongfieldname',
                type: 'double',
                minValue: 13.2,
                maxValue: 14.3,
                description: 'a double',
                contextId: true
            },
            {
                name: 'z',
                type: 'string',
                length: 13,
                defaultValue: "potato" 
            },
            {name: 'z2'},
            {name: 'a'}, 
            {name: 'b'}, 
            {name: 'c'}
        ];

        // load project objects on user logged in
        Bullet.on(EventType.App.USER_LOGGED_IN, 'persistent-data-entry.jsx>>userLoggedIn', this.initialize);
    },
    
    componentDidMount: function() {
        // if user is already logged in, still need to initialize
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

        customModel.title = defaultValueCons.NewFileValues.PERSISTENT_DATA_TITLE;
        customModel.description = defaultValueCons.NewFileValues.PERSISTENT_DATA_DESCRIPTION;
        customModel.fields=model.createList();
        //customModel.fields = model.createList([{name: 'unreasonablylongfieldname'},{name: 'a'}, {name: 'b'}, {name: 'c'}]);
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
				<Body fields={this.model.fields} />
			</div>
		);
	}
}); 