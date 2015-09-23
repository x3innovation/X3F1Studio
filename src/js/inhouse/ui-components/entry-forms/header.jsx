var EventType = require('../../constants/event-type.js');
var AnnouncementType = require('../../constants/announcement-type.js');
var GDriveConstants = require('../../constants/google-drive-constants.js');
var GDriveUtils = require('../../utils/google-drive-utils.js');

var HeaderController = require('./header-controller.js');

module.exports = React.createClass({
	mixins: [Navigation, State],
	/* ******************************************
				LIFE CYCLE FUNCTIONS
	****************************************** */
	componentWillMount: function() {
		this.controller = this.props.controller;
		this.gModel = null;
		this.metadataModel = null;

		this.controller = new HeaderController(this.props.objectFileId, 
			this.props.objectFileType,
			this.props.gMetadataModel, 
			this.props.gFileCustomModel);
	},

	componentDidMount: function() {
		var _this = this;
		var $headerTitle = $('#header-title');
		var $headerDescription = $('#header-description');

		// set initial title value
		$headerTitle.val(this.controller.getTitle());
		// register title for external updates
		this.controller.addTitleUpdateListener(function(e){
			$headerTitle.val(_this.controller.getTitle());
		});

		// set initial description value
		$headerDescription.val(this.controller.getDescription());
		// register description for external updates
		this.controller.addDescriptionUpdateListener(function(e){
			$headerDescription.val(_this.controller.getDescription());
		});

		$('#header-ID').val(this.controller.getId());
		if ($('#header-ID').val().length) {
			$('#header-ID-label').removeClass('hide').addClass('active');
		}
		$('#header-wrapper').removeClass('hide');

		$headerTitle.focus(function() {
			$(this).attr('placeholder', '');
			$('#clear-title-btn').css('visibility', 'visible').css('opacity', '1');
		}).blur(function() {
			$(this).attr('placeholder', 'enter title');
			$('#clear-title-btn').css('visibility', 'hidden').css('opacity', '0');
		});

		$headerDescription.focus(function() {$(this).attr('placeholder', ''); })
			.blur(function() {$(this).attr('placeholder', 'enter description'); });
	},

	/* ******************************************
				NON LIFE CYCLE FUNCTIONS
	****************************************** */
	onClearTitleBtnClick: function(e) {
		$('#header-title').val('').focus();
	},

	keyPressHandler: function(e) {
		var code = (e.keyCode || e.which);
		if (code === 13) { //enter was detected, ignore keypress
			$(e.currentTarget).blur();
			return false;
		}
	},

	onTitleChange: function(e)
	{
		this.controller.setTitle(e.target.value);
	},

	onDescriptionChange: function(e)
	{
		this.controller.setDescription(e.target.value);
	},

	render: function() {
		var dataModel = this.gModel;
		var fileType = this.props.fileType;
		return (
			<div className = 'row'>
				<div id = 'header-wrapper' className = 'hide center'>
					<div id = 'header-ID-wrapper' className = 'input-field col s1'>
						<input readOnly type = 'text' id = 'header-ID'/>
						<label htmlFor = 'header-ID' className = 'hide active' id = 'header-ID-label'>Type ID</label>
					</div>
					<div id = 'header-title-wrapper' className = 'col s10'>
						<input type = 'text' id = 'header-title' className ='center' spellCheck = 'false' 
							onKeyPress = {this.keyPressHandler} onChange={this.onTitleChange} placeholder = 'enter title' />
						<a id="clear-title-btn" onClick = {this.onClearTitleBtnClick}
							className='small-btn btn-floating waves-effect waves-light materialize-red'>
							<i className="mdi-content-clear btn-icon" /></a>
					</div>
					<div id = 'header-description-wrapper' className = 'col offset-s1 s10'>
						<textarea rows = '1' className='center' id = 'header-description' spellCheck = 'false'
							onKeyPress = {this.keyPressHandler} placeholder = 'enter description' />
					</div>
					<div id = 'header-creator-info' className = 'col s12'/>
				</div>
			</div>
		);
	}
});
