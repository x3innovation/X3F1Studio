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
		this.totalSize = 0;

		this.fieldsModel.push({
			name: "Field Null Bits",
			size: FieldSizeCons.NULLBITS_SIZE,
			startByte: this.totalSize,
			endByte: this.totalSize + FieldSizeCons.NULLBITS_SIZE
		})
		this.totalSize += FieldSizeCons.NULLBITS_SIZE;

		for (var i = 0, len = this.gFields.length; i<len; i++) {
			fieldModel = DataVisualizationService.generateFieldModel(this.gFields.get(i), this.totalSize);
			this.totalSize += fieldModel.size;
			this.fieldsModel.push(fieldModel);
		}
	},

	showFieldModel: function(e) {
		var fieldSegment = e.currentTarget;
		var fieldModel = JSON.parse(fieldSegment.dataset.fieldModel);
		console.log(fieldModel);
	},

	hideFieldModel: function(e) {

	},

	getHeaderBar: function() {
		var fieldsModel = this.fieldsModel;
		var totalSize = this.totalSize;
		//98% of true width to account for margins
		var PERCENT_MULTIPLIER = 0.98 * 100;
		var MIN_DISPLAY_PERCENT = PERCENT_MULTIPLIER * 0.12;

		var that = this;
		var content = (
		   <div id = 'header-bar-row' className='row center'>{
		   	fieldsModel.map(function(fieldModel, index) {
		   		var widthPercent = (PERCENT_MULTIPLIER * (fieldModel.size / totalSize));
		   		var segmentStyle = {
		   			width: (Math.round(widthPercent * 100) / 100) + '%',
		   		}
		   		var spanContent = (widthPercent >= MIN_DISPLAY_PERCENT) ? fieldModel.name : '';
		   		var fieldModelDetails = DataVisualizationService.generateFieldModelDetails(fieldModel);

		   		return (
		   		   <span key={fieldModel.id || 'field-nullbits'} className="header-bar-component" style={segmentStyle}
		   		    data-field-model = {JSON.stringify(fieldModel)} onMouseEnter = {that.showFieldModel} onMouseLeave = {that.hideFieldModel}>
		   		    {spanContent}
		   		    <div className="header-bar-component-details hide">
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