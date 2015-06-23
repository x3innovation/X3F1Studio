var EventType = require('../../constants/event-type.js');

var FieldSelector = require('./field-selector.jsx');
var Form = require('./form.jsx');
var PersistentEvents = require('./persistent-events.jsx');
var Queries = require('./queries.jsx');

module.exports = React.createClass({
	/* ******************************************
	            LIFE CYCLE FUNCTIONS
	****************************************** */
	componentWillMount: function() {
		Bullet.on(EventType.PersistentDataEntry.GAPI_FILE_LOADED, 'body.jsx>>onGapiFileLoaded', this.onGapiFileLoaded); 
	}, 

	componentDidMount: function() {

	},

	componentWillUnmount: function() {
		Bullet.off(EventType.PersistentDataEntry.GAPI_FILE_LOADED, 'body.jsx>>onGapiFileLoaded');
	}, 

	/* ******************************************
	          NON LIFE CYCLE FUNCTIONS
	****************************************** */

	onGapiFileLoaded: function() {
		$('#persistent-data-body-wrapper').removeClass('hide');
		$('#body-preloader-wrapper').addClass('hide');
	}, 

	render: function() {
		var projectFileId = this.props.projectFileId;
		var projectFolderFileId = this.props.projectFolderFileId;
		var fileId = this.props.fileId;
		var fileType = this.props.fileType;
		return (
			<div>
				<div id = 'persistent-data-body-wrapper' className = 'row loaded hide'>	
					<div id = 'persistent-data-form-wrapper' className = 'row'>
						<div className = 'col s4' id = 'persistent-data-fields-container'>
							<FieldSelector projectFileId = {projectFileId} projectFolderFileId = {projectFolderFileId}
							               fileId = {fileId} fileType = {fileType} />
						</div>
						<div className = 'col s8' id = 'persistent-data-form-contents'>
							<Form projectFileId = {projectFileId} projectFolderFileId = {projectFolderFileId}
							      fileId = {fileId} fileType = {fileType} />
						</div>
					</div>
					<br />
					<div id = 'persistent-events-wrapper' className = 'row'>
						<div className = 'col s12'>
							<PersistentEvents projectFileId = {projectFileId} projectFolderFileId = {projectFolderFileId}
							                  fileId = {fileId} fileType = {fileType} />
						</div>
					</div>
					<br />
					<div id = 'queries-wrapper' className = 'row'>
						<div className = 'col s12'>
							<Queries projectFileId = {projectFileId} projectFolderFileId = {projectFolderFileId}
							         fileId = {fileId} fileType = {fileType} />
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
