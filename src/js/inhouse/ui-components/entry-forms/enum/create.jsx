var AnnouncementType = require('../../../constants/announcement-type.js');
var DefaultValueConstants = require('../../../constants/default-value-constants.js');
var GDriveConstants = require('../../../constants/google-drive-constants.js');

var GDriveService = require('../../../services/google-drive-service.js');

module.exports = React.createClass({
	mixins: [Navigation, State],

	/* ******************************************
				LIFE CYCLE FUNCTIONS
	****************************************** */
	componentDidMount: function() {
		var _this = this;
		GDriveService.createNewEnum(_this.getParams().projectFolderFileId, function(file) {
			var params = {
				projectFolderFileId: _this.getParams().projectFolderFileId,
				projectFileId: _this.getParams().projectFileId,
				fileId: file.id
			};
			var addFileAnnouncement = {
				action: AnnouncementType.ADD_FILE,
				fileType: GDriveConstants.ObjectType.ENUM,
				fileId: file.id,
				fileName: DefaultValueConstants.NewFileValues.ENUM_TITLE
			};
			GDriveService.getMetadataModel(_this.getParams().projectFileId, function(metadataModel) {
				GDriveService.announce(metadataModel, addFileAnnouncement);
			});
			_this.replaceWith('enumEntry', params);
		});
	},

	/* ******************************************
				NON LIFE CYCLE FUNCTIONS
	****************************************** */
	render: function() {
		return null;
	}
});
