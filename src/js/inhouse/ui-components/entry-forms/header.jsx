var EventType = require('../../constants/event-type.js');
var AnnouncementType = require('../../constants/announcement-type.js');

var GDriveService = require('../../services/google-drive-service.js');

module.exports = React.createClass({
	/* ******************************************
				LIFE CYCLE FUNCTIONS
	****************************************** */
	componentWillMount: function() {
		this.gModel = null;
		this.metadataModel = null;
		this.fieldAttr = {};

		Bullet.on(EventType.EntryForm.GAPI_FILE_LOADED, 'header.jsx>>onGapiFileLoaded', this.onGapiFileLoaded);
		Bullet.on(EventType.EntryForm.METADATA_MODEL_LOADED, 'header.jsx>>onMetadataModelLoaded', this.onMetadataModelLoaded);
	},

	componentDidMount: function() {
		$('#header-title').focus(function(){$(this).attr('placeholder', ''); })
			.blur(function(){$(this).attr('placeholder', 'enter title'); });
		$('#header-desc').focus(function(){$(this).attr('placeholder', ''); })
			.blur(function(){$(this).attr('placeholder', 'enter description'); });
	},

	componentWillUnmount: function() {
		Bullet.off(EventType.EntryForm.GAPI_FILE_LOADED, 'header.jsx>>onGapiFileLoaded');
		Bullet.off(EventType.EntryForm.METADATA_MODEL_LOADED, 'header.jsx>>onMetadataModelLoaded');
	},

	/* ******************************************
				NON LIFE CYCLE FUNCTIONS
	****************************************** */
	onGapiFileLoaded: function(doc) {
		var key = this.props.gapiKey;
		this.gModel = doc.getModel().getRoot().get(key);
		this.gModel.addEventListener(gapi.drive.realtime.EventType.VALUE_CHANGED, this.updateUi);
		$('#data-ID').val(this.gModel.id);
		$('#data-ID-label').removeClass('hide').addClass('active');
		this.updateUi();
		this.connectUi();
	},

	onMetadataModelLoaded: function(metadataModel) {
		this.metadataModel = metadataModel;
	},

	updateUi: function(e) {
		if(!$('#data-ID').val()) {
			$('#data-ID').val(this.gModel.id);
		}
		$('#header-title').val(this.gModel.title);
		$('#header-desc').val(this.gModel.description);
		this.setCursorPos();
	},

	connectUi: function() {
		$('#header-title').keyup(this.saveTitleHandler);
		$('#header-desc').keyup(this.keyUpHandler);
	},

	keyUpHandler: function(e) {
		var $fieldAttr = $(e.target);
		var code = (e.keyCode);
		var arrowKeyCodes = [37, 38, 39, 40];
		if (arrowKeyCodes.indexOf(code) >= 0) {
			return false;
		}
		this.fieldAttr.attr = $fieldAttr;
		this.fieldAttr.pos = $fieldAttr[0].selectionStart;
		this.saveUiToGoogle();
	},

	saveUiToGoogle: function() {
		this.gModel.title = $('#header-title').val();
		this.gModel.description = $('#header-desc').val();
	},

	saveTitleHandler: function(e) {
		clearTimeout(this.saveTitleTimeout);
		this.saveTitleTimeout = setTimeout(this.saveTitle, 300);
		this.keyUpHandler(e);
	},

	saveTitle: function() {
		var title = $('#header-title').val();
		GDriveService.saveFileTitle(this.props.fileId, title);
		var renameAnnouncement = {
			action: AnnouncementType.RENAME_FILE,
			fileType: this.props.fileType,
			fileId: this.props.fileId,
			fileNewName: title
		};
		GDriveService.announce(this.metadataModel, renameAnnouncement);
	},

	setCursorPos: function() {
		if (this.fieldAttr.attr) {
			this.fieldAttr.attr[0].setSelectionRange(this.fieldAttr.pos, this.fieldAttr.pos);
		}
	},

	render: function() {
		return (
			<div className = 'row'>
				<div id = 'header-wrapper' className = 'col s12 center'>
					<input type = 'text' id = 'header-title' className = 'center' />
					<div id = 'desc-wrapper' className = 'col s10'>
						<textarea rows = '1' id = 'header-desc' />
					</div>
					<div id = 'data-ID-wrapper' className = 'input-field col s2'>
						<input disabled type = 'text' id = 'data-ID'/>
						<label htmlFor = 'data-ID' className = 'hide active' id = 'data-ID-label'>ID</label>
					</div>
				</div>
			</div>
		);
	}
});
