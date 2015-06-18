var EventType=require('../../constants/event-type.js');
var GDriveConstants=require('../../constants/google-drive-constants.js');
var googleDriveService=require('../../services/google-drive-service.js');
var Cons=GDriveConstants.PersistentData;

module.exports=React.createClass ({

	model: {}, 

	/* ******************************************
				LIFE CYCLE FUNCTIONS
	****************************************** */
	componentWillMount: function() {
		this.model.gModel=null;
		this.model.metadataModel=null;
		this.model.fieldAttr={};

		Bullet.on(EventType.PersistentDataEntry.GAPI_FILE_LOADED, 'header.jsx>>onGapiFileLoaded', this.onGapiFileLoaded);
		Bullet.on(EventType.PersistentDataEntry.METADATA_MODEL_LOADED, 'header.jsx>>onMetadataModelLoaded', this.onMetadataModelLoaded);
	}, 

	componentDidMount: function() {
		$('#header-title').focus(function(){$(this).attr('placeholder', '');})
							.blur(function(){$(this).attr('placeholder', 'enter title');});
		$('#header-desc').focus(function(){$(this).attr('placeholder', '');})
							.blur(function(){$(this).attr('placeholder', 'enter description');});
	}, 

	componentWillUnmount: function() {
		clearTimeout(this.saveTitleTimeout);
		this.saveTitle();

		Bullet.off(EventType.PersistentDataEntry.GAPI_FILE_LOADED, 'header.jsx>>onGapiFileLoaded');
		Bullet.off(EventType.PersistentDataEntry.METADATA_MODEL_LOADED, 'header.jsx>>onMetadataModelLoaded');
	}, 

	/* ******************************************
			   NON LIFE CYCLE FUNCTIONS
	****************************************** */

	onGapiFileLoaded: function(doc) {
		var key=GDriveConstants.CustomObjectKey.PERSISTENT_DATA;
		this.model.gModel=doc.getModel().getRoot().get(key);
		this.model.gModel.addEventListener(gapi.drive.realtime.EventType.VALUE_CHANGED, this.updateUi);
		$('#data-ID').val(this.model.gModel.id);
		$('#data-ID-label').addClass('active').removeClass('hide');
		this.updateUi();
		this.connectUi();
	}, 

	onMetadataModelLoaded: function(metadataModel) {
		this.model.metadataModel=metadataModel;
	}, 

	updateUi: function() {
		$('#header-title').val(this.model.gModel.title);
		$('#header-desc').val(this.model.gModel.description);
		this.setCursorPos();
	}, 

	connectUi: function() {
		$('#header-title').keyup(this.saveTitleHandler); 
		$('#header-desc').keyup(this.keyUpHandler);
	}, 

	keyUpHandler: function(e) {
		var $fieldAttr=$(e.target);
		var code=(e.keyCode);
		var nonInputKeys=[9,16,17,18,19,20,27,33,34,35,36,37,38,39,40,45,46,91,92,93,112,113,114,115,116, 
							117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,134,135,144,145];
		if (nonInputKeys.indexOf(code)>=0) {
			return false;
		} 
		this.model.fieldAttr.curr=$fieldAttr[0];
		this.model.fieldAttr.currPos=$fieldAttr[0].selectionStart;
		this.saveUiToGoogle();
	}, 

	saveUiToGoogle: function() {
		this.model.gModel.title=$('#header-title').val();
		this.model.gModel.description=$('#header-desc').val();
	}, 

	saveTitleHandler: function(e) {
		clearTimeout(this.saveTitleTimeout);
		this.saveTitleTimeout=setTimeout(this.saveTitle, 300);
		this.keyUpHandler(e);
	}, 

	saveTitle: function() {
		var title=$('#header-title').val();
		googleDriveService.saveFileTitle(this.props.fileId, title);
		var renameAnnouncement={
			action: 'renameFile', 
			fileType: 'persistentData', 
			fileId: this.props.fileId, 
			fileNewName: title
		}
		googleDriveService.announce(this.model.metadataModel, renameAnnouncement);
	}, 

	setCursorPos: function() {
		if (this.model.fieldAttr.curr) {
			this.model.fieldAttr.curr.setSelectionRange(this.model.fieldAttr.currPos, this.model.fieldAttr.currPos);
		}
	}, 

	render: function() {
		return (
			<div className='row'>
				<div id='header-wrapper' className='col s12 center'>
					<input type='text' id='header-title' className='center' />
					<div id='desc-wrapper' className='col s10'>
						<textarea rows='1' id='header-desc' />
					</div>
					<div id='data-ID-wrapper' className='input-field col s2'>
						<input disabled type='text' id='data-ID'/>
						<label htmlFor='data-ID' className='hide' id='data-ID-label'>ID</label>
					</div>
				</div>
			</div>
		)
	}
});
