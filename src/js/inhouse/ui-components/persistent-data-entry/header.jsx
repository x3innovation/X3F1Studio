var EventType=require('../../constants/event-type.js');
var GDriveConstants=require('../../constants/google-drive-constants.js');
var Cons=GDriveConstants.PersistentData;

module.exports=React.createClass ({
	/* ******************************************
                LIFE CYCLE FUNCTIONS
    ****************************************** */
    componentWillMount: function() {
        this.model={};
        this.model.gModel=null;
    },

    componentDidMount: function() {
        $('#header-title').focus(function(){$(this).attr('placeholder', '');})
                           .blur(function(){$(this).attr('placeholder', 'enter title');});
        $('#header-desc').focus(function(){$(this).attr('placeholder', '');})
                          .blur(function(){$(this).attr('placeholder', 'enter description');});

        Bullet.on(EventType.PersistentDataEntry.GAPI_FILE_LOADED, 'header.jsx>>onGapiFileLoaded', this.onGapiFileLoaded);
    },

    componentWillUnmount: function() {
        Bullet.off(EventType.PersistentDataEntry.GAPI_FILE_LOADED, 'header.jsx>>onGapiFileLoaded');
    },

	/* ******************************************
               NON LIFE CYCLE FUNCTIONS
    ****************************************** */

    onGapiFileLoaded: function(doc)
    {
        var key=GDriveConstants.CustomObjectKey.PERSISTENT_DATA;
        this.model.gModel=doc.getModel().getRoot().get(key);
        this.model.gModel.addEventListener(gapi.drive.realtime.EventType.VALUE_CHANGED, this.updateUi);
        this.updateUi();
        this.connectUi();
    },

    updateUi: function() {
        $('#header-title').val(this.model.gModel.title);
        $('#header-desc').val(this.model.gModel.description);
    },

    connectUi: function() {
        $('#header-title').keyup(this.saveUiToGoogle); 
        $('#header-desc').keyup(this.saveUiToGoogle);
    },

    saveUiToGoogle: function() {
        this.model.gModel.title=$('#header-title').val();
        this.model.gModel.description=$('#header-desc').val();
    },

  	render: function() {
      	return (
    		<div className="row">
                <div id="header-wrapper" className="col s12">
                    <input type="text" id="header-title" placeholder='enter title' />
                    <div id="desc-wrapper">
                        <textarea rows="1" id="header-desc" placeholder='enter description'></textarea>
                    </div>            
                </div>
            </div>
    	)
  	}
});