var EventType = require('../../constants/event-type.js');
var DefaultValueConstants = require('../../constants/default-value-constants.js');

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
		this.totalSize = 0;

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
		this.gFields = doc.getModel().getRoot().get(this.props.gapiKey).fields;
		this.gFields.addEventListener(gapi.drive.realtime.EventType.OBJECT_CHANGED, this.updateUi);
		this.updateUi();
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

		fieldsModel.push({
			name: 'Field Null Bits',
			id: 'field-null-bits',
			size: FieldSizeCons.NULLBITS_SIZE,
			startByte: currByte,
			endByte: currByte + FieldSizeCons.NULLBITS_SIZE - 1
		});
		currByte += FieldSizeCons.NULLBITS_SIZE;

		for (var i = 0, len = this.gFields.length; i<len; i++) {
			var fieldModel = DataVisualizationService.generateFieldModel(this.gFields.get(i), currByte);
			currByte += fieldModel.size;
			fieldsModel.push(fieldModel);
		}

		this.fieldsModel = fieldsModel;
		this.totalSize = currByte;
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

		var currByte = 0;

		var _this = this;
		var content = (
		   <div id = 'header-top-bar-row' className='header-row row center'>{
		   	segments.map(function(segment, index) {
		   		var widthPercent = Math.round(PERCENT_MULTIPLIER * (segment.size / headerTopBarSize) * 100) / 100;
		   		var segmentStyle = { width: widthPercent + '%' };
		   		var segmentContent = segment.name;

		   		var segmentDetails = ''; 
		   		segmentDetails += segment.size + ' bytes ';
		   		segmentDetails += ' ('+currByte + '-' + (currByte + segment.size - 1)+')';

		   		currByte += segment.size;
		   		return (
		   		   <span key={segment.name} className='header-top-bar-segment header-segment header-top-bar-tooltipped' 
		   		    style={segmentStyle} data-details={segmentDetails}>
		   		    	<div className='header-top-bar-segment-content segment-content'>
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
		var totalSize = this.totalSize - DefaultValueConstants.FieldSizeValues.DMX_HEADER_SIZE;

		// can't be actually 100% due to margin overflow, 98% is close enough.
		//don't display text for fileds below a width of 5%.
		var PERCENT_MULTIPLIER = 0.98 * 100;
		var MIN_DISPLAY_PERCENT = PERCENT_MULTIPLIER * (5 / 100);

		var _this = this;
		var content = (
		   <div id = 'header-bar-row' className='header-row row center'>{
		   	fieldsModel.map(function(fieldModel, index) {
		   		// round to hundreths, no need for more digits
		   		var widthPercent = Math.round(PERCENT_MULTIPLIER * (fieldModel.size / totalSize) * 100) / 100;
		   		widthPercent = Math.max(0.1, widthPercent); //have a minimum width set of 0.1% of the bar
		   		var segmentStyle = {
		   			width: widthPercent + '%',
		   		};
		   		if (widthPercent === 0) { segmentStyle.border = '0'; }

		   		// if segment too short, then hide the text
		   		var PLACEHOLDER_VALUE = '...';
		   		var segmentContent = (widthPercent >= MIN_DISPLAY_PERCENT) ? fieldModel.name : PLACEHOLDER_VALUE;
		   		var segmentDetails = DataVisualizationService.generateFieldModelDetails(fieldModel);
		   		if (segmentContent === PLACEHOLDER_VALUE) {
		   			segmentDetails = fieldModel.name + ':\n' + segmentDetails;
		   		}

		   		var segmentClassName = 'header-segment header-bar-segment header-bar-tooltipped' +
		   			(fieldModel.id === 'field-null-bits' ? ' null-bits-segment' : '');
		   		var segmentContentClassName = 'header-bar-segment-content segment-content';
		 
		   		return (
		   		   <span key={fieldModel.id} className={segmentClassName} 
		   		    style={segmentStyle} data-details={segmentDetails}>
		   		    	<div className={segmentContentClassName}>
		   		    		{segmentContent}
		   		    	</div>
		   		   </span>
		   		);
		   	})
		   }</div>
		);
		return content;
	},

	render: function() {
		var topBar = this.getTopBar();
		var secondBar = this.getSecondBar();
		return (
			<div>
				{topBar}
				{secondBar}
			</div>
		);
	}
});