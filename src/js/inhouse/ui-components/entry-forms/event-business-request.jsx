var googleDriveUtils = require('../../utils/google-drive-utils.js');
var GDriveConstants = require('../../constants/google-drive-constants.js');

module.exports = React.createClass({
	mixins: [Navigation, State],
	/* ******************************************
				LIFE CYCLE FUNCTIONS
	****************************************** */
	componentWillMount: function() 
	{
		this.projectFolderFileId = this.props.projectFolderFileId;
	},

	componentDidMount: function() 
	{

	},

	/* ******************************************
				NON LIFE CYCLE FUNCTIONS
	****************************************** */
	onCheck: function(e)
	{
		googleDriveUtils.getProjectObjects(this.projectFolderFileId, 
			"", 
			{event: true}, 
			onEventObjectsListLoaded);

		if (e.currentTarget.checked)
		{
			this.responsePanel = 	<div>
										<label>Business Response: </label>
										,Object1, Object2, Object3,Object1, Object2, Object3,Object1, Object2, Object3,Object1, Object2, Object3,Object1, Object2, Object3,Object1, Object2, Object3,Object1, Object2, Object3,Object1, Object2, Object3,Object1, Object2, Object3,Object1, Object2, Object3,Object1, Object2, Object3,Object1, Object2, Object3,Object1, Object2, Object3,Object1, Object2, Object3,Object1, Object2, Object3,Object1, Object2, Object3,Object1, Object2, Object3,Object1, Object2, Object3,Object1, Object2, Object3,Object1, Object2, Object3,Object1, Object2, Object3,Object1, Object2, Object3,Object1, Object2, Object3,Object1, Object2, Object3,Object1, Object2, Object3,Object1, Object2, Object3,Object1, Object2, Object3,Object1, Object2, Object3,Object1, Object2, Object3,Object1, Object2, Object3,Object1, Object2, Object3 
									</div>
		}
		else
		{
			this.responsePanel = null;
		}

		this.forceUpdate();

		function onEventObjectsListLoaded(eventsList)
		{
			for (var i in eventsList)
			{
				googleDriveUtils.loadDriveFileDoc(eventsList[i].id, GDriveConstants.ObjectType.EVENT,  onEventObjectLoaded);
			}
		}

		function onEventObjectLoaded(doc)
		{
			customModel = doc.getModel().getRoot().get(GDriveConstants.CustomObjectKey.EVENT);
			customModel.isBusinessRequest = gapi.drive.realtime.custom.collaborativeField(GDriveConstants.EVENT.KEY_IS_BUSINESS_REQUEST);
			console.log(customModel.isBusinessRequest);
		}
	},

	render: function() {
		return (
			<div>
				<div className='row'>
					<input type='checkbox' id='business-request-checkbox' className='filled-in' onChange={this.onCheck} />
					<label htmlFor='business-request-checkbox'>Business Request</label>
				</div>
				{this.responsePanel}
			</div>
		);
	}
});
