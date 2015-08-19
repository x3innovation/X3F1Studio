var EventType = require('../../constants/event-type.js');
var DefaultValueConstants = require('../../constants/default-value-constants.js');
var FieldSizeCons = DefaultValueConstants.FieldSizeValues;

var Configs = require('../../app-config.js');

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
		this.updateInterval = setInterval(function() {var a = 1;}, 100000); //empty interval to clear

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
		this.gFields.addEventListener(gapi.drive.realtime.EventType.VALUES_ADDED, this.updateUi);
		this.gFields.addEventListener(gapi.drive.realtime.EventType.VALUES_REMOVED, this.updateUi);
		this.gFields.addEventListener(gapi.drive.realtime.EventType.VALUES_SET, this.updateUi);
		clearInterval(this.updateInterval);
		this.updateInterval = setInterval(this.updateUi, 1000);
		this.updateUi();
	},

	updateUi: function() {
		this.mapFieldData();
		this.forceUpdate();
	},

	mapFieldData: function() {
		if (!this.gFields) { return; }
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

	showFieldModelDetails: function(e) {
		var $fieldSegment = $(e.currentTarget);
		$('.header-bar-component-details').addClass('no-opacity')
		$fieldSegment.find('.header-bar-component-details').removeClass('no-opacity');
	},

	hideFieldModelDetails: function(e) {
		var $fieldSegment = $(e.currentTarget);
		$('.header-bar-component-details').addClass('no-opacity')
	},

	getHeaderBar: function() {
		var fieldsModel = this.fieldsModel;
		var totalSize = this.totalSize - FieldSizeCons.DMX_HEADER_SIZE;

		//98% of true width to account for margins
		var PERCENT_MULTIPLIER = 0.98 * 100;
		var MIN_DISPLAY_PERCENT = PERCENT_MULTIPLIER * (6 / 100);

		var that = this;
		var content = (
		   <div id = 'header-bar-row' className='row center'>{
		   	fieldsModel.map(function(fieldModel, index) {
		   		// round to hundreths, no need for more digits
		   		var widthPercent = Math.round(PERCENT_MULTIPLIER * (fieldModel.size / totalSize) * 100) / 100;
		   		var segmentStyle = {
		   			width: widthPercent + '%',
		   		}
		   		if (widthPercent === 0) { segmentStyle.border = '0'; }
		   		var componentContent = (widthPercent >= MIN_DISPLAY_PERCENT) ? fieldModel.name : '.';
		   		var fieldModelDetails = DataVisualizationService.generateFieldModelDetails(fieldModel);
		 
		   		return (
		   		   <span key={fieldModel.id} className="header-bar-component" style={segmentStyle}
		   		    onMouseOver={that.showFieldModelDetails} onMouseOut={that.hideFieldModelDetails}>
		   		    	<div className={'header-bar-component-content' + 
		   		    	 (componentContent === '.' ? ' transparent-text': '')}>
		   		    		{componentContent}
		   		    	</div>
			   		   <div className="header-bar-component-details no-opacity">
			   		   	{fieldModelDetails}
			   		   </div>
		   		   </span>
		   		);
		   	})
		   }</div>
		);
		return content;
	},

	render: function() {
		var headerBar = this.getHeaderBar();
		return (
			<div>{headerBar}</div>
		);
	}

});