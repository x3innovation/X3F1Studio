var googleDriveService=require('../../services/google-drive-service.js');

module.exports=React.createClass({
	mixins: [Navigation, State], 
	/* ******************************************
				LIFE CYCLE FUNCTIONS
	****************************************** */
	componentDidMount: function() {
		googleDriveService.createNewPersistentData(this.getParams().projectFolderFileId, function(file) {
			var params={};
			params.projectFolderFileId=this.getParams().projectFolderFileId;
			params.projectFileId=this.getParams().projectFileId;
			params.persistentDataFileId=file.id;
			this.transitionTo('persistentDataEntry', params);
		}.bind(this));
	}, 

	/* ******************************************
				NON LIFE CYCLE FUNCTIONS
	****************************************** */

	render: function() {
		return null;
	}
});
