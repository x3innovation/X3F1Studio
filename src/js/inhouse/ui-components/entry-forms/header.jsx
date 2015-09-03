var EventType = require('../../constants/event-type.js');
var AnnouncementType = require('../../constants/announcement-type.js');
var GDriveConstants = require('../../constants/google-drive-constants.js');

var GDriveService = require('../../services/google-drive-service.js');

module.exports = React.createClass({
	/* ******************************************
				LIFE CYCLE FUNCTIONS
	****************************************** */
	componentWillMount: function() {
		this.gModel = null;
		this.metadataModel = null;

		Bullet.on(EventType.EntryForm.GAPI_FILE_LOADED, 'header.jsx>>onGapiFileLoaded', this.onGapiFileLoaded);
		Bullet.on(EventType.EntryForm.METADATA_MODEL_LOADED, 'header.jsx>>onMetadataModelLoaded', this.onMetadataModelLoaded);
	},

	componentDidMount: function() {
		$('#header-title').focus(function() {
			$(this).attr('placeholder', '');
			$('#clear-title-btn').css('visibility', 'visible').css('opacity', '1');
		}).blur(function() {
			$(this).attr('placeholder', 'enter title');
			$('#clear-title-btn').css('visibility', 'hidden').css('opacity', '0');
		});

		$('#header-description').focus(function() {$(this).attr('placeholder', ''); })
			.blur(function() {$(this).attr('placeholder', 'enter description'); });
	},

	componentWillUnmount: function() {
		clearTimeout(this.saveTitleTimeout);
		this.saveTitle();
		if (this.gModel.title) { this.gModel.title.removeAllEventListeners(); }
		
		Bullet.off(EventType.EntryForm.GAPI_FILE_LOADED, 'header.jsx>>onGapiFileLoaded');
		Bullet.off(EventType.EntryForm.METADATA_MODEL_LOADED, 'header.jsx>>onMetadataModelLoaded');
	},

	/* ******************************************
				NON LIFE CYCLE FUNCTIONS
	****************************************** */
	onGapiFileLoaded: function(doc) {
		this.gModel = doc.getModel().getRoot().get(this.props.gapiKey);
		this.gModel.title.addEventListener(gapi.drive.realtime.EventType.TEXT_INSERTED, this.saveTitleHandler);
		this.gModel.title.addEventListener(gapi.drive.realtime.EventType.TEXT_DELETED, this.saveTitleHandler);

		this.setHeader();
	},

	onMetadataModelLoaded: function(metadataModel) {
		this.metadataModel = metadataModel;
	},

	onClearTitleBtnClick: function(e) {
		$('#header-title').val('').focus();
	},

	setHeader: function() {
		var titleInput = $('#header-title')[0];
		var descriptionInput = $('#header-description')[0];
		gapi.drive.realtime.databinding.bindString(this.gModel.title, titleInput);
		gapi.drive.realtime.databinding.bindString(this.gModel.description, descriptionInput);

		$('#header-ID').val(this.gModel.id);
		if ($('#header-ID').val().length) {
			$('#header-ID-label').removeClass('hide').addClass('active');
		}
		$('#header-wrapper').removeClass('hide');
	},

	saveTitleHandler: function(e) {
		if (!$('#header-ID').val().length) {
			$('#header-ID').val(this.gModel.id);
			$('#header-ID-label').removeClass('hide').addClass('active');
		}
		clearTimeout(this.saveTitleTimeout);
		this.saveTitleTimeout = setTimeout(this.saveTitle, 300);
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

	keyPressHandler: function(e) {
		var code = (e.keyCode || e.which);
		if (code === 13) { //enter was detected, ignore keypress
			$(e.currentTarget).blur();
			return false;
		}
	},

	render: function() {
		var dataModel = this.gModel;
		var fileType = this.props.fileType;
		return (
			<div className = 'row'>
				<div id = 'header-wrapper' className = 'hide center'>
					<div id = 'header-ID-wrapper' className = 'input-field col s1'>
						<input readOnly type = 'text' id = 'header-ID'/>
						<label htmlFor = 'header-ID' className = 'hide active' id = 'header-ID-label'>Type ID</label>
					</div>
					<div id = 'header-title-wrapper' className = 'col s10'>
						<input type = 'text' id = 'header-title' className ='center' spellCheck = 'false' 
							onKeyPress = {this.keyPressHandler} placeholder = 'enter title' />
						<a id="clear-title-btn" onClick = {this.onClearTitleBtnClick}
							className='small-btn btn-floating waves-effect waves-light materialize-red'>
							<i className="mdi-content-clear btn-icon" /></a>
					</div>
					<div id = 'header-description-wrapper' className = 'col offset-s1 s10'>
						<textarea rows = '1' className='center' id = 'header-description' spellCheck = 'false'
							onKeyPress = {this.keyPressHandler} placeholder = 'enter description' />
					</div>
					<div id = 'header-creator-info' className = 'col s12'/>
				</div>
			</div>
		);
	}
});
