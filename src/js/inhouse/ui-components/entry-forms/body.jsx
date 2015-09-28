var EventType = require('../../constants/event-type.js');
var GDriveConstants = require('../../constants/google-drive-constants.js');

var EnumElements = require('./enum-elements.jsx');
var FieldSelector = require('./field-selector.jsx');
var Form = require('./form.jsx');
var FormHeaderBar = require('./form-header-bar.jsx');
var PersistentEvents = require('./persistent-events.jsx');
var Queries = require('./queries.jsx');
var BusinessRequest = require('./business-request.jsx');

var FormHeaderBarController = require('./form-header-bar-controller.js');
var FieldSelectorController = require('./field-selector-controller.js');
var FormController = require('./form-controller.js');
var PersistentEventsController = require('./persistent-events-controller.js');
var QueriesController = require('./queries-controller.js');
var EnumElementsController = require('./enum-elements-controller.js');

module.exports = React.createClass({
	/* ******************************************
	            LIFE CYCLE FUNCTIONS
	****************************************** */
	componentWillMount: function()
	{
		this.formHeaderBarController = new FormHeaderBarController(this.props.gFileCustomModel);
		this.fieldSelectorController = new FieldSelectorController(this.props.gFileCustomModel);
		this.formController = new FormController(this.props.gFileCustomModel,
			this.props.gMetadataModel,
			this.props.projectFolderFileId,
			this.props.objectFileId,
			this.props.gFileModel);
		this.persistentEventsController = new PersistentEventsController(this.props.gFileCustomModel);
		this.queriesController = new QueriesController(this.props.gFileCustomModel,
			this.props.gMetadataModel,
			this.props.gFileModel);
		this.enumElementsController = new EnumElementsController(this.props.gFileCustomModel,
			this.props.gMetadataModel);
	},

	/* ******************************************
	          NON LIFE CYCLE FUNCTIONS
	****************************************** */
	getContent: function() {
		var content;

		switch (this.props.objectFileType) {
			case GDriveConstants.ObjectType.PERSISTENT_DATA:
				content = (
					<div className = 'body-wrapper row'>
						<div className = 'form-wrapper-row row'>
							<div className = 'col s12' id = 'form-header-bar-wrapper'>
								<FormHeaderBar controller={this.formHeaderBarController} />
							</div>
							<div className = 'col s4' id = 'field-selector-wrapper'>
								<FieldSelector controller={this.fieldSelectorController} />
							</div>
							<div className = 'col s8' id = 'form-wrapper'>
								<Form controller={this.formController} />
							</div>
						</div>
						<br />
						<div id = 'persistent-events-wrapper' className = 'form-wrapper-row row'>
							<div className = 'col s12'>
								<PersistentEvents controller={this.persistentEventsController} />
							</div>
						</div>
						<br />
						<div id = 'queries-wrapper' className = 'form-wrapper-row  row'>
							<div className = 'col s12'>
								<Queries controller={this.queriesController} />
							</div>
						</div>
					</div>
				);
				break;

			case GDriveConstants.ObjectType.EVENT:
				content = (
					<div className = 'body-wrapper row'>
						<div className = 'form-wrapper-row row'>
							<div className = 'col s12' id = 'form-header-bar-wrapper'>
								<FormHeaderBar controller={this.formHeaderBarController} />
							</div>
							<div className = 'col s4' id = 'field-selector-wrapper'>
								<FieldSelector controller={this.fieldSelectorController} />
							</div>
							<div className = 'col s8' id = 'form-wrapper'>
								<Form controller={this.formController} />
							</div>
						</div>
						<br />
						<div className = 'form-wrapper-row row'>
							<div className = 'col s12'>
								<BusinessRequest projectFolderFileId={this.props.projectFolderFileId} />
							</div>
						</div>
					</div>
				);
				break;

			case GDriveConstants.ObjectType.SNIPPET:
				content = (
					<div className = 'body-wrapper row'>
						<div className = 'form-wrapper-row row'>
							<div className = 'col s12' id = 'form-header-bar-wrapper'>
								<FormHeaderBar controller={this.formHeaderBarController} />
							</div>
							<div className = 'col s4' id = 'field-selector-wrapper'>
								<FieldSelector controller={this.fieldSelectorController} />
							</div>
							<div className = 'col s8' id = 'form-wrapper'>
								<Form controller={this.formController} />
							</div>
						</div>
					</div>
				);
				break;

			case GDriveConstants.ObjectType.ENUM: 
				content = (
					<div className = 'body-wrapper row'>
						<div id = 'enum-elements-wrapper' className = 'row form-wrapper-row '>
							<div className = 'col s12'>
								<EnumElements controller={this.enumElementsController} />
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
			</div>
		);
	}
});
