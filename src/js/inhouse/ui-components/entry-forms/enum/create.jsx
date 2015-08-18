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
		var that = this;
		GDriveService.createNewEnum(that.getParams().projectFolderFileId, function(file) {
			var params = {
				projectFolderFileId: that.getParams().projectFolderFileId,
				projectFileId: that.getParams().projectFileId,
				fileId: file.id
			};
			var addFileAnnouncement = {
				action: AnnouncementType.ADD_FILE,
				fileType: GDriveConstants.ObjectType.ENUM,
				fileId: file.id,
				fileName: DefaultValueConstants.NewFileValues.ENUM_TITLE
			};
			GDriveService.getMetadataModel(that.getParams().projectFileId, function(metadataModel) {
				GDriveService.announce(metadataModel, addFileAnnouncement);
			});
			that.replaceWith('enumEntry', params); //do not put creation page in browser history
		});
	},

	/* ******************************************
				NON LIFE CYCLE FUNCTIONS
	****************************************** */
	render: function() {
		return null;
	}
});