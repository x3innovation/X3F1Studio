var EventType = require('../../constants/event-type.js');
var Configs = require('../../app-config.js');

var GDriveService = require('../../services/google-drive-service.js');

module.exports = React.createClass({
	/* ******************************************
				LIFE CYCLE FUNCTIONS
	****************************************** */
	componentWillMount: function() {
		this.gapiNotLoaded = true;
		this.gQueries = null;
		this.queries = [];
		this.fieldAttr = {};

		Bullet.on(EventType.EntryForm.GAPI_FILE_LOADED, 'queries.jsx>>onGapiFileLoaded', this.onGapiFileLoaded);
	},

	componentDidMount: function() {

	},

	componentWillUnmount: function() {
		Bullet.off(EventType.EntryForm.GAPI_FILE_LOADED, 'queries.jsx>>onGapiFileLoaded');
	},

	/* ******************************************
				NON LIFE CYCLE FUNCTIONS
	****************************************** */
	onGapiFileLoaded: function(doc) {
		this.gapiNotLoaded = false;
		var key = this.props.gapiKey;
		this.gQueries = doc.getModel().getRoot().get(key).queries;
		if (!this.gQueries) {
			this.gQueries = doc.getModel().createList();
		}
		this.gQueries.addEventListener(gapi.drive.realtime.EventType.VALUES_ADDED, this.updateUi);
		this.gQueries.addEventListener(gapi.drive.realtime.EventType.VALUES_REMOVED, this.updateUi);
		this.gQueries.addEventListener(gapi.drive.realtime.EventType.VALUES_SET, this.updateUi);
		this.updateUi();
	},

	updateUi: function() {
		this.queries = this.gQueries.asArray();
		this.forceUpdate();
		this.setCursorPos();
		this.realignLabels();
	},

	keyUpHandler: function(e) {
		if (this.gapiNotLoaded) {
			return;
		}
		var $fieldAttr = $(e.target);
		var code = (e.keyCode);
		var arrowKeyCodes = [37, 38, 39, 40];
		if (arrowKeyCodes.indexOf(code) >= 0) {
			return;
		}
		this.fieldAttr.attr = $fieldAttr;
		this.fieldAttr.pos = $fieldAttr[0].selectionStart;

		var $queryRow = $fieldAttr.closest('.query-row');
		var queryId = parseInt($queryRow.attr('data-query-id'), 10);
		var queries = this.gQueries.asArray();
		for (var i = 0, len = queries.length; i < len; i += 1) {
			if(parseInt(queries[i].id, 10) === queryId) {
				this.gQueries.set(i, {
					requestId: queryId,
					responseId: queryId + 1,
					idc: -1,
					id: queryId,
					name: $queryRow.find('.query-name-field').val(),
					description: $queryRow.find('.query-description-field').val()
				});
				break;
			}
		}
	},

	realignLabels: function() {
		$('.query-input').each(function(index, element) {
			var $element = $(element);
			if ($element.val().length > 0) {
				$element.next('label').addClass('active');
			} else {
				$element.next('label').removeClass('active');
			}
		});
	},

	setCursorPos: function() {
		if (this.fieldAttr.attr) {
			this.fieldAttr.attr[0].setSelectionRange(this.fieldAttr.pos, this.fieldAttr.pos);
		} else {
			return;
		}
	},

	onAddQueryBtnClick: function() {
		if (this.gapiNotLoaded) {
			return;
		}
		clearTimeout(this.createQueryTimeout);
		this.createQueryTimeout = setTimeout(this.createNewQuery, 300);
	},

	createNewQuery: function() {
		var _this = this;
		GDriveService.getMetadataModelId(_this.props.projectFileId, function(id) {
			$('.query-id-field').each(function(index, element) {
				var $element = $(element);
				if ('' + id === '' + $element.val()) {
					id += 2;
				}
			});
			var thisId = id;
			var requestId = thisId++;
			var responseId = thisId++;
			var newQuery = {
				requestId: requestId,
				responseId: responseId,
				idc: -1,
				id: requestId,
				name: null,
				description: null
			};
			_this.gQueries.push(newQuery);
		}, 2);
	},

	onDeleteQueryBtnClick: function(e) {
		if (this.gapiNotLoaded) {
			return;
		}
		var $clickedBtn = $(e.target).parent('.query-delete-btn');
		var delId = $clickedBtn.attr('data-query-id');
		var queries = this.gQueries.asArray();
		for (var i = 0, len = queries.length; i < len; i += 1) {
			if ('' + queries[i].id === '' + delId) {
				this.gQueries.remove(i);
				break;
			}
		}
	},

	render: function() {
		var queries = this.queries;
		var queryContents = queries.map(function(query) {
			return (
				<div className = 'query-row row' key = {'query-id-' + query.id} data-query-id = {query.id}>
					<div className = 'col s1 input-field query-id-wrapper'>
						<input type = 'text' id = {'query-' + query.id + '-id-field'} disabled className = 'query-id-field' value = {query.id} />
						<label htmlFor = {'query-' + query.id + '-id-field'} className = 'query-label active'>query id</label>
					</div>
					<div className = 'col s2 input-field query-name-wrapper'>
						<input type = 'text' id = {'query-' + query.id + '-name-field'} className = 'query-name-field query-input' onKeyUp = {this.keyUpHandler} defaultValue = {query.name} />
						<label htmlFor = {'query-' + query.id + '-name-field'} className = 'query-label'>query name</label>
					</div>
					<div className = 'col s8 input-field query-description-wrapper'>
						<textarea id = {'query-' + query.id + '-description-field'} className = 'query-description-field materialize-textarea query-input' onKeyUp = {this.keyUpHandler} defaultValue = {query.description} />
						<label htmlFor = {'query-' + query.id + '-description-field'} className = 'query-label'>query description</label>
					</div>
					<div className = 'col s1 delete-query-btn-wrapper'>
						<a id = {'query-' + query.id + '-delete-btn'} onClick = {this.onDeleteQueryBtnClick} data-query-id = {query.id} className = 'query-delete-btn small-btn btn-floating waves-effect waves-light red'>
							<i className = 'mdi-content-clear' />
						</a>
					</div>
				</div>
			);
		}, this);
		return (
			<div id = 'query-container' className = 'row'>
				<div className = 'row'>
					<div className = 'col s2'>
						<a id = 'query-add-btn' onClick = {this.onAddQueryBtnClick} className = {'small-btn btn-floating waves-effect waves-light ' + Configs.App.ADD_BUTTON_COLOR}>
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
