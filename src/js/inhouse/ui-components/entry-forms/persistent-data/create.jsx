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
		GDriveService.createNewPersistentData(that.getParams().projectFolderFileId, function(file) {
			var params = {
				projectFolderFileId: that.getParams().projectFolderFileId,
				projectFileId: that.getParams().projectFileId,
				fileId: file.id
			};
			var addFileAnnouncement = {
				action: AnnouncementType.ADD_FILE,
				fileType: GDriveConstants.ObjectType.PERSISTENT_DATA,
				fileId: file.id,
				fileName: DefaultValueConstants.NewFileValues.PERSISTENT_DATA_TITLE
			};
			GDriveService.getMetadataModel(that.getParams().projectFileId, function(metadataModel) {
				GDriveService.announce(metadataModel, addFileAnnouncement);
			});
			that.replaceWith('persistentDataEntry', params); //do not put creation page in browser history
		});
	},

	/* ******************************************
				NON LIFE CYCLE FUNCTIONS
	****************************************** */
	render: function() {
		return null;
	}
});
