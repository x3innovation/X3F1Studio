var EventType = require('../../../constants/event-type.js');
var DefaultValueConstants = require('../../../constants/default-value-constants.js');
var DefaultFields = DefaultValueConstants.DefaultFieldAttributes;

var Configs = require('../../../app-config.js');

module.exports = React.createClass({
	/* ******************************************
				LIFE CYCLE FUNCTIONS
	****************************************** */
	componentWillMount: function() {
		this.fields = [];
		this.gFields = null;
		this.table = null;
		this.selectedRowIndex = null;
		this.gapiLoaded = false;

		Bullet.on(EventType.EntryForm.GAPI_FILE_LOADED, 'enum-elements.jsx>>onGapiFileLoaded', this.onGapiFileLoaded);
	},

	componentDidMount: function() {

	},

	componentWillUnmount: function() {
		Bullet.off(EventType.EntryForm.GAPI_FILE_LOADED, 'enum-elements.jsx>>onGapiFileLoaded');
	},

	/* ******************************************
			NON LIFE CYCLE FUNCTIONS
	****************************************** */
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
		this.selectRow();
		this.forceUpdate();
	},

	initializeTable: function() {
		this.table = $('#enum-table').DataTable({
			data: this.fields,
			autoWidth: false,
			destroy: true,
			scrollY: 350,
			paging: false,
			info: false,
			ordering: false,
			search: {
				caseInsensitive: true
			},
			language: {
				search: '_INPUT_', //removes the 'search:' text, puts it directly in the searchbox
				searchPlaceholder: 'search enums',
				emptyTable: 'no enums defined'
			},
			columnDefs: [{
				targets: 0,
				data: "index",
				width: '10%',
				searchable: false,
				className: 'enum-cell enum-index-cell'
			}, {
				targets: 1,
				data: "name",
				width: '20%',
				className: 'enum-cell enum-name-cell editable-cell'
			}, {
				targets: 2,
				data: "description",
				width: '70%',
				className: 'enum-cell enum-description-cell editable-cell'
			}]
		});
		this.table.order([0, 'asc']);
		$('th').removeClass('enum-cell enum-index-cell enum-name-cell enum-description-cell editable-cell');
		$('.dataTables_scrollBody table').css('table-layout', 'fixed');
		$('.enum-cell').click(this.setSelectedRow);
		$('.editable-cell').attr('contentEditable', 'true').keypress(this.keyPressHandler).blur(this.saveCell);
		$('.enum-name-cell').attr('data-warning-value', 'please enter a name');
		$('.enum-description-cell').attr('data-placeholder-value', 'enter description');
	},

	keyPressHandler: function(e) {
		var code = (e.keyCode);
		if (code === 13) {
			return false; //enter was detected, ignore keypress
		}
	},

	saveCell: function(e) {
		var $selectedRow = $(e.target).closest('tr');
		var index = parseInt($selectedRow.find('.enum-index-cell').text(), 10);

		var fields = this.gFields.asArray();
		for (var i = 0, len = fields.length; i < len; i += 1) {
			if (fields[i].index === index) {
				var newField = {
					index: index,
					name: $selectedRow.find('.enum-name-cell').text(),
					description: $selectedRow.find('.enum-description-cell').text()
				};
				if (newField.name !== fields[i].name || newField.description !== fields[i].description) {
					this.gFields.set(i, newField);
				}
				break;
			}
		}
	},

	setSelectedRow: function(e) {
		var $clicked = $(e.target);
		var cellIndex = this.table.cell($clicked).index();
		var $selectedRow = $(this.table.row(cellIndex.row).node());
		this.selectedRowIndex = parseInt($selectedRow.find('.enum-index-cell').text(), 10);
		this.selectRow();
	},

	selectRow: function() {
		var selectedRowIndex = this.selectedRowIndex;
		if (!selectedRowIndex) {
			return;
		}
		var $selectedRow;
		$('.selected-cell').removeClass('selected-cell');
		$('.enum-index-cell').each(function(index, element) {
			var $element = $(element);
			if ($element.text() === ""+selectedRowIndex) {
				$selectedRow = $element.closest('tr');
			}
		});
		$selectedRow.find('td').addClass('selected-cell');
	},

	onAddEnumBtnClick: function(e) {
		if (!this.gapiLoaded) {
			e.preventDefault();
			return;
		}
		var NEW_ELEMENT_NAME = 'newElement_';
		var newElementNum = 0;
		var digitsList = [];
		$('.enum-name-cell').each(function(index, element) {
			var $element = $(element);
			if ($element.text().indexOf(NEW_ELEMENT_NAME) === 0) {
				digitsList.push($element.text().substring(NEW_ELEMENT_NAME.length));
			}
		});
		while (digitsList.indexOf('' + newElementNum) >= 0) {
			newElementNum++;
		}
		var newIndex = 1;
		$('.enum-index-cell').each(function(index, element) {
			var compareIndex = parseInt($(element).text(), 10);
			if (compareIndex >= newIndex) {
				newIndex = compareIndex + 1;
			}
		});
		var newElementName = NEW_ELEMENT_NAME + newElementNum;
		var newEnum = {
			index: newIndex,
			name: newElementName,
			description: ""
		};
		this.selectedRowIndex = newIndex;
		this.gFields.push(newEnum);
	},

	onDeleteEnumBtnClick: function(e) {
		var $selectedIndexCell = $('.selected-cell.enum-index-cell');
		if (!this.gapiLoaded || !$selectedIndexCell.length) {
			e.preventDefault();
			return;
		}
		var index = parseInt($selectedIndexCell.text(), 10);
		var fields = this.gFields.asArray();
		for (var i = 0, len = fields.length; i < len; i += 1) {
			if (fields[i].index === index) {
				this.gFields.remove(i);
				break;
			}
		}
	},

	render: function() {
		var wrapperStyle = {
			position: "relative"
		};
		return (
			<div style = {wrapperStyle}>
				<table id = 'enum-table' className = 'dataTable hoverable'>
					<thead>
						<th><div className = 'enum-col-header enum-index-col-header'>index</div></th>
						<th><div className = 'enum-col-header enum-element-col-header'>element name</div></th>
						<th><div className = 'enum-col-header enum-description-col-header'>description</div></th>
					</thead>
					<tbody></tbody>
				</table>
				<div className = 'enum-btns-wrapper'>
					<a id = 'enum-add-btn' onClick = {this.onAddEnumBtnClick} 
					className = {'small-btn btn-floating waves-effect waves-light ' + Configs.App.ADD_BUTTON_COLOR}>
						<i className = 'mdi-content-add btn-icon' /></a>
					<a id = 'enum-delete-btn' onClick = {this.onDeleteEnumBtnClick}
					className = 'small-btn btn-floating waves-effect waves-light red'>
						<i className = 'mdi-content-clear btn-icon' /></a>
				</div>
			</div>
		);
	}
});
