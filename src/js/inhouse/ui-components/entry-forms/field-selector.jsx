var EventType = require('../../constants/event-type.js');
var DefaultValueConstants = require('../../constants/default-value-constants.js');
var DefaultFields = DefaultValueConstants.DefaultFieldAttributes;

var Configs = require('../../app-config.js');

module.exports = React.createClass({
	/* ******************************************
				LIFE CYCLE FUNCTIONS
	****************************************** */
	componentWillMount: function() {
		this.fields = [];
		this.gFields = null;
		this.table = null;
		this.selectedFieldID = null;
		this.gapiLoaded = false;

		Bullet.on(EventType.EntryForm.GAPI_FILE_LOADED, 'field-selector.jsx>>onGapiFileLoaded', this.onGapiFileLoaded);
	},

	componentDidMount: function() {
		this.initializeTooltips();
	},

	componentWillUnmount: function() {
		Bullet.off(EventType.EntryForm.GAPI_FILE_LOADED, 'field-selector.jsx>>onGapiFileLoaded');
	},

	/* ******************************************
			NON LIFE CYCLE FUNCTIONS
	****************************************** */
	initializeTable: function() {
		this.table = $('#field-table').DataTable({
			data: this.fields,
			destroy: true,
			scrollY: 330,
			paging: false,
			info: false,
			ordering: false,
			search: {
				caseInsensitive: true
			},
			language: {
				search: '_INPUT_', //removes the 'search:' text, puts it directly in the searchbox
				searchPlaceholder: 'search fields',
				emptyTable: 'no fields defined'
			},
			columnDefs: [{
				targets: 0,
				data: 'ID',
				className: 'field-ID-cell hide'
			}, {
				targets: 1,
				data: 'name',
				className: 'field-cell'
			}]
		});
		this.table.order([0, 'asc']);
		$('th').removeClass('field-ID-cell field-cell');
		$('.field-cell').each(function(index, element) {
			var $element = $(element);
			$element.attr('id', '' + $element.text() + '-cell');
			if (!$element.text()) {
				$element.addClass('empty-cell');
			}
		});
		$('.field-cell').on('click', this.onFieldClick);
	},

	initializeTooltips: function() {
		$.fn.tooltipster('setDefaults', {
			position: 'top',
			trigger: 'click',
			speed: 250,
			interactive: true,
			onlyOne: true
		});

		$('.delete-tooltipped').tooltipster({
			content: $('<a class="delete-tooltip waves-effect waves btn-flat">delete</a>').on('click', this.onDeleteBtnClick)
		});
	},

	onGapiFileLoaded: function(doc) {
		var key = this.props.gapiKey;
		this.gFields = doc.getModel().getRoot().get(key).fields;
		this.gFields.addEventListener(gapi.drive.realtime.EventType.VALUES_ADDED, this.updateUi);
		this.gFields.addEventListener(gapi.drive.realtime.EventType.VALUES_REMOVED, this.updateUi);
		this.gFields.addEventListener(gapi.drive.realtime.EventType.VALUES_SET, this.updateUi);
		this.updateUi();
		this.gapiLoaded = true;
	},

	updateUi: function() {
		this.fields = this.gFields.asArray();
		this.initializeTable();
		this.selectField();
	},

	saveNewField: function(newFieldName) {
		if (!this.gFields) {
			return false;
		}
		var fields = this.gFields.asArray();
		for (var i = 0, len = fields.length; i < len; i += 1) { //don't add if the field already exists
			if (fields[i].name === newFieldName) {
				return false;
			}
		}
		var newField = {
			ID: this.selectedFieldID,
			name: newFieldName,
			type: DefaultFields.FIELD_TYPE,
			description: DefaultFields.FIELD_DESCRIPTION,
			defaultValue: DefaultFields.FIELD_DEF_VALUE,
			minValue: DefaultFields.FIELD_MIN_VALUE,
			maxValue: DefaultFields.FIELD_MAX_VALUE,
			strLength: DefaultFields.FIELD_STR_LEN,
			readOnly: DefaultFields.FIELD_READ_ONLY,
			optional: DefaultFields.FIELD_OPTIONAL,
			array: DefaultFields.FIELD_ARRAY,
			arrayLen: DefaultFields.FIELD_ARRAY_LEN,
			refId: DefaultFields.FIELD_REF_ID,
			refType: DefaultFields.FIELD_REF_TYPE,
			enumName: DefaultFields.FIELD_ENUM_NAME,
			contextId: DefaultFields.FIELD_CONTEXT_ID
		};
		this.gFields.push(newField);
	},

	saveRemovedField: function(removedFieldID) {
		if (!this.gFields) {
			return false;
		}
		var fields = this.gFields.asArray();
		for (var i = 0, len = fields.length; i < len; i += 1) {
			if ('' + fields[i].ID === removedFieldID) {
				this.gFields.remove(i);
				return true;
			}
		}
	},

	selectTopCell: function() {
		if ($('.field-cell').length === 0) {
			return false;
		}
		$('.field-cell').first().addClass('selected-cell');
		var $selectedCell = $('.selected-cell');
		var cellIndex = this.table.cell($selectedCell).index();
		var thisRow = this.table.row(cellIndex.row).node();
		this.selectedFieldID = $(thisRow).find('.field-ID-cell').text();
		var selectedFieldName = $selectedCell.text();
		var data = {
			selectedField: selectedFieldName,
			fieldCount: $('.field-cell').length
		};
		Bullet.trigger(EventType.EntryForm.FIELD_SELECTED, data);
	},

	selectField: function() {
		if (!this.selectedFieldID) {
			return false;
		}
		this.unselectSelectedCell();
		var table = this.table;
		var selectedFieldID = this.selectedFieldID;
		var selectedFieldName = '';
		if ($('.field-cell').length >= 0) {
			$('.field-ID-cell').each(function(index, element) {
				var $element = $(element);
				if ($element.text() === selectedFieldID) {
					var cellIndex = table.cell($element).index();
					var thisRow = table.row(cellIndex.row).node();
					$(thisRow).find('td.field-cell').addClass('selected-cell');
					selectedFieldName = $('.selected-cell').text();
					$('.dataTables_scrollBody').scrollTop($('.selected-cell').position().top - 100);
				}
			});
		}
		var data = {
			selectedField: selectedFieldName,
			fieldCount: $('.field-cell').length
		};
		Bullet.trigger(EventType.EntryForm.FIELD_SELECTED, data);
	},

	unselectSelectedCell: function() {
		if ($('.selected-cell').length === 0) {
			return false;
		}
		$('.selected-cell').removeClass('selected-cell');
	},

	onAddBtnClick: function() {
		if (!this.gapiLoaded) {
			return;
		}
		// getting the first value N where newField_ is not currently used
		var NEW_FIELD_NAME = 'newField_';
		var newFieldNum = 0;
		var digitsList = [];
		$('.field-cell').each(function(index, element) {
			var $element = $(element);
			if ($element.text().indexOf(NEW_FIELD_NAME) === 0) {
				digitsList.push($element.text().substring(NEW_FIELD_NAME.length));
			}
		});
		while (digitsList.indexOf('' + newFieldNum) >= 0) {
			newFieldNum++;
		}
		var newFieldName = NEW_FIELD_NAME + newFieldNum;
		var newIndex = 1;
		$('.field-ID-cell').each(function(index, element) {
			var $element = $(element);
			if (parseInt($element.text(), 10) >= newIndex) {
				newIndex = parseInt($element.text(), 10) + 1;
			}
		});
		this.selectedFieldID = '' + newIndex;
		this.saveNewField(newFieldName);
	},

	onDeleteBtnClick: function() {
		if ($('.selected-cell').length === 0) {
			return false;
		}
		var $selectedCell = $('.selected-cell');
		var cellIndex = this.table.cell($selectedCell).index();
		var thisRow = this.table.row(cellIndex.row).node();
		var removedFieldID = $(thisRow).find('.field-ID-cell').text();
		this.saveRemovedField(removedFieldID);

		$('.delete-tooltipped').tooltipster('hide');
		this.selectTopCell();
	},

	onFieldClick: function(e) {
		var $clickedCell = $(e.currentTarget);
		if ($clickedCell.hasClass('selected-cell')) {
			return false;
		}
		this.unselectSelectedCell();
		$clickedCell.addClass('selected-cell');
		var cellIndex = this.table.cell($clickedCell).index();
		var thisRow = this.table.row(cellIndex.row).node();
		this.selectedFieldID = $(thisRow).find('.field-ID-cell').text();
		var selectedFieldName = $clickedCell.text();
		var data = {
			selectedField: selectedFieldName,
			fieldCount: $('.field-cell').length
		};
		Bullet.trigger(EventType.EntryForm.FIELD_SELECTED, data);
	},

	render: function() {
		var contentTable;
		contentTable = (
			<div>
				<table id = 'field-table' className = 'dataTable hoverable'>
					<thead>
						<tr>
							<th><div className = 'hide field-ID-table-header'></div></th>
							<th><div className = 'field-table-header'>fields</div></th>
						</tr>
					</thead>
					<tbody></tbody>
				</table>
				<div>
					<a id = 'field-add-btn' onClick = {this.onAddBtnClick}
					className = {'small-btn btn-floating waves-effect waves-light ' + Configs.App.ADD_BUTTON_COLOR}>
						<i className = 'mdi-content-add btn-icon' /></a>
					<a id = 'field-delete-btn' className = 'delete-tooltipped small-btn btn-floating waves-effect waves-light red'>
						<i className = 'mdi-content-clear btn-icon' /></a>
				</div>
			</div>
		);

		return (<div className = 'col s12'>{contentTable}</div>);
	}
});
