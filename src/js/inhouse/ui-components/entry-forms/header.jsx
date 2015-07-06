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
		this.elements = {};

		Bullet.on(EventType.EntryForm.GAPI_FILE_LOADED, 'header.jsx>>onGapiFileLoaded', this.onGapiFileLoaded);
		Bullet.on(EventType.EntryForm.METADATA_MODEL_LOADED, 'header.jsx>>onMetadataModelLoaded', this.onMetadataModelLoaded);
	},

	componentDidMount: function() {
		this.setElements();
		this.elements.headerTitle.focus(function(){$(this).attr('placeholder', ''); })
			.blur(function(){$(this).attr('placeholder', 'enter title'); });
		this.elements.headerDescription.focus(function(){$(this).attr('placeholder', ''); })
			.blur(function(){$(this).attr('placeholder', 'enter description'); });
	},

	componentWillUnmount: function() {
		Bullet.off(EventType.EntryForm.GAPI_FILE_LOADED, 'header.jsx>>onGapiFileLoaded');
		Bullet.off(EventType.EntryForm.METADATA_MODEL_LOADED, 'header.jsx>>onMetadataModelLoaded');
	},

	/* ******************************************
				NON LIFE CYCLE FUNCTIONS
	****************************************** */
	setElements: function() {
		this.elements.headerTitle = $('#header-title');
		this.elements.headerDescription = $('#header-description');
		this.elements.headerID = $('#header-ID');
		this.elements.headerIDLabel = $('#header-ID-label');
	},

	onGapiFileLoaded: function(doc) {
		this.gModel = doc.getModel().getRoot().get(this.props.gapiKey);
		this.gModel.title.addEventListener(gapi.drive.realtime.EventType.TEXT_INSERTED, this.saveTitleHandler);
		this.gModel.title.addEventListener(gapi.drive.realtime.EventType.TEXT_DELETED, this.saveTitleHandler);

		var titleInput = this.elements.headerTitle[0];
		var descriptionInput = this.elements.headerDescription[0];
		gapi.drive.realtime.databinding.bindString(this.gModel.title, titleInput);
		gapi.drive.realtime.databinding.bindString(this.gModel.description, descriptionInput);
		this.elements.headerID.val(this.gModel.id);
		if (this.elements.headerID.val().length) {
			this.elements.headerIDLabel.removeClass('hide').addClass('active');
		}
	},

	onMetadataModelLoaded: function(metadataModel) {
		this.metadataModel = metadataModel;
	},

	saveTitleHandler: function(evt) {
		if (!this.elements.headerID.val().length) {
			this.elements.headerID.val(this.gModel.id);
			this.elements.headerIDLabel.removeClass('hide').addClass('active');
		}
		clearTimeout(this.saveTitleTimeout);
		this.saveTitleTimeout = setTimeout(this.saveTitle, 300);
	},

	saveTitle: function() {
		var title = this.elements.headerTitle.val();
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
					<div id = 'description-wrapper' className = 'col s10'>
						<textarea rows = '1' id = 'header-description' />
					</div>
					<div id = 'header-ID-wrapper' className = 'input-field col offset-s1 s1'>
						<input readOnly type = 'text' id = 'header-ID'/>
						<label htmlFor = 'header-ID' className = 'hide active' id = 'header-ID-label'>ID</label>
					</div>
				</div>
			</div>
		);
	}
});
