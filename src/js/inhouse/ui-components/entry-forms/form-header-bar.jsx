var EventType = require('../../constants/event-type.js');
var DefaultValueConstants = require('../../constants/default-value-constants.js');
var ColorList = require('../../constants/color-list-constants.js');

var Configs = require('../../app-config.js');

var GDriveService = require('../../services/google-drive-service.js');
var DataVisualizationService = require('../../services/data-visualization-service.js');

module.exports = React.createClass({
	/* ******************************************
	            LIFE CYCLE FUNCTIONS
	****************************************** */
	componentWillMount: function() {
		this.gModel = null;
		this.gFields = null;
		this.fieldsModel = [];
		this.totalBytes = 0;

		Bullet.on(EventType.EntryForm.GAPI_FILE_LOADED, 'form-header-bar.jsx>>onGapiFileLoaded', this.onGapiFileLoaded);
	},

	componentDidMount: function() {
	},

	componentWillUnmount: function() {
		$('.tooltip-to-remove').tooltipster('destroy');

		if (this.gFields) { this.gFields.removeEventListener(gapi.drive.realtime.EventType.OBJECT_CHANGED, this.updateUi); }
		clearInterval(this.updateInterval);

		Bullet.off(EventType.EntryForm.GAPI_FILE_LOADED, 'form-header-bar.jsx>>onGapiFileLoaded');
	},

	/* ******************************************
	          NON LIFE CYCLE FUNCTIONS
	****************************************** */

	onGapiFileLoaded: function(doc) {
		this.gModel = doc.getModel().getRoot().get(this.props.gapiKey);
		this.gFields = this.gModel.fields;
		this.gFields.addEventListener(gapi.drive.realtime.EventType.OBJECT_CHANGED, this.updateUi);
		this.updateUi();

		$('#header-bar-slide-wrapper').css('display', 'none');
	},

	updateUi: function() {
		this.mapFieldData();
		this.forceUpdate();
		var _this = this;
		setTimeout(function() { //allow DOM to update before attaching tooltips
			$('.tooltip-to-remove').tooltipster('destroy');
			_this.initializeTooltips();
		}, 0);
	},

	initializeTooltips: function() {
		$('.header-top-bar-tooltipped').tooltipster({
			position: 'top',
			maxWidth: 200,
			theme: 'header-bar-details top-bar-details',
			trigger: 'hover',
			offsetY: -4,
			speed: 250,
			functionBefore: function($origin, continueTooltip) {
				$origin.tooltipster('content', $origin[0].dataset.details);
				continueTooltip();
			},
			functionInit: function($origin, content) {
				$origin.addClass('tooltip-to-remove');
			}
		});

		$('.header-bar-tooltipped').tooltipster({
			position: 'bottom',
			maxWidth: 200,
			theme: 'header-bar-details second-bar-details',
			trigger: 'hover',
			offsetY: -4,
			speed: 250,
			functionBefore: function($origin, continueTooltip) {
				$origin.tooltipster('content', $origin[0].dataset.details);
				if ($origin.hasClass('null-bits-segment')) {
					$origin.tooltipster('option', 'theme', 'header-bar-details null-bits-details');
				}
				continueTooltip();
			},
			functionInit: function($origin, content) {
				$origin.addClass('tooltip-to-remove');
			}
		});
	},

	mapFieldData: function() {
		if (!this.gFields) { return; }

		var FieldSizeCons = DefaultValueConstants.FieldSizeValues;

		var fieldsModel = [];
		var currByte = FieldSizeCons.DMX_HEADER_SIZE;

		var colorPool = ColorList.FullPool;

		fieldsModel.push({
			name: 'Field Null Bits',
			id: 'field-null-bits',
			size: FieldSizeCons.NULLBITS_SIZE,
			startByte: currByte,
			endByte: currByte + FieldSizeCons.NULLBITS_SIZE - 1,
			color: '#e57373'
		});
		currByte += FieldSizeCons.NULLBITS_SIZE;

		var color = null;
		var index;
		for (var i = 0, len = this.gFields.length; i<len; i++) {
			var fieldModel = DataVisualizationService.generateFieldModel(this.gFields.get(i), currByte);
			fieldModel.id = this.gFields.get(i).id;
			currByte += fieldModel.size; 

			//start from i+1 to account for the first position filled by the null bits
			index = i+1;

			//keep track of the color so they don't change when a field is deleted
			if (this.fieldsModel[index] && this.fieldsModel[index].id === fieldModel.id) {
				color = this.fieldsModel[index].color;
			} else if (this.fieldsModel[index+1] && this.fieldsModel[index+1].id  === fieldModel.id) {
				color = this.fieldsModel[index+1].color;
			} else {
				color = null;
			}
			fieldModel.color = color || colorPool[i % colorPool.length];

			if (fieldsModel[index - 1] && fieldsModel[index - 1].color === fieldModel.color) {
				fieldModel.color = colorPool[i+1 % colorPool.length];
			}

			fieldsModel.push(fieldModel);
		}

		this.fieldsModel = fieldsModel;
		this.totalBytes = currByte;
	},

	getTopBar: function() {
		var DefaultFields = DefaultValueConstants.HeaderBarDefaultFields;
		var segments = [
			DefaultFields.LENGTH,
			DefaultFields.TYPE_ID,
			DefaultFields.VERSION,
			DefaultFields.EXISTS_FLAG,
			DefaultFields.ENCODING,
			DefaultFields.CHECKSUM,
			DefaultFields.UUID_LOW,
			DefaultFields.UUID_HIGH
		];

		var headerTopBarSize = DefaultValueConstants.FieldSizeValues.DMX_HEADER_SIZE;
		// can't be actually 100% due to margin overflow, 98% is close enough.
		var PERCENT_MULTIPLIER = 0.98 * 100;
		var colorPool = ColorList.BlueGreyPool;

		var currByte = 0;

		var _this = this;
		var content = (
		   <div id = 'header-top-bar-row' className='header-row row center'>{
		   	segments.map(function(segment, index) {
		   		var widthPercent = PERCENT_MULTIPLIER * (segment.size / headerTopBarSize);
		   		var segmentStyle = {
		   			width: widthPercent + '%',
		   			backgroundColor: colorPool[index % colorPool.length]
		   		};
		   		var segmentContent = segment.name;

		   		var segmentDetails = ''; 
		   		segmentDetails = segment.name + ':\n' + segmentDetails;
		   		segmentDetails += segment.size + ' bytes ';
		   		segmentDetails += ' ('+currByte + '-' + (currByte + segment.size - 1)+')';

		   		currByte += segment.size;
		   		return (
		   		   <span key={segment.name} className='header-segment header-top-bar-tooltipped' 
		   		    style={segmentStyle} data-details={segmentDetails}>
		   		    	<div className='segment-content'>
		   		    		{segmentContent}
		   		    	</div>
		   		   </span>
		   		);
		   	})
		   }</div>
		);
		return content;
	},

	getSecondBar: function() {
		var fieldsModel = this.fieldsModel;
		var totalBytes = this.totalBytes - DefaultValueConstants.FieldSizeValues.DMX_HEADER_SIZE;

		// can't be actually 100% due to margin overflow, 98% is close enough.
		// don't display text for fields below a width of 5%, it'll be cut off anyways
		var PERCENT_MULTIPLIER = 0.98 * 100;
		var MIN_DISPLAY_PERCENT = PERCENT_MULTIPLIER * (6 / 100);

		var _this = this;
		var content = (
		   <div id = 'header-bar-row' className='header-row row center'>{
		   	fieldsModel.map(function(fieldModel, index) {
		   		var widthPercent = PERCENT_MULTIPLIER * (fieldModel.size / totalBytes);
		   		var segmentStyle = {
		   			width: widthPercent + '%',
		   			backgroundColor: fieldModel.color
		   		};

		   		var segmentClassName = 'header-segment header-bar-tooltipped' +
		   			(fieldModel.id === 'field-null-bits' ? ' null-bits-segment' : '');

		   		// if segment too short, then hide the text
		   		var PLACEHOLDER_VALUE = '';
		   		var segmentContent = (widthPercent >= MIN_DISPLAY_PERCENT) ? fieldModel.name : PLACEHOLDER_VALUE;
		   		var segmentDetails = DataVisualizationService.generateFieldModelDetails(fieldModel);

		   		return (
		   		   <span key={fieldModel.id} className={segmentClassName} 
		   		    style={segmentStyle} data-details={segmentDetails}>
		   		    	<div className='segment-content'>
		   		    		{segmentContent}
		   		    	</div>
		   		   </span>
		   		);
		   	})
		   }</div>
		);
		return content;
	},

	getTotalByteDisplay: function() {
		return (
		   <div id="header-bar-bytes-display">
		   	{totalBytes}
		   </div>
		);
	},

	getDisplayInfo: function() {
		if (!this.gModel) { return; }

		var creatorName = this.gModel.creatingUser.name;
		var createdData = moment(this.gModel.createdDate).format("MMMM Do YYYY, H:mm");
		
		var creatorInfo = 'Created by ' + creatorName + ' on ' + createdData;
		var totalBytesInfo = this.totalBytes + ' bytes';
		return (
		   <div id='header-display-info' className='row'>
		      <span className='creator-info'>{creatorInfo}</span>
		      <span className='total-bytes-info'>{totalBytesInfo}</span>
		   </div>
		);
	},

	slideButtonHandler: function(e) {
		var btn=e.currentTarget;
		var $btn = $(btn);
		var $slideWrapper = $('#header-bar-slide-wrapper');

		if (btn.dataset.inTransition === 'true') {
			return;
		} else {
			btn.dataset.inTransition = 'true';
			setTimeout(function() {
				btn.dataset.inTransition = 'false';
			}, 400);
		}

		$btn.find('i').toggleClass('mdi-navigation-arrow-drop-down mdi-navigation-arrow-drop-up');
		
		if ($slideWrapper.hasClass('slide-up')) {
			$slideWrapper.css('display', 'block');
			setTimeout(function() {
				$slideWrapper.toggleClass('slide-up slide-down');
			}, 0);
		} else {
			$slideWrapper.toggleClass('slide-up slide-down');
			setTimeout(function() {
				$slideWrapper.css('display', 'none');
			}, 200);
		}

		return;
	},

	render: function() {
		var topBar = this.getTopBar();
		var secondBar = this.getSecondBar();
		var displayInfo = this.getDisplayInfo();
		return (
		   <div style={{marginBottom:'2rem'}}>
				<div id='header-bar-slide-wrapper' className='slide-up'>
					{topBar}
					{secondBar}
					{displayInfo}
				</div>
				<div id='header-bar-slide-btn-wrapper'>
					<a className={"btn-floating small-btn waves-effect waves-light " + Configs.App.ADD_BUTTON_COLOR}
					   id='header-bar-slide-btn' onClick={this.slideButtonHandler} data-in-transition='false'>
						<i className = 'mdi-navigation-arrow-drop-down btn-icon' style={{right: '1px'}}/>
					</a>
				</div>
			</div>
		);
	}
});
