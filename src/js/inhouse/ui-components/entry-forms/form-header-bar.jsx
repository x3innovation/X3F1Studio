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

		Bullet.on(EventType.EntryForm.GAPI_FILE_LOADED, 'form-header-bar.jsx>>onGapiFileLoaded', this.onGapiFileLoaded);
	},

	componentWillUnmount: function() {
		if (this.gFields) { this.gFields.removeAllEventListeners(); }

		Bullet.off(EventType.EntryForm.GAPI_FILE_LOADED, 'form-header-bar.jsx>>onGapiFileLoaded');
	},


	/* ******************************************
	          NON LIFE CYCLE FUNCTIONS
	****************************************** */

	onGapiFileLoaded: function(doc) {
		this.gFields = doc.getModel().getRoot().get(this.props.gapiKey).fields;
		this.updateUi();
		setInterval(this.updateUi, 1000);
	},

	updateUi: function() {
		this.mapFieldData();
		this.forceUpdate();
	},

	mapFieldData: function() {
		if (!this.gFields) { return; }
		var oldSize = this.totalSize;
		this.fieldsModel = [];
		this.totalSize =  FieldSizeCons.NULLBITS_SIZE;

		this.fieldsModel.push({
			name: "Field Null Bits",
			size: FieldSizeCons.NULLBITS_SIZE
		})
		for (var i = 0, len = this.gFields.length; i<len; i++) {
			fieldModel = DataVisualizationService.generateFieldModel(this.gFields.get(i));
			this.totalSize += fieldModel.size;
			this.fieldsModel.push(fieldModel);
		}
	},

	getHeaderBar: function() {
		var fieldsModel = this.fieldsModel;
		var totalSize = this.totalSize;
		//98% of true width to account for margins
		var PERCENT_MULTIPLIER = 0.98 * 100
		var content = (
		   <div id = 'header-bar-row' className='row center'>{
		   	fieldsModel.map(function(fieldModel, index) {
		   		var widthPercent = (PERCENT_MULTIPLIER * (fieldModel.size / totalSize));
		   		var segmentStyle = {
		   			width: (Math.floor(widthPercent * 10) / 10) + '%',
		   		}

		   		return (
		   		   <span key={fieldModel.id} data-field-id={fieldModel.id} 
		   		    className="materialize-red header-bar-component" style={segmentStyle}>
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