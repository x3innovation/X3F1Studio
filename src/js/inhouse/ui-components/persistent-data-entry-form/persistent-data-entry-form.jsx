var PersistentDataBody=require('./persistent-data-body.jsx');
var PersistentDataHeader=require('./persistent-data-header.jsx');
var EventType=require('../../constants/event-type.js');
var userStore = require('../../stores/user-store.js');
var googleDriveService = require('../../services/google-drive-service.js');
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
        Bullet.on(EventType.App.USER_LOGGED_IN, 'persistent-data-entry-form.jsx>>user-logged-in', this.onUserLoggedIn);
    },
    
    componentDidMount: function() {
    },

    componentWillUnmount: function() {
        Bullet.off(EventType.App.USER_LOGGED_IN, 'persistent-data-entry-form.jsx>>user-logged-in');
    },

	/* ******************************************
               NON LIFE CYCLE FUNCTIONS
    ****************************************** */
   
    onUserLoggedIn: function() {
        //gapi.drive.realtime.load(this.getParams().persistentDataFileId, this.onDataFileLoaded, null);
    },


    onDataFileLoaded: function(doc) {
        /*(var gDriveModel=doc.getModel().getRoot();
        var titleModel=gDriveModel.get('title');
        var descriptionModel=gDriveModel.get('description');
        var attributesModel=gDriveModel.get('properties');
        var data={
            title:titleModel,
            description:descriptionModel,
            attributes:attributesModel
        }*/

        var data={
            title:this.model.title,
            description:this.model.description,
            attributes:this.model.attributes
        }
        //Bullet.trigger(EventType.PersistentDataEntry.GAPI_DATA_FILE_LOADED, data);
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