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
		this.gModel = doc.getModel().getRoot().get(this.props.gapiKey);
		this.gModel.title.addEventListener(gapi.drive.realtime.EventType.TEXT_INSERTED, this.saveTitleHandler);
		this.gModel.title.addEventListener(gapi.drive.realtime.EventType.TEXT_DELETED, this.saveTitleHandler);

		var titleInput = document.getElementById('header-title');
		var descriptionInput = document.getElementById('header-desc');
		gapi.drive.realtime.databinding.bindString(this.gModel.title, titleInput);
		gapi.drive.realtime.databinding.bindString(this.gModel.description, descriptionInput);
		$('#data-ID').val(this.gModel.id);
		if ($('#data-ID').val().length) {
			$('#data-ID-label').removeClass('hide').addClass('active');
		}
	},

	onMetadataModelLoaded: function(metadataModel) {
		this.metadataModel = metadataModel;
	},
		
	saveTitleHandler: function(e) {
		if (!$('#data-ID').val().length) {
			$('#data-ID').val(this.gModel.id);
			$('#data-ID-label').removeClass('hide').addClass('active');
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

	render: function() {
		return (
			<div className = 'row'>
				<div id = 'header-wrapper' className = 'col s12 center'>
					<input type = 'text' id = 'header-title' className = 'center' />
					<div id = 'desc-wrapper' className = 'col s10'>
						<textarea rows = '1' id = 'header-desc' />
					</div>
					<div id = 'data-ID-wrapper' className = 'input-field col s2'>
						<input readOnly type = 'text' id = 'data-ID'/>
						<label htmlFor = 'data-ID' className = 'hide active' id = 'data-ID-label'>ID</label>
					</div>
				</div>
			</div>
		);
	}
});
