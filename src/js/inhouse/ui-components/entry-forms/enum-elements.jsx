var EventType = require('../../constants/event-type.js');
var DefaultValueConstants = require('../../constants/default-value-constants.js');
var AnnouncementType = require('../../constants/announcement-type.js');
var DefaultFields = DefaultValueConstants.DefaultFieldAttributes;

var GDriveService = require('../../services/google-drive-service.js');
var Configs = require('../../app-config.js');

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
		Bullet.off(EventType.EntryForm.METADATA_MODEL_LOADED, 'enum-elements.jsx>>onMetadataModelLoaded');
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
	},

	initializeTable: function() {
		var fields = this.gFields.asArray();
		this.table = $('#enum-table').DataTable({
			data: fields,
			autoWidth: false,
			destroy: true,
			scrollY: 400,
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
				data: 'index',
				width: '10%',
				searchable: false,
				className: 'enum-cell enum-index-cell'
			}, {
				targets: 1,
				data: 'name',
				width: '20%',
				className: 'enum-cell enum-name-cell',
				render: function(data, type, row, meta) {
					return '<input type="text" spellcheck="false" placeholder="please enter a name" data-enum-index='+
						row.index+' value="'+data+'" class="enum-table-input enum-name-input">';
				},
			}, {
				targets: 2,
				data: 'description',
				width: '70%',
				className: 'enum-cell enum-description-cell',
				render: function(data, type, row, meta) {
					return '<input type="text" spellcheck="false" placeholder="enter description" data-enum-index='+
						row.index+' value="'+data+'" class="enum-table-input enum-description-input">';
				},
			}]
		});
		this.table.order([0, 'asc']);
		$('th').removeClass('enum-cell enum-index-cell enum-name-cell enum-description-cell');
		$('.dataTables_scrollBody table').css('table-layout', 'fixed');
		$('.enum-cell').click(this.setSelectedRow);
		var that = this;
		$('.enum-table-input').each(function(index, element) {
			var $element = $(element);
			if ($element.val() === '')  {
				$element.addClass('empty-input');
			}
			$element.keypress(that.keyPressHandler).blur(that.saveCell);
		});
	},

	keyPressHandler: function(e) {
		var code = (e.keyCode || e.which);
		if (code === 13) { //enter was detected, ignore keypress
			$(e.currentTarget).blur();
			return false;
		}
	},

	saveCell: function(e) {
		var $target = $(e.target);
		var $selectedRow = $target.closest('tr');
		var index = parseInt($selectedRow.find('.enum-index-cell').text(), 10);
		if ($target.val() === '') {
			$target.addClass('empty-input');
		} else {
			$target.removeClass('empty-input');
		}

		for (var i = 0, len = this.gFields.length; i<len; i++) {
			if (this.gFields.get(i).index === index) {
				var renamedEnum = {
					index: index,
					name: $selectedRow.find('.enum-name-input').val(),
					description: $selectedRow.find('.enum-description-input').val()
				};
				if (renamedEnum.name !== this.gFields.get(i).name) {
					this.gFields.set(i, renamedEnum);
					var renameEnumAnnouncement = {
						action: AnnouncementType.RENAME_ENUM,
						fileId: this.props.fileId,
						enumIndex: renamedEnum.index,
						enumNewName: renamedEnum.name
					};
					GDriveService.announce(this.metadataModel, renameEnumAnnouncement);
				} else if (renamedEnum.description !== this.gFields.get(i).description) {
					this.gFields.set(i, renamedEnum);
				}
				break;
			}
		}
	},

	setSelectedRow: function(e) {
		var $clicked = $(e.currentTarget);
		var cellIndex = this.table.cell($clicked).index();
		var $selectedRow = $(this.table.row(cellIndex.row).node());
		this.selectedRowIndex = parseInt($selectedRow.find('.enum-index-cell').text(), 10);
		this.selectRow();
	},

	selectRow: function() {
		var that = this;
		if (this.selectedRowIndex === null) { return; }
		var $selectedRow;
		$('.selected-cell').removeClass('selected-cell');
		$('.enum-index-cell').each(function(index, element) {
			var $element = $(element);
			if ($element.text() === ""+that.selectedRowIndex) {
				$selectedRow = $element.closest('tr');
			}
		});
		$selectedRow.find('td').addClass('selected-cell');
	},

	onAddEnumBtnClick: function(e) {
		var NEW_ELEMENT_NAME = 'newElement_';
		var newElementNum = 0;
		var digitsList = [];
		var newIndex = 0;

		$('#enum-table').find('tr').each(function(index, element) {
			var $element = $(element);
			var $nameCellInput = $element.find('.enum-name-input');
			if ($nameCellInput.length && $nameCellInput.val().indexOf(NEW_ELEMENT_NAME) === 0) {
				digitsList.push($nameCellInput.val().substring(NEW_ELEMENT_NAME.length));
			}
			var $indexCell = $element.find('.enum-index-cell');
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
		for (var i = 0, len = this.gFields.length; i<len; i++) {
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
					className = 'small-btn btn-floating waves-effect waves-light materialize-red'>
						<i className = 'mdi-content-clear btn-icon' /></a>
				</div>
			</div>
		);
	}
});
