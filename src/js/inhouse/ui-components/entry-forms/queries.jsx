var EventType = require('../../constants/event-type.js');
var DefaultValueConstants = require('../../constants/default-value-constants.js');

var Configs = require('../../app-config.js');

var GDriveService = require('../../services/google-drive-service.js');

module.exports = React.createClass({
	/* ******************************************
				LIFE CYCLE FUNCTIONS
	****************************************** */
	componentWillMount: function() {
		this.gModel = null;
		this.gQueries = null;
		this.queries = [];
		this.fieldAttr = {};

		Bullet.on(EventType.EntryForm.GAPI_FILE_LOADED, 'queries.jsx>>onGapiFileLoaded', this.onGapiFileLoaded);
	},

	componentWillUnmount: function() {
		if (this.gQueries) { this.gQueries.removeAllEventListeners(); }

		Bullet.off(EventType.EntryForm.GAPI_FILE_LOADED, 'queries.jsx>>onGapiFileLoaded');
	},

	/* ******************************************
				NON LIFE CYCLE FUNCTIONS
	****************************************** */
	onGapiFileLoaded: function(doc) {
		this.gQueries = doc.getModel().getRoot().get(this.props.gapiKey).queries;
		if (!this.gQueries) {
			this.gQueries = doc.getModel().createList();
		}
		this.gQueries.addEventListener(gapi.drive.realtime.EventType.VALUES_ADDED, this.updateUi);
		this.gQueries.addEventListener(gapi.drive.realtime.EventType.VALUES_REMOVED, this.updateUi);
		this.gQueries.addEventListener(gapi.drive.realtime.EventType.VALUES_SET, this.updateUi);
		this.updateUi();
		$('.query-parameters-wrapper').hide('blind');
	},

	updateUi: function() {
		this.forceUpdate();
		this.setCursorPos();
		this.realignLabels();
	},

	keyUpHandler: function(e) {
		var $fieldAttr = $(e.target);
		var code = (e.keyCode);
		var arrowKeyCodes = [37, 38, 39, 40];
		if (arrowKeyCodes.indexOf(code) >= 0) { return;	}
		this.fieldAttr.attr = e.target;
		this.fieldAttr.pos = e.target.selectionStart;

		this.updateQuery($fieldAttr);
	},

	updateQuery: function($fieldAttr) {
		var $queryRow = $fieldAttr.closest('.query-row');
		var queryId = parseInt($queryRow.attr('data-query-id'), 10);
		for (var i = 0, len = this.gQueries.length; i<len; i++) {
			if (parseInt(this.gQueries.get(i).id, 10) === queryId) {
				var newQuery = {
					requestId: queryId,
					responseId: queryId + 1,
					id: queryId,
					name: $queryRow.find('.query-name-field').val(),
					description: $queryRow.find('.query-description-field').val(),
					parameters: this.gQueries.get(i).parameters
				};
				this.gQueries.set(i, newQuery);
				break;
			}
		}
	},

	realignLabels: function() {
		$('.query-input').each(function(index, element) {
			var $element = $(element);
			if ($element.val().length) {
				$element.next('label').addClass('active');
			} else {
				$element.next('label').removeClass('active');
			}
		});
	},

	setCursorPos: function() {
		var fieldAttr = this.fieldAttr;
		if (fieldAttr.attr) { fieldAttr.attr.setSelectionRange(fieldAttr.pos, fieldAttr.pos); }
	},

	createNewQuery: function() {
		var that = this;
		GDriveService.getMetadataModelId(that.props.projectFileId, function(id) {
			var thisId = id;
			var requestId = thisId++;
			var responseId = thisId++;
			var newQuery = {
				requestId: requestId,
				responseId: responseId,
				id: requestId,
				name: DefaultValueConstants.DefaultQueryAttributes.QUERY_NAME,
				description: DefaultValueConstants.DefaultQueryAttributes.QUERY_DESCRIPTION,
				parameters: []
			};
			that.gQueries.push(newQuery);
		}, 2);
	},

	onAddQueryBtnClick: function(e) {
		clearTimeout(this.createQueryTimeout);
		this.createQueryTimeout = setTimeout(this.createNewQuery, 200);
	},

	onDeleteQueryBtnClick: function(e) {
		var qId  = e.currentTarget.dataset.queryId;
		for (var i = 0, len = this.gQueries.length; i<len; i++) {
			if ('' + this.gQueries.get(i).id === '' + qId) {
				this.gQueries.remove(i);
				break;
			}
		}
	},

	onAddQueryParameterBtnClick: function(e) {
		var qId = e.currentTarget.dataset.queryId;
		var newParam = {};
		for (var i = 0, len = this.gQueries.length; i<len; i++) {
			if ('' + this.gQueries.get(i).id === '' + qId) {
				this.gQueries.get(i).parameters.push(newParam);
				break;
			}
		}
		e.stopPropagation();
	},

	showParameters: function(e) {
		$('.query-parameters-wrapper').hide('blind');
		$(e.currentTarget).find('.query-parameters-wrapper').finish().show('blind');
	},

	getQParams: function(query) {
		var qParams = query.parameters;
		var paramFields = qParams.map(function(parameter) {
			return (<div></div>);
		});
		return (paramFields);
	},

	render: function() {
		var queries = [];
		if (this.gQueries) {
			queries = this.gQueries.asArray();
		}
		var queryContents = queries.map(function(query) {
			var qParams = this.getQParams(query);
			return (
				<div className = 'query-row row' key = {query.id} data-query-id = {query.id} onClick = {this.showParameters}>
					<div className = 'col s1 input-field query-id-wrapper'>
						<input type = 'text' id = {'query-' + query.id + '-id-field'} readOnly className = 'query-id-field' value = {query.id} />
						<label htmlFor = {'query-' + query.id + '-id-field'} className = 'query-label active'>query id</label>
					</div>
					<div className = 'col s2 input-field query-name-wrapper'>
						<input type = 'text' id = {'query-' + query.id + '-name-field'} className = 'query-name-field query-input'
						 	onKeyUp = {this.keyUpHandler} defaultValue = {query.name} spellCheck = 'false' />
						<label htmlFor = {'query-' + query.id + '-name-field'} className = 'query-label'>query name</label>
					</div>
					<div className = 'col s8 input-field query-description-wrapper'>
						<textarea id = {'query-' + query.id + '-description-field'} className = 'query-description-field materialize-textarea query-input'
							onKeyUp = {this.keyUpHandler} defaultValue = {query.description} spellCheck = 'false' />
						<label htmlFor = {'query-' + query.id + '-description-field'} className = 'query-label'>query</label>
					</div>
					<div className = 'col s1 query-btns-wrapper'>
						<a id = {'query-' + query.id + '-add-parameter-btn'} onClick = {this.onAddQueryParameterBtnClick} data-query-id = {query.id} 
						   className = {'query-add-parameter-btn small-btn btn-floating waves-effect waves-light ' + Configs.App.ADD_BUTTON_COLOR}>
							<i className = 'mdi-content-add' />
						</a>
						<a id = {'query-' + query.id + '-delete-btn'} onClick = {this.onDeleteQueryBtnClick} data-query-id = {query.id}
						   className = 'query-delete-btn small-btn btn-floating waves-effect waves-light materialize-red'>
							<i className = 'mdi-content-clear' />
						</a>
					</div>
					<div className = 'col s12 query-parameters-wrapper' onClick = {function(e) { e.stopPropagation(); }}>
						{qParams}
					</div>
				</div>
			);
		}, this);
		return (
			<div id = 'query-container' className = 'row'>
				<div className = 'row'>
					<div className = 'col s6'>
						<a id = 'query-add-btn' onClick = {this.onAddQueryBtnClick} className = {'small-btn query-btn btn-floating waves-effect waves-light ' + Configs.App.ADD_BUTTON_COLOR}>
							<i className = 'mdi-content-add btn-icon' />
						</a>
						<label htmlFor = 'query-add-btn' id = 'add-query-label'>add query</label>
					</div>
				</div>
				<br />
				{queryContents}
			</div>
		);
	}
});
