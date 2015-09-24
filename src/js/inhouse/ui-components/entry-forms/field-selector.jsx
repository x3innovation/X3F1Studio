var EventType = require('../../constants/event-type.js');
var Configs = require('../../app-config.js');

module.exports = React.createClass({
	/* ******************************************
				LIFE CYCLE FUNCTIONS
	****************************************** */
	componentWillMount: function() {
		this.gBindings = [];
		this.table = null;
		this.selectedFieldId = null;
		this.controller = this.props.controller;
	},

	componentDidMount: function() {
		this.initialize();
		this.updateUi();
		this.selectTopField();
	},

	/* ******************************************
			NON LIFE CYCLE FUNCTIONS
	****************************************** */
	initialize: function()
	{
		this.controller.addFieldsUpdateListener(this.updateUi);
		this.initializeTooltips();
	},

	updateUi: function(e) {
		var fields = this.controller.getFields();
		this.initializeTable(fields);
		this.rebindStrings(fields);
		this.selectField(true);
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
				emptyTable: 'no fields defined',
				zeroRecords: 'no fields found'
			},
			columnDefs: [{ // hidden column to be searched for, dataTable cannot search into inputs
				targets: 0,
				data: 'name',
				className: 'name-search-helper hide'
			}, {
				targets: 1,
				data: 'data',
				searchable: false, //do not search this column, search the neighboring colomn
				render: function(data, type, row, meta) {
					return '<input readOnly class="field-table-input" type="text" data-field-id="'+data.id+'" value='+data.name+'>';
				},
				className: 'name-field'
			}]
		});
		this.table.order([0, 'asc']);
		$('th').removeClass('name-field name-search-helper');
		$('.name-field').click(this.onFieldClick);
		$('.dataTables_scrollBody').css('border-bottom', '0');
	},

	initializeTooltips: function() {
		var deleteBtnHtml = '<a class="delete-tooltip waves-effect waves btn-flat">delete</a>';
		$('.delete-tooltipped').tooltipster({
			content: $(deleteBtnHtml).on('click', this.onDeleteBtnClick),
			position: 'top',
			trigger: 'click',
			speed: 250,
			arrow: false, 
			interactive: true
		});
	},

	selectField: function(scroll) {
		if (!this.selectedFieldId) { return false; }
		this.unselectSelectedField();
		var _this = this;
		var $nameFields = $('.name-field');

		if ($nameFields.length) {
			$nameFields.each(function(index, element) {
				var $element = $(element);
				if ($element.find('input').attr('data-field-id') === _this.selectedFieldId) {
					$element.addClass('selected-cell');
					if (scroll) { $('.dataTables_scrollBody').scrollTop($element.position().top - 100); }
					return false;
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
		var _this = this;
		var gModelFields = this.controller.getGoogleModelFields();
		var table = this.table;
		var bindString = gapi.drive.realtime.databinding.bindString;
		var TextInsertedEvent = gapi.drive.realtime.EventType.TEXT_INSERTED;
		var TextDeletedEvent = gapi.drive.realtime.EventType.TEXT_DELETED;

		var updateSpanSibling = function(e, $element) {
			var newText = e.target.toString();
			var $spanSiblingCell = $element.closest('tr').find('.name-search-helper');
			table.cell($spanSiblingCell).data(newText).draw();
		};

		// remove previous bindings, then clear the table
		for (var i = 0, len = this.gBindings.length; i<len; i++) {
			this.gBindings[i].unbind();
		}
		this.gBindings = [];

		$('.field-table-input').each(function(index, element) {
			var $element = $(element);
			var fieldId = $element.attr('data-field-id');
			var collabString;
			var functionWrapper = function(e) {updateSpanSibling(e, $element);};
			for (var i = 0, len = gModelFields.length; i<len; i++) {
				if (gModelFields.get(i).id === fieldId) {
					collabString = gModelFields.get(i).get('name');
					
					//remove and then add again, as $element may have changed
					collabString.removeEventListener(TextInsertedEvent, functionWrapper); 
					collabString.removeEventListener(TextDeletedEvent, functionWrapper);
					
					collabString.addEventListener(TextInsertedEvent, functionWrapper);
					collabString.addEventListener(TextDeletedEvent, functionWrapper);
					_this.gBindings.push(bindString(collabString, element));
					break;
				}
			}
		});
	},

	addField: function(newFieldName) {
		if (!this.gFields) { return false; }

		this.gFileModel.beginCompoundOperation();
		var gField = GDriveService.createNewField(newFieldName, this.gFileModel);
		this.gFileModel.endCompoundOperation();
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
		if ($('#dmx-form').find('.invalid-input').length) {
			return;
		}
		// getting the first value N where NewFieldN is not used
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
		if ($('form').find('.invalid-input').length) {
			return;
		}
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
							<th><div className = 'hide name-search-helper-header'/></th>
							<th><div className = 'name-field-header'>fields</div></th>
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
