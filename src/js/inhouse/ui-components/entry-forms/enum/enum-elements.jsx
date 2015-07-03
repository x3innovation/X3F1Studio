var EventType = require('../../../constants/event-type.js');
var DefaultValueConstants = require('../../../constants/default-value-constants.js');
var DefaultFields = DefaultValueConstants.DefaultFieldAttributes;

var Configs = require('../../../app-config.js');

module.exports = React.createClass({
	/* ******************************************
				LIFE CYCLE FUNCTIONS
	****************************************** */
	componentWillMount: function() {
		this.metadataModel = null;
		this.gFields = null;
		this.table = null;
		this.selectedRowIndex = null;

		Bullet.on(EventType.EntryForm.GAPI_FILE_LOADED, 'enum-elements.jsx>>onGapiFileLoaded', this.onGapiFileLoaded);
		Bullet.on(EventType.EntryForm.METADATA_MODEL_LOADED, 'enum-elements.jsx>>onMetadataModelLoaded', this.onMetadataModelLoaded);
	},

	componentWillUnmount: function() {
		Bullet.off(EventType.EntryForm.GAPI_FILE_LOADED, 'enum-elements.jsx>>onGapiFileLoaded');
	},

	/* ******************************************
			NON LIFE CYCLE FUNCTIONS
	****************************************** */
	onGapiFileLoaded: function(doc) {
		this.gFields = doc.getModel().getRoot().get(this.props.gapiKey).fields;
		this.gFields.addEventListener(gapi.drive.realtime.EventType.VALUES_ADDED, this.updateUi);
		this.gFields.addEventListener(gapi.drive.realtime.EventType.VALUES_REMOVED, this.updateUi);
		this.gFields.addEventListener(gapi.drive.realtime.EventType.VALUES_SET, this.updateUi);
		this.updateUi();
	},

	onMetadataModelLoaded: function(metadataModel) {
		this.metadataModel = metadataModel;
	},

	updateUi: function() {
		this.initializeTable();
		this.selectRow();
		this.forceUpdate();
	},

	initializeTable: function() {
		this.table = $('#enum-table').DataTable({
			data: this.gFields.asArray(),
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
		$('.enum-name-cell').attr('data-placeholder-value', 'please enter a name');
		$('.enum-description-cell').attr('data-placeholder-value', 'enter description');
	},

	keyPressHandler: function(e) {
		var code = (e.keyCode);
		if (code === 13) {
			$(e.target).blur();
			return false; //enter was detected, ignore keypress
		}
	},

	saveCell: function(e) {
		var $selectedRow = $(e.target).closest('tr');
		var index = parseInt($selectedRow.find('.enum-index-cell').text(), 10);

		for (var i = 0, len = this.gFields.length; i < len; i += 1) {
			if (this.gFields.get(i).index === index) {
				var newField = {
					index: index,
					name: $selectedRow.find('.enum-name-cell').text(),
					description: $selectedRow.find('.enum-description-cell').text()
				};
				if (newField.name !== this.gFields.get(i).name || newField.description !== this.gFields.get(i).description) {
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
		var _this = this;
		if (!this.selectedRowIndex) {
			return;
		}
		var $selectedRow;
		$('.selected-cell').removeClass('selected-cell');
		$('.enum-index-cell').each(function(index, element) {
			var $element = $(element);
			if ($element.text() === ""+_this.selectedRowIndex) {
				$selectedRow = $element.closest('tr');
			}
		});
		$selectedRow.find('td').addClass('selected-cell');
	},

	onAddEnumBtnClick: function(e) {
		var NEW_ELEMENT_NAME = 'newElement_';
		var newElementNum = 0;
		var digitsList = [];
		var newIndex = 1;

		$('#enum-table').find('tr').each(function(index, element) {
			var $this = $(this);
			var $nameCell = $this.find('.enum-name-cell');
			if ($nameCell.text().indexOf(NEW_ELEMENT_NAME) === 0) {
				digitsList.push($nameCell.text().substring(NEW_ELEMENT_NAME.length));
			}
			var $indexCell = $this.find('.enum-index-cell');
			var compareIndex = parseInt($indexCell.text(), 10);
			if (compareIndex >= newIndex) {
				newIndex = compareIndex + 1;
			}
		});
		while (digitsList.indexOf('' + newElementNum) >= 0) {
			newElementNum++;
		}
		var newEnum = {
			index: newIndex,
			name: NEW_ELEMENT_NAME + newElementNum,
			description: ""
		};
		this.selectedRowIndex = newIndex;
		this.gFields.push(newEnum);
		var addEnumAnnouncement = {
			action: AnnouncementType.ADD_ENUM,
			fileId: this.props.fileId,
			enumIndex: newEnum.index,
			enumNewName: newEnum.name
		};
		GDriveService.announce(this.metadataModel, addEnumAnnouncement);
	},

	onDeleteEnumBtnClick: function(e) {
		var $selectedIndexCell = $('.selected-cell.enum-index-cell');
		if (!$selectedIndexCell.length) {
			e.preventDefault();
			return;
		}
		var index = this.selectedRowIndex;
		this.selectedRowIndex = null;
		for (var i = 0, len = this.gFields.length; i < len; i += 1) {
			if (this.gFields.get(i).index === index) {
				var deletedEnum = this.gFields.get(i);
				var deleteEnumAnnouncement = {
					action: AnnouncementType.DELETE_ENUM,
					fileId: this.props.fileId,
					enumIndex: deletedEnum.index,
					enumNewName: deletedEnum.name
				};
				GDriveService.announce(this.metadataModel, deleteEnumAnnouncement);
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
