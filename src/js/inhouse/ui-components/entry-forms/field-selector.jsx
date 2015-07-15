var EventType = require('../../constants/event-type.js');
var DefaultValueConstants = require('../../constants/default-value-constants.js');
var DefaultFields = DefaultValueConstants.DefaultFieldAttributes;

var Configs = require('../../app-config.js');

module.exports = React.createClass({
	/* ******************************************
				LIFE CYCLE FUNCTIONS
	****************************************** */
	componentWillMount: function() {
		this.gBindings = [];
		this.table = null;
		this.gFields = null;
		this.gModel = null;
		this.selectedFieldId = null;
		this.table = null;

		Bullet.on(EventType.EntryForm.GAPI_FILE_LOADED, 'field-selector.jsx>>onGapiFileLoaded', this.onGapiFileLoaded);
	},

	componentDidMount: function() {
		this.initializeTooltips();
	},

	componentWillUnmount: function() {
		if (this.gFields) { this.gFields.removeAllEventListeners(); }

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
		var fields = this.getFields();
		this.initializeTable(fields);
		this.rebindStrings();
		this.selectField(true);
	},

	getFields: function() {
		var fields = [];
		var gField;
		var field;
		for (var i = 0, len = this.gFields.length; i<len; i++) {
			gField = this.gFields.get(i);
			field = {};
			field.ID = gField.id;
			field.name = gField.get('name').toString();
			fields.push(field);
		}
		return fields;
	},

	initializeTable: function(fields) {
		this.table = $('#field-table').DataTable({
			data: fields,
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
				className: 'ID-field hide'
			}, {
				targets: 1,
				data: 'name',
				render: function(data, type, row, meta) {
					return '<input readOnly class="field-table-input" type="text" data-field-id="'+row.ID+'" value='+data+'>';
				},
				className: 'name-field'
			}]
		});
		this.table.order([0, 'asc']);
		$('th').removeClass('ID-field name-field');
		var fieldClickHandler = this.onFieldClick;
		$('.name-field').each(function(index, element) {
			var $element = $(element);
			$element.attr('id', '' + $element.find('input').val() + '-field');
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

	selectField: function(scroll) {
		if (!this.selectedFieldId) { return false; }
		this.unselectSelectedField();
		var that = this;
		var $nameFields = $('.name-field');

		if ($nameFields.length) {
			$nameFields.each(function(index, element) {
				var $element = $(element);
				if ($element.find('input').attr('data-field-id') === that.selectedFieldId) {
					$element.addClass('selected-cell');
					if (scroll) {
						$('.dataTables_scrollBody').scrollTop($element.position().top - 100);
					}
				}
			});
		} else {
			this.selectedFieldId = null;
		}
		var data = {
			selectedFieldId: this.selectedFieldId,
			fieldCount: $nameFields.length
		};
		Bullet.trigger(EventType.EntryForm.FIELD_SELECTED, data);
	},


	selectTopField: function() {
		var $nameFields = $('.name-field');
		if ($nameFields.length === 0) { return false; }
		var $topCell = $nameFields.first();
		this.selectedFieldId = $topCell.find('input').attr('data-field-id');
		this.selectField(true);
	},

	unselectSelectedField: function() {
		var $selectedCell = $('.selected-cell');
		if ($selectedCell.length === 0) { return false; }
		$selectedCell.removeClass('selected-cell');
	},

	rebindStrings: function() {
		var that = this;
		var bindString = gapi.drive.realtime.databinding.bindString;
		for (var i = 0, len = this.gBindings.length; i<len; i++) {
			this.gBindings[i].unbind();
		}
		$('.field-table-input').each(function(index, element) {
			var $element = $(element);
			var fieldId = $element.attr('data-field-id');
			var collabString;
			for (var i = 0, len = that.gFields.length; i<len; i++) {
				if (that.gFields.get(i).id === fieldId) {
					collabName = that.gFields.get(i).get('name');
					that.gBindings.push(bindString(collabName, element));
					break;
				}
			}
		});
	},

	addField: function(newFieldName) {
		if (!this.gFields) { return false; }
		var newField = {
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
			refName: DefaultFields.FIELD_REF_NAME,
			refType: DefaultFields.FIELD_REF_TYPE,
			enumId: DefaultFields.FIELD_ENUM_ID,
			enumName: DefaultFields.FIELD_ENUM_NAME,
			enumValue: DefaultFields.FIELD_ENUM_VALUE,
			contextId: DefaultFields.FIELD_CONTEXT_ID
		};
		var gField = this.gModel.createMap(newField);
		gField.set('name', this.gModel.createString(newField.name));
		gField.set('description', this.gModel.createString(newField.description));
		gField.set('defValue', this.gModel.createString(newField.defValue));
		gField.set('minValue', this.gModel.createString(newField.minValue));
		gField.set('maxValue', this.gModel.createString(newField.maxValue));
		gField.set('strLen', this.gModel.createString(newField.strLen));
		gField.set('arrayLen', this.gModel.createString(newField.arrayLen));
		this.selectedFieldId = gField.id;
		this.gFields.push(gField);
	},

	removeField: function(removedFieldId) {
		if (!this.gFields) { return false; }
		for (var i = 0, len = this.gFields.length; i<len; i++) {
			if ('' + this.gFields.get(i).id === removedFieldId) {
				this.gFields.remove(i);
				return true;
			}
		}
	},

	onAddBtnClick: function() {
		// getting the first value N where newFieldN is not used
		var NEW_FIELD_NAME = 'NewField';
		var newFieldNum = 0;
		var newIndex = 1;
		var digitsList = [];
		$('#field-table').find('tr').each(function(index, element) {
			var $element = $(element);
			var $fieldInput = $element.find('.field-table-input');
			if ($fieldInput.length && $fieldInput.val().indexOf(NEW_FIELD_NAME) === 0) {
				digitsList.push($fieldInput.val().substring(NEW_FIELD_NAME.length));
			}
		});
		while (digitsList.indexOf('' + newFieldNum) >= 0) {
			newFieldNum++;
		}

		var newFieldName = NEW_FIELD_NAME + newFieldNum;
		this.addField(newFieldName);
	},

	onDeleteBtnClick: function() {
		var $selectedCell = $('.selected-cell');
		if ($selectedCell.length === 0) { return false; }
		var removedFieldId = $selectedCell.find('input').attr('data-field-id');
		this.removeField(removedFieldId);

		$('.delete-tooltipped').tooltipster('hide');
		this.selectTopField();
	},

	onFieldClick: function(e) {
		var $clickedField = $(e.currentTarget);
		if ($clickedField.hasClass('selected-cell')) { return false; }
		this.selectedFieldId = $clickedField.find('input').attr('data-field-id');
		this.selectField(false);
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
					<a id = 'field-delete-btn' className = 'delete-tooltipped small-btn field-selector-btn btn-floating waves-effect waves-light materialize-red'>
						<i className = 'mdi-content-clear btn-icon' /></a>
				</div>
			</div>
		);

		return (<div className = 'col s12'>{contentTable}</div>);
	}
});
