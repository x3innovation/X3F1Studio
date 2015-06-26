var EventType = require('../../constants/event-type.js');
var GDriveConstants = require('../../constants/google-drive-constants.js');
var Cons = GDriveConstants.PersistentData;

var Configs = require('../../app-config.js');

var GDriveService = require('../../services/google-drive-service.js');

module.exports = React.createClass({
	model: {}, 
	
	/* ******************************************
				LIFE CYCLE FUNCTIONS
	****************************************** */
	componentWillMount: function() {
		this.gapiLoaded = false;
		this.model.gQueries = null;
		this.model.queries = [];
		this.model.fieldAttr = {};

		Bullet.on(EventType.PersistentDataEntry.GAPI_FILE_LOADED, 'queries.jsx>>onGapiFileLoaded', this.onGapiFileLoaded);
	}, 

	componentDidMount: function() { 

	}, 

	componentWillUnmount: function() {
		Bullet.off(EventType.PersistentDataEntry.GAPI_FILE_LOADED, 'queries.jsx>>onGapiFileLoaded');
	}, 

	/* ******************************************
				NON LIFE CYCLE FUNCTIONS
	****************************************** */
	onGapiFileLoaded: function(doc) {
		var key = this.props.gapiKey;
		this.model.gQueries = doc.getModel().getRoot().get(key).queries;
		if (!this.model.gQueries) {
			this.model.gQueries = doc.getModel().createList();
		}
		this.model.gQueries.addEventListener(gapi.drive.realtime.EventType.VALUES_ADDED, this.updateUi);
		this.model.gQueries.addEventListener(gapi.drive.realtime.EventType.VALUES_REMOVED, this.updateUi);
		this.model.gQueries.addEventListener(gapi.drive.realtime.EventType.VALUES_SET, this.updateUi);
		this.updateUi();
		this.gapiLoaded = true;
	},

	updateUi: function(e) {
		this.model.queries = this.model.gQueries.asArray();
		this.forceUpdate();
		this.setCursorPos();
		this.realignLabels();
	},

	keyUpHandler: function(e) {
		if (!this.gapiLoaded) {
			return;
		}
		var $fieldAttr = $(e.target);
		var code = (e.keyCode);
		var arrowKeyCodes = [37,38,39,40];
		if (arrowKeyCodes.indexOf(code) >= 0) {
			return;
		}
		this.model.fieldAttr.attr = $fieldAttr;
		this.model.fieldAttr.pos = $fieldAttr[0].selectionStart;

		var $queryRow = $fieldAttr.closest('.query-row');
		var queryId = parseInt($queryRow.attr('data-query-id'), 10);
		var queries = this.model.gQueries.asArray();
		for (i = 0, len = queries.length; i<len; i += 1) {
			if(queries[i].id == queryId) {
				this.model.gQueries.set(i, {
					requestId: queryId,
					responseId: queryId+1,
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
			if ($(this).val().length>0) {
				$(this).next('label').addClass('active');
			} else {
				$(this).next('label').removeClass('active');
			}
		});
	}, 

	setCursorPos: function() {
		if (this.model.fieldAttr.attr) {
			this.model.fieldAttr.attr[0].setSelectionRange(this.model.fieldAttr.pos, this.model.fieldAttr.pos);
		} else {
			return;
		}
	}, 

	onAddBtnClick: function(e) {
		if (this.gapiNotLoaded) {
			return;
		}
		clearTimeout(this.createQueryTimeout);
		this.createQueryTimeout = setTimeout(this.createNewQuery, 500);
	},

	createNewQuery: function() {
		var that = this;
		GDriveService.getMetadataModelId(that.props.projectFileId, function(id) {
			$('.query-id-field').each(function(index, element) {
				if (""+id === ""+$(this).val()) {
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
			that.model.gQueries.push(newQuery);
		}, 2);
	},

	onQueryDeleteBtnClick: function(e) {
		if (this.gapiNotLoaded) {
			return;
		}
		var $clickedBtn = $(e.target).parent('.query-delete-btn');
		var delId = $clickedBtn.attr('data-query-id');
		var queries = this.model.gQueries.asArray();
		for (i = 0, len = queries.length; i<len; i += 1) {
			if (""+queries[i].id === ""+delId) {
				this.model.gQueries.remove(i);
				break;
			}
		}
	},

	render: function() {
		var queries = this.model.queries;
		var queryContents = queries.map(function(query, index) {
			return (
				<div className = 'query-row row' key = {"query-id-"+query.id} data-query-id = {query.id}>
					<div className = 'col s1 input-field query-id-wrapper'>
						<input type = 'text' id = {"query-"+query.id+"-id-field"} disabled className = 'query-id-field' value = {query.id} />
						<label htmlFor = {"query-"+query.id+"-id-field"} className = "query-label active">query id</label>
					</div>
					<div className = 'col s2 input-field query-name-wrapper'>
						<input type = 'text' id = {"query-"+query.id+"-name-field"} className = 'query-name-field query-input' onKeyUp = {this.keyUpHandler} defaultValue = {query.name} />
						<label htmlFor = {"query-"+query.id+"-name-field"} className = 'query-label'>query name</label>
					</div>
					<div className = 'col s8 input-field query-description-wrapper'>
						<textarea id = {"query-"+query.id+"-description-field"} className = 'query-description-field materialize-textarea query-input' onKeyUp = {this.keyUpHandler} defaultValue = {query.description} />
						<label htmlFor = {"query-"+query.id+"-description-field"} className = 'query-label'>query description</label>
					</div>
					<div className = 'col s1 delete-query-btn-wrapper'>
						<a id = {"query-"+query.id+"-delete-btn"} onClick = {this.onQueryDeleteBtnClick} data-query-id = {query.id} className = 'query-delete-btn btn-floating waves-effect waves-light red'>
							<i className = 'mdi-content-clear query-delete-btn-icon' />
						</a>
					</div>
				</div>
			);
		}, this);
		return(
			<div id = 'query-container' className = 'row'>
				<div className = 'row'>
					<div className = 'col s2'>
						<a id = 'query-add-btn' onClick = {this.onAddBtnClick} className = {'btn-floating waves-effect waves-light '+Configs.App.ADD_BUTTON_COLOR}>
							<i className = 'mdi-content-add btn-icon query-add-btn-icon' />
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