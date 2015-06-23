var AnnouncementType = require('../../constants/announcement-type.js');
var DefaultValueConstants = require('../../constants/default-value-constants.js');
var GDriveConstants = require('../../constants/google-drive-constants.js');

var GDriveService = require('../../services/google-drive-service.js');

module.exports = React.createClass({
	mixins: [Navigation, State], 
	
	/* ******************************************
				LIFE CYCLE FUNCTIONS
	****************************************** */
	componentDidMount: function() {
		GDriveService.createNewPersistentData(this.getParams().projectFolderFileId, function(file) {
			var params = {};
			params.projectFolderFileId = this.getParams().projectFolderFileId;
			params.projectFileId = this.getParams().projectFileId;
			params.persistentDataFileId = file.id;
			var addFileAnnouncement = {
				action: AnnouncementType.ADD_FILE,
				fileType: GDriveConstants.ObjectType.PERSISTENT_DATA,
				fileId: file.id,
				fileName: DefaultValueConstants.NewFileValues.PERSISTENT_DATA_TITLE
			};
			GDriveService.getMetadataModel(this.getParams().projectFileId, function(metadataModel) {
				GDriveService.announce(metadataModel, addFileAnnouncement);
			});
			this.replaceWith('persistentDataEntry', params);
		}.bind(this));
	}, 

	/* ******************************************
				NON LIFE CYCLE FUNCTIONS
	****************************************** */

	render: function() {
		return null;
	}
});
