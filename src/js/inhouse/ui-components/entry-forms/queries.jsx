var EventType = require('../../constants/event-type.js');
var DefaultValueConstants = require('../../constants/default-value-constants.js');

var Configs = require('../../app-config.js');

var GDriveUtils = require('../../utils/google-drive-utils.js');

module.exports = React.createClass({
	/* ******************************************
				LIFE CYCLE FUNCTIONS
	****************************************** */
	componentWillMount: function() {
		this.gModel = null;
		this.gQueries = null;
		this.queries = [];
		this.fieldAttr = {};
		this.controller = this.props.controller;
	},

	componentDidMount: function(){
		this.controller.addQueriesUpdateListener(this.updateUi);
		this.updateUi();
	},

	componentDidUpdate: function(){
		// update the business request checkboxes
		var queries = this.controller.getQueries();
		for (var i in queries){
			$checkbox = $('.business-request-checkbox[data-query-id="'+queries[i].id+'"]');
			$checkbox.prop('checked', queries[i].isBusinessRequest);
		}
	},

	/* ******************************************
				NON LIFE CYCLE FUNCTIONS
	****************************************** */
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
		var queryId = $queryRow.attr('data-query-id');
		var name = $queryRow.find('.query-name-field').val();
		var description = $queryRow.find('.query-description-field').val();

		this.controller.updateQuery(queryId, name, description);
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
		this.controller.createNewQuery();
	},

	onAddQueryBtnClick: function(e) {
		clearTimeout(this.createQueryTimeout);
		this.createQueryTimeout = setTimeout(this.createNewQuery, 200);
	},

	onDeleteQueryBtnClick: function(e) {
		var queryId  = e.currentTarget.dataset.queryId;
		this.controller.deleteQuery(queryId);
	},

	onBusinessRequestClicked: function(e){
		$checkbox = $(e.target);
		var queryId = $checkbox.attr('data-query-id');
		var isBusinessRequest = $checkbox.prop('checked');
		this.controller.setBusinessRequest(queryId, isBusinessRequest);
	},

	render: function() {
		var queries = this.controller.getQueries();
		var queryContents = queries.map(function(query) {

			var businessRequestCheckboxId = query.id + '-checkbox';

			return (
				<div className = 'query-row row' key = {query.id} data-query-id = {query.id}>
					<div className='row'>
						<div className = 'col s3 offset-s1 input-field query-name-wrapper'>
							<input type = 'text' id = {'query-' + query.id + '-name-field'} className = 'query-name-field query-input'
							 	onKeyUp = {this.keyUpHandler} defaultValue = {query.name} spellCheck = 'false' />
							<label htmlFor = {'query-' + query.id + '-name-field'} className = 'query-label'>query name</label>
						</div>
						<div className = 'col s7 input-field query-description-wrapper'>
							<textarea id = {'query-' + query.id + '-description-field'} className = 'query-description-field materialize-textarea query-input'
								onKeyUp = {this.keyUpHandler} defaultValue = {query.description} spellCheck = 'false' />
							<label htmlFor = {'query-' + query.id + '-description-field'} className = 'query-label'>query</label>
						</div>
						<div className = 'col s1 query-btns-wrapper'>
							<a id = {'query-' + query.id + '-delete-btn'} onClick = {this.onDeleteQueryBtnClick} data-query-id = {query.id}
							   className = 'query-delete-btn small-btn btn-floating waves-effect waves-light materialize-red'>
								<i className = 'mdi-content-clear' />
							</a>
						</div>
					</div>
					<div className='row business-request-container'>
						<input type='checkbox' 
							id={businessRequestCheckboxId} 
							className='filled-in business-request-checkbox'
							data-query-id={query.id}
							defaultChecked={query.isBusinessRequest}
							onChange={this.onBusinessRequestClicked} />
						<label htmlFor={businessRequestCheckboxId}>Business Request</label>
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
