var EventType = require('../../../constants/event-type.js');
var EnumElements = require('./enum-elements.jsx');

module.exports = React.createClass({
	/* ******************************************
	            LIFE CYCLE FUNCTIONS
	****************************************** */
	componentWillMount: function() {
		Bullet.on(EventType.EntryForm.GAPI_FILE_LOADED, 'body.jsx>>onGapiFileLoaded', this.onGapiFileLoaded);
	},

	componentDidMount: function() {

	},

	componentWillUnmount: function() {
		Bullet.off(EventType.EntryForm.GAPI_FILE_LOADED, 'body.jsx>>onGapiFileLoaded');
	},

	/* ******************************************
	          NON LIFE CYCLE FUNCTIONS
	****************************************** */
	onGapiFileLoaded: function() {
		$('#body-wrapper').removeClass('hide').addClass('loaded');
		$('#body-preloader-wrapper').addClass('hide');
	},

	render: function() {
		var projectFileId = this.props.projectFileId;
		var projectFolderFileId = this.props.projectFolderFileId;
		var fileId = this.props.fileId;
		var fileType = this.props.fileType;
		var gapiKey = this.props.gapiKey;
		return (
			<div>
				<div id = 'body-wrapper' className = 'row hide'>
					<div id = 'enum-elements-wrapper' className = 'row'>
						<div className = 'col s12'>
							<EnumElements
								projectFileId = {projectFileId} projectFolderFileId = {projectFolderFileId}
								fileId = {fileId} fileType = {fileType} gapiKey = {gapiKey} />
						</div>
					</div>
				</div>

				<div id = "body-preloader-wrapper" className = 'preloader'>
					<img id = "body-preloader" src = "img/loading-spin.svg" />
				</div>
			</div>
		);
	}
});
