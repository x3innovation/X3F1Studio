var EventType=require('../../constants/event-type.js');
var GDriveConstants=require('../../constants/google-drive-constants.js');
var Cons=GDriveConstants.PersistentData;

module.exports=React.createClass ({

	model: {},

	/* ******************************************
				LIFE CYCLE FUNCTIONS
	****************************************** */
	componentWillMount: function() {
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
		$('#header-title').keyup(this.keyupSaveHandler); 
		$('#header-desc').keyup(this.keyupSaveHandler);
	},

	keyupSaveHandler: function(e) {
		var code = (e.keyCode || e.which);
		var nonInputKeys = [9,16,17,18,19,20,27,33,34,35,36,37,38,39,40,45,46,91,92,93,112,113,114,115,116,117,118,119,120,121,122,123,144,145];

   		// do nothing if key is pressed that doesn't cause input
    	if(nonInputKeys.indexOf(code)!==-1) {
    	    return false;
    	} else {
    		this.saveUiToGoogle();
    	}
	},

	saveUiToGoogle: function() {
		this.model.gModel.title=$('#header-title').val();
		this.model.gModel.description=$('#header-desc').val();
	},

	render: function() {
		return (
			<div className="row">
				<div id="header-wrapper" className="col s12 center">
					<input type="text" id="header-title" className='center' />
					<div id="desc-wrapper">
						<textarea rows="1" id="header-desc" ></textarea>
					</div>            
				</div>
			</div>
		)
	}
});