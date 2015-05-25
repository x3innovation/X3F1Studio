var EventType=require('../../constants/event-type.js');
var GDriveConstants = require('../../constants/google-drive-constants.js');
var Cons = GDriveConstants.PersistentData;

module.exports=React.createClass ({
	/* ******************************************
                LIFE CYCLE FUNCTIONS
    ****************************************** */
    componentWillMount: function() {
        this.model={};
    },

    componentDidMount: function() {
        $('#persistent-data-form-title').focus(function(){$(this).attr('placeholder', '');})
                                         .blur(function(){$(this).attr('placeholder', 'enter title');});

        Bullet.on(EventType.PersistentDataEntry.GAPI_FILE_LOADED, 'persistent-data-header.jsx>>onGapiFileLoaded', this.onGapiFileLoaded);
    },

    componentWillUnmount: function() {
        Bullet.off(EventType.PersistentDataEntry.GAPI_FILE_LOADED, 'persistent-data-header.jsx>>onGapiFileLoaded');
    },

	/* ******************************************
               NON LIFE CYCLE FUNCTIONS
    ****************************************** */

    onGapiFileLoaded: function(doc)
    {
        var gModel = doc.getModel().getRoot().get(key);
        this.model.title = gModel.title;
        this.model.description = gModel.description;

        var titleInput = document.getElementById('persistent-data-form-title');
        // not working
        // need to properly populate UI input with custom model value some how
        // gapi.drive.realtime.databinding.bindString(this.model.title, titleInput);

        var descriptionInput = document.getElementById('persistent-data-form-desc');
        // gapi.drive.realtime.databinding.bindString(this.model.description, descriptionInput);
    },

    onTitleChange: function(e) {
        this.model.title = e.target.value;
        this.forceUpdate();
    },

    onDescriptionChange: function(e) {
        this.model.description = e.target.value;
        this.forceUpdate();
    },

  	render: function() {
      	return (
    		<div className="row">
                <div id="persistent-data-form-header-wrapper" className="col s12">
                    <input type="text" id="persistent-data-form-title" placeholder='enter title' onChange={this.onTitleChange}/>
                    <div id="persistent-data-form-desc-wrapper">
                        <textarea rows="1" id="persistent-data-form-desc" placeholder='enter description' onChange={this.onDescriptionChange}></textarea>
                    </div>            
                </div>
            </div>
    	)
  	}
});