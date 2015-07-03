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
		this.gBindings = {};
		this.gFields = null;
		this.gModel = null;
		this.selectedFieldID = null;
		this.table = null;

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
	onGapiFileLoaded: function(doc) {
		this.gModel = doc.getModel();
		this.gFields = this.gModel.getRoot().get(this.props.gapiKey).fields;
		this.gFields.addEventListener(gapi.drive.realtime.EventType.VALUES_ADDED, this.updateUi);
		this.gFields.addEventListener(gapi.drive.realtime.EventType.VALUES_REMOVED, this.updateUi);
		this.updateUi();
	},

	updateUi: function(e) {
		this.repopulateFields();
		this.initializeTable();
		this.selectField();
		this.rebindStrings();
	},

	repopulateFields: function() {
		this.fields = [];
		var gField;
		var field;
		for (var i = 0, len = this.gFields.length; i < len; i += 1) {
			gField = this.gFields.get(i);
			field = {};
			field.ID = gField.get('ID');
			field.name = gField.get('name').toString();
			this.fields.push(field);
		}
	},

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
				render: function (data, type, row, meta) {
			     	return '<input readOnly class="field-table-input" type="text" data-field-id="'+row.ID+'" value='+data+'></input>';
			    },
				className: 'field-cell'
			}]
		});
		this.table.order([0, 'asc']);
		$('th').removeClass('field-ID-cell field-cell');
		var fieldClickHandler = this.onFieldClick;
		$('.field-cell').each(function(index, element) {
			var $element = $(element);
			$element.attr('id', '' + $element.find('input').val() + '-cell');
			$element.click(fieldClickHandler);
		});
	},

	initializeTooltips: function() {
		$.fn.tooltipster('setDefaults', {
			position: 'top',
			trigger: 'click',
			speed: 250,
			interactive: true,
			onlyOne: false
		});

		$('.delete-tooltipped').tooltipster({
			content: $('<a class="delete-tooltip waves-effect waves btn-flat">delete</a>').on('click', this.onDeleteBtnClick)
		});
	},

	selectField: function() {
		if (!this.selectedFieldID) {
			return false;
		}
		this.unselectSelectedCell();
		var table = this.table;
		var selectedFieldID = this.selectedFieldID;
		var selectedFieldName = '';
		var $IdCells = $('.field-ID-cell');

		if ($IdCells.length >= 0) {
			$IdCells.each(function(index, element) {
				var $element = $(element);
				if ($element.text() === selectedFieldID) {
					var cellIndex = table.cell($element).index();
					var thisRow = table.row(cellIndex.row).node();
					$(thisRow).find('td.field-cell').addClass('selected-cell');
					selectedFieldName = $('.selected-cell').find('input').val();
					$('.dataTables_scrollBody').scrollTop($('.selected-cell').position().top - 100);
				}
			});
		}

		var data = {
			selectedField: selectedFieldName,
			fieldCount: $IdCells.length
		};
		Bullet.trigger(EventType.EntryForm.FIELD_SELECTED, data);
	},

	rebindStrings: function() {
		var _this = this;
		var bindString = gapi.drive.realtime.databinding.bindString;
		for (var boundObj in this.gBindings) {
			this.gBindings[boundObj].unbind();
		}
		$('.field-table-input').each(function(index, element) {
			var $element = $(element);
			var fieldId = $element.attr('data-field-id');
			for (var i = 0, len = _this.gFields.length; i < len; i += 1) {
				if (_this.gFields.get(i).get('ID') === fieldId) {
					_this.gBindings.fieldId = bindString(_this.gFields.get(i).get('name'), element);
					break;
				}
			}
		});
	},

	saveNewField: function(newFieldName) {
		if (!this.gFields) {
			return false;
		}
		for (var i = 0, len = this.gFields.length; i < len; i += 1) { //don't add if the field already exists
			if (this.gFields.get(i).get('name').toString() === newFieldName) {
				return false;
			}
		}
		var newField = {
			ID: this.selectedFieldID,
			name: newFieldName,
			type: DefaultFields.FIELD_TYPE,
			description: DefaultFields.FIELD_DESCRIPTION,
			defValue: DefaultFields.FIELD_DEF_VALUE,
			defValueBool: DefaultFields.FIELD_DEF_BOOL_VALUE,
			minValue: DefaultFields.FIELD_MIN_VALUE,
			maxValue: DefaultFields.FIELD_MAX_VALUE,
			strLen: DefaultFields.FIELD_STR_LEN,
			readOnly: DefaultFields.FIELD_READ_ONLY,
			optional: DefaultFields.FIELD_OPTIONAL,
			array: DefaultFields.FIELD_ARRAY,
			arrayLen: DefaultFields.FIELD_ARRAY_LEN,
			refId: DefaultFields.FIELD_REF_ID,
			refType: DefaultFields.FIELD_REF_TYPE,
			enumId: DefaultFields.FIELD_ENUM_ID,
			contextId: DefaultFields.FIELD_CONTEXT_ID
		};
		var newGField = this.gModel.createMap(newField);
		newGField.set('name', this.gModel.createString(newField.name));
		newGField.set('description', this.gModel.createString(newField.description));
		newGField.set('defValue', this.gModel.createString(newField.defValue));
		newGField.set('minValue', this.gModel.createString(newField.minValue));
		newGField.set('maxValue', this.gModel.createString(newField.maxValue));
		newGField.set('strLen', this.gModel.createString(newField.strLen));
		newGField.set('arrayLen', this.gModel.createString(newField.arrayLen));
		this.gFields.push(newGField);
	},

	saveRemovedField: function(removedFieldID) {
		if (!this.gFields) {
			return false;
		}
		for (var i = 0, len = this.gFields.length; i < len; i += 1) {
			if ('' + this.gFields.get(i).get('ID') === removedFieldID) {
				this.gFields.remove(i);
				return true;
			}
		}
	},

	selectTopCell: function() {
		var $fieldCells = $('.field-cell');
		if ($fieldCells.length === 0) {
			return false;
		}
		var $selectedCell = $fieldCells.first();
		$selectedCell.addClass('selected-cell');
		var cellIndex = this.table.cell($selectedCell).index();
		var thisRow = this.table.row(cellIndex.row).node();
		this.selectedFieldID = $(thisRow).find('.field-ID-cell').text();

		var selectedFieldName = $selectedCell.find('input').val();
		var data = {
			selectedField: selectedFieldName,
			fieldCount: $fieldCells.length
		};
		Bullet.trigger(EventType.EntryForm.FIELD_SELECTED, data);
	},

	unselectSelectedCell: function() {
		var $currSelectedCell = $('.selected-cell');
		if ($currSelectedCell.length === 0) {
			return false;
		}
		$currSelectedCell.removeClass('selected-cell');
	},

	onAddBtnClick: function() {
		// getting the first value N where newField_ is not currently used
		var NEW_FIELD_NAME = 'newField_';
		var newFieldNum = 0;
		var digitsList = [];
		var newIndex = 1;
		$('#field-table').find('tr').each(function(index, element) {
			var $this = $(this);
			var $fieldCellInput = $this.find('.field-cell input');
			if ($fieldCellInput.length && $fieldCellInput.val().indexOf(NEW_FIELD_NAME) === 0) {
				digitsList.push($fieldCellInput.val().substring(NEW_FIELD_NAME.length));
			}

			var $fieldIdCell = $this.find('.field-ID-cell');
			if (parseInt($fieldIdCell.text(), 10) >= newIndex) {
				newIndex = parseInt($fieldIdCell.text(), 10) + 1;
			}
		});
		while (digitsList.indexOf('' + newFieldNum) >= 0) {
			newFieldNum++;
		}
		this.selectedFieldID = '' + newIndex;
		var newFieldName = NEW_FIELD_NAME + newFieldNum;
		this.saveNewField(newFieldName);
	},

	onDeleteBtnClick: function() {
		var $selectedCell = $('.selected-cell');
		if ($selectedCell.length === 0) {
			return false;
		}
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

		var data = {
			selectedField: $clickedCell.find('input').val(),
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
					className = {'small-btn field-selector-btn btn-floating waves-effect waves-light ' + Configs.App.ADD_BUTTON_COLOR}>
						<i className = 'mdi-content-add btn-icon' /></a>
					<a id = 'field-delete-btn' className = 'delete-tooltipped small-btn field-selector-btn btn-floating waves-effect waves-light red'>
						<i className = 'mdi-content-clear btn-icon' /></a>
				</div>
			</div>
		);

		return (<div className = 'col s12'>{contentTable}</div>);
	}
});
