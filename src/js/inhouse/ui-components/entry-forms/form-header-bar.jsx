var EventType = require('../../constants/event-type.js');
var DefaultValueConstants = require('../../constants/default-value-constants.js');

var GDriveService = require('../../services/google-drive-service.js');
var DataVisualizationService = require('../../services/data-visualization-service.js')

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

	componentWillUnmount: function() {
		if (this.gFields) { this.gFields.removeAllEventListeners(); }
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
	},

	mapFieldData: function() {
		if (!this.gFields) { return; }

		var FieldSizeCons = DefaultValueConstants.FieldSizeValues;

		var oldSize = this.totalSize;
		this.fieldsModel = [];
		this.totalSize = FieldSizeCons.DMX_HEADER_SIZE;

		this.fieldsModel.push({
			name: 'Field Null Bits',
			id: 'field-null-bits',
			size: FieldSizeCons.NULLBITS_SIZE,
			startByte: this.totalSize,
			endByte: this.totalSize + FieldSizeCons.NULLBITS_SIZE - 1
		});
		this.totalSize += FieldSizeCons.NULLBITS_SIZE;

		for (var i = 0, len = this.gFields.length; i<len; i++) {
			var fieldModel = DataVisualizationService.generateFieldModel(this.gFields.get(i), this.totalSize);
			this.totalSize += fieldModel.size;
			this.fieldsModel.push(fieldModel);
		}
	},

	showSegmentDetails: function(e) {
		var $fieldSegment = $(e.currentTarget);
		$('.segment-details').addClass('no-opacity');
		$fieldSegment.find('.segment-details').removeClass('no-opacity');
	},

	hideSegmentDetails: function(e) {
		var $fieldSegment = $(e.currentTarget);
		$('.segment-details').addClass('no-opacity')
	},

	getTopBar: function() {
		var DefaultSegments = DefaultValueConstants.HeaderBarDefaultFields
		var defaultSegments = [
			DefaultSegments.LENGTH,
			DefaultSegments.TYPE_ID,
			DefaultSegments.VERSION,
			DefaultSegments.EXISTS_FLAG,
			DefaultSegments.ENCODING,
			DefaultSegments.CHECKSUM,
			DefaultSegments.UUID_LOW,
			DefaultSegments.UUID_HIGH
		];

		var PERCENT_MULTIPLIER = .98 * 100;

		var headerTopBarSize = DefaultValueConstants.FieldSizeValues.DMX_HEADER_SIZE;
		var currByte = 0;

		var that = this;
		var content = (
		   <div id = 'header-top-bar-row' className='header-row row center'>{
		   	defaultSegments.map(function(segment, index) {
		   		var widthPercent = Math.round(PERCENT_MULTIPLIER * (segment.size / headerTopBarSize) * 100) / 100;
		   		var segmentStyle = {
		   			width: widthPercent + '%',
		   		}
		   		var segmentContent = segment.name;
		   		var segmentDetails = ''; 
		   		segmentDetails += segment.name + ': ';
		   		segmentDetails += segment.size + ' bytes ';
		   		segmentDetails += ' ('+currByte + ' - ' + (currByte + segment.size - 1)+')';

		   		currByte += segment.size;
		   		return (
		   		   <span key={index} className='header-top-bar-segment header-segment' style={segmentStyle}
		   		    onMouseOver={that.showSegmentDetails} onMouseOut={that.hideSegmentDetails}>
			   		   <div className="header-top-bar-segment-details segment-details no-opacity">
			   		   	{segmentDetails}
			   		   </div>
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

		//98% of true width to account for margins
		//don't display text for fileds below a width of 3%.
		var PERCENT_MULTIPLIER = .98 * 100;
		var MIN_DISPLAY_PERCENT = PERCENT_MULTIPLIER * (6 / 100);

		var that = this;
		var content = (
		   <div id = 'header-bar-row' className='header-row row center'>{
		   	fieldsModel.map(function(fieldModel, index) {
		   		// round to hundreths, no need for more digits
		   		var widthPercent = Math.round(PERCENT_MULTIPLIER * (fieldModel.size / totalSize) * 100) / 100;
		   		widthPercent = Math.max(0.1, widthPercent); //have a minimum width set of 0.1% of the bar
		   		var segmentStyle = {
		   			width: widthPercent + '%',
		   		}
		   		if (widthPercent === 0) { segmentStyle.border = '0'; }

		   		// if segment too short, then hide the text
		   		var PLACEHOLDER_VALUE = '.';
		   		var segmentContent = (widthPercent >= MIN_DISPLAY_PERCENT) ? fieldModel.name : PLACEHOLDER_VALUE;
		   		var segmentDetails = DataVisualizationService.generateFieldModelDetails(fieldModel);

		   		var segmentClassName = 'header-segment header-bar-segment' +
		   			(fieldModel.id === 'field-null-bits' ? ' null-bits-segment' : '');
		   		var segmentContentClassName = 'header-bar-segment-content segment-content' + 
		   		   (segmentContent === PLACEHOLDER_VALUE ? ' transparent-text': '')
		 
		   		return (
		   		   <span key={fieldModel.id} className={segmentClassName} style={segmentStyle}
		   		    onMouseOver={that.showSegmentDetails} onMouseOut={that.hideSegmentDetails}>
		   		    	<div className={segmentContentClassName}>
		   		    		{segmentContent}
		   		    	</div>
			   		   <div className="header-bar-segment-details segment-details no-opacity">
			   		   	{segmentDetails}
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