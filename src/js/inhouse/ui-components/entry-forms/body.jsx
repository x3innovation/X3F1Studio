var EventType = require('../../constants/event-type.js');
var GDriveConstants = require('../../constants/google-drive-constants.js');

var EnumElements = require('./enum-elements.jsx');
var FieldSelector = require('./field-selector.jsx');
var Form = require('./form.jsx');
var PersistentEvents = require('./persistent-events.jsx');
var Queries = require('./queries.jsx');

module.exports = React.createClass({
	/* ******************************************
	            LIFE CYCLE FUNCTIONS
	****************************************** */
	componentWillMount: function() {
		Bullet.on(EventType.EntryForm.GAPI_FILE_LOADED, 'body.jsx>>onGapiFileLoaded', this.onGapiFileLoaded);
	},

	componentWillUnmount: function() {
		Bullet.off(EventType.EntryForm.GAPI_FILE_LOADED, 'body.jsx>>onGapiFileLoaded');
	},

	/* ******************************************
	          NON LIFE CYCLE FUNCTIONS
	****************************************** */
	onGapiFileLoaded: function() {
		$('.body-wrapper').removeClass('hide').addClass('loaded');
		$('.body-preloader-wrapper').addClass('hide');
	},

	getContent: function() {
		var content;

		var projectFileId = this.props.projectFileId;
		var projectFolderFileId = this.props.projectFolderFileId;
		var fileId = this.props.fileId;
		var fileType = this.props.fileType;
		var gapiKey = this.props.gapiKey;

		switch (fileType) {
			case GDriveConstants.ObjectType.PERSISTENT_DATA:
				content = (
					<div className = 'body-wrapper row hide'>
						<div className = 'form-wrapper-row row'>
							<div className = 'col s4' id = 'field-selector-wrapper'>
								<FieldSelector
									projectFileId = {projectFileId} projectFolderFileId = {projectFolderFileId}
									fileId = {fileId} fileType = {fileType} gapiKey = {gapiKey} />
							</div>
							<div className = 'col s8' id = 'form-wrapper'>
								<Form
									projectFileId = {projectFileId} projectFolderFileId = {projectFolderFileId}
									fileId = {fileId} fileType = {fileType} gapiKey = {gapiKey} />
							</div>
						</div>
						<br />
						<div id = 'persistent-events-wrapper' className = 'form-wrapper-row row'>
							<div className = 'col s12'>
								<PersistentEvents
									projectFileId = {projectFileId} projectFolderFileId = {projectFolderFileId}
									fileId = {fileId} fileType = {fileType} gapiKey = {gapiKey} />
							</div>
						</div>
						<br />
						<div id = 'queries-wrapper' className = 'form-wrapper-row  row'>
							<div className = 'col s12'>
								<Queries
									projectFileId = {projectFileId} projectFolderFileId = {projectFolderFileId}
									fileId = {fileId} fileType = {fileType} gapiKey = {gapiKey} />
							</div>
						</div>
					</div>
				);
				break;

			case GDriveConstants.ObjectType.EVENT:
				content = (
					<div className = 'body-wrapper row hide'>
						<div className = 'form-wrapper-row row'>
							<div className = 'col s4' id = 'field-selector-wrapper'>
								<FieldSelector
									projectFileId = {projectFileId} projectFolderFileId = {projectFolderFileId}
									fileId = {fileId} fileType = {fileType} gapiKey = {gapiKey} />
							</div>
							<div className = 'col s8' id = 'form-wrapper'>
								<Form
									projectFileId = {projectFileId} projectFolderFileId = {projectFolderFileId}
									fileId = {fileId} fileType = {fileType} gapiKey = {gapiKey} />
							</div>
						</div>
						<br />
						<div id = 'queries-wrapper' className = 'form-wrapper-row  row'>
							<div className = 'col s12'>
								<Queries
									projectFileId = {projectFileId} projectFolderFileId = {projectFolderFileId}
									fileId = {fileId} fileType = {fileType} gapiKey = {gapiKey} />
							</div>
						</div>
					</div>
				);
				break;

			case GDriveConstants.ObjectType.SNIPPET:
				content = (
					<div className = 'body-wrapper row hide'>
						<div className = 'form-wrapper-row row'>
							<div className = 'col s4' id = 'field-selector-wrapper'>
								<FieldSelector
									projectFileId = {projectFileId} projectFolderFileId = {projectFolderFileId}
									fileId = {fileId} fileType = {fileType} gapiKey = {gapiKey} />
							</div>
							<div className = 'col s8' id = 'form-wrapper'>
								<Form
									projectFileId = {projectFileId} projectFolderFileId = {projectFolderFileId}
									fileId = {fileId} fileType = {fileType} gapiKey = {gapiKey} />
							</div>
						</div>
					</div>
				);
				break;

			case GDriveConstants.ObjectType.ENUM: 
				content = (
					<div className = 'body-wrapper row hide'>
						<div id = 'enum-elements-wrapper' className = 'row form-wrapper-row '>
							<div className = 'col s12'>
								<EnumElements
									projectFileId = {projectFileId} projectFolderFileId = {projectFolderFileId}
									fileId = {fileId} fileType = {fileType} gapiKey = {gapiKey} />
							</div>
						</div>
					</div>
				);
				break;

			default:
				content = (<div></div>);
				break;
			}
		return content;
	},

	render: function() {
		var content = this.getContent();
		return (
			<div>
				{content}
				<div className = 'body-preloader-wrapper preloader'>
					<img id = "body-preloader" src = "img/loading-spin.svg" />
				</div>
			</div>
		);
	}
});
