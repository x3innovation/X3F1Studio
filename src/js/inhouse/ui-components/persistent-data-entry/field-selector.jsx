var EventType=require('../../constants/event-type.js')
var Configs=require('../../app-config.js');
var GDriveConstants=require('../../constants/google-drive-constants.js');
var DefaultValueConstants=require('../../constants/default-value-constants.js');
var DefaultFields=DefaultValueConstants.DefaultFieldAttributes;

module.exports=React.createClass ({
	model: {}, 

	/* ******************************************
				LIFE CYCLE FUNCTIONS
	****************************************** */
	componentWillMount:  function() {
		this.model.fields=[];
		this.model.gModel=null;
		this.model.table=null;
		this.model.selectedFieldID=null;
		
		Bullet.on(EventType.PersistentDataEntry.GAPI_FILE_LOADED, 'field-selector.jsx>>onGapiFileLoaded', this.onGapiFileLoaded);
	}, 

	componentDidMount: function() {
		this.initializeTooltips();
	}, 

	componentWillUnmount: function() {
		Bullet.off(EventType.PersistentDataEntry.GAPI_FILE_LOADED, 'field-selector.jsx>>onGapiFileLoaded');
	}, 

	/* ******************************************
			NON LIFE CYCLE FUNCTIONS
	****************************************** */

	initializeTable: function() {
		var fieldData=[];
		for (i=0, len=this.model.fields.length; i<len; i+=1) {
			//dataTables stores reach each array for a row, so give array of array as data
			fieldData.push([this.model.fields[i].ID||i, this.model.fields[i].name]);
		}
		this.model.table=$('#persistent-data-field-table').DataTable({
			data: fieldData, 
			destroy: true, 
			scrollY: 330, 
			paging: false, 
			info: false, 
			ordering: false, 
			search: {
				caseInsensitive: true, 
			}, 
			language: {
				search: '_INPUT_', //removes the 'search:' text, puts it directly in the searchbox
				searchPlaceholder: 'search fields', 
				emptyTable: 'no fields defined'
			}, 
			columnDefs: [
				{
					targets: 0, 
					className: 'field-ID-cell hide'
				}, 
				{
					targets: 1, 
					className: 'field-cell'
				}
			]
		});
		this.model.table.order([0, 'asc']);
		$('th').removeClass('field-ID-cell field-cell'); //header cells should not be treated as body cells
		var thisTable=this.model.table;
		$('.field-cell').each(function() 
			{
				var $thisCell=$(this);
				$thisCell.attr('id', ''+$thisCell.text()+'-cell');
				if (!$thisCell.text()) {
					$thisCell.addClass("empty-cell");
				}
			}
		);
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
			content: $('<a class="delete-tooltip waves-effect waves btn-flat">delete</a>')
						.on('click', this.onDeleteBtnClick)
		});
	}, 

	onGapiFileLoaded: function(doc) {
		var key=GDriveConstants.CustomObjectKey.PERSISTENT_DATA;
		this.model.gModel=doc.getModel().getRoot().get(key);
		this.model.gModel.fields.addEventListener(gapi.drive.realtime.EventType.VALUES_ADDED, this.updateUi);
		this.model.gModel.fields.addEventListener(gapi.drive.realtime.EventType.VALUES_REMOVED, this.updateUi);
		this.model.gModel.fields.addEventListener(gapi.drive.realtime.EventType.VALUES_SET, this.updateUi);
		this.updateUi();
	}, 

	updateUi: function() {
		this.model.fields=this.model.gModel.fields.asArray();
		this.initializeTable();
		this.selectField();
	}, 

	saveNewField: function(newFieldName) {
		if (!this.model.gModel) {
			return false;
		}
		var fields=this.model.gModel.fields.asArray();
		for (i=0, len=fields.length; i<len; i+=1) { //don't add if the field already exists
			if (fields[i].name===newFieldName) {
				return false;
			}
		}
		var newField=
			{
				ID: this.model.selectedFieldID, 
				name: newFieldName, 
				type: DefaultFields.FIELD_TYPE, 
				description: DefaultFields.FIELD_DESCRIPTION, 
				defaultValue: DefaultFields.FIELD_DEF_VALUE, 
				minValue: DefaultFields.FIELD_MIN_VALUE, 
				maxValue: DefaultFields.FIELD_MAX_VALUE, 
				strLength: DefaultFields.FIELD_STR_LEN, 
				contextId: DefaultFields.FIELD_CONTEXT_ID, 
				readOnly: DefaultFields.FIELD_READ_ONLY, 
				optional: DefaultFields.FIELD_OPTIONAL, 
				array: DefaultFields.FIELD_ARRAY, 
				refType: DefaultFields.FIELD_REF_TYPE
			};
		this.model.gModel.fields.push(newField);
	}, 

	saveRemovedField: function(removedFieldID) {
		if (!this.model.gModel) {
			return false;
		}
		var fields=this.model.gModel.fields.asArray();
		for (i=0; i<fields.length; i+=1) {
			if (""+fields[i].ID===removedFieldID) {
				this.model.gModel.fields.remove(i);
				return true;
			}
		}
	}, 

	selectTopCell: function() {
		if ($('.field-cell').length===0) {
			return false;
		}
		$('.field-cell').first().addClass('selected-cell');
		var $selectedCell=$('.selected-cell');
		var cellIndex=this.model.table.cell($selectedCell).index();
		var thisRow=this.model.table.row(cellIndex.row).node();
		this.model.selectedFieldID=$(thisRow).find('.field-ID-cell').text();
		selectedFieldName=$selectedCell.text();
		var data={selectedField: selectedFieldName, 
					fieldCount: $('.field-cell').length};
		Bullet.trigger(EventType.PersistentDataEntry.FIELD_SELECTED, data);
	}, 

	selectField: function() {
		if (!this.model.selectedFieldID) {
			return false;
		}
		this.unselectSelectedCell();
		var table=this.model.table;
		var selectedFieldID=this.model.selectedFieldID;
		var selectedFieldName='';
		if ($('.field-cell').length >= 0) {
			$('.field-ID-cell').each(function(index, element) {
				if ($(this).text()===selectedFieldID) {
					var cellIndex=table.cell($(this)).index();
					var thisRow=table.row(cellIndex.row).node();
					$(thisRow).find('td.field-cell').addClass('selected-cell');
					selectedFieldName=$('.selected-cell').text();
					$('.dataTables_scrollBody').scrollTop($('.selected-cell').position().top-100);
				}
			});
		}
		var data={selectedField: selectedFieldName, 
					fieldCount: $('.field-cell').length};
		Bullet.trigger(EventType.PersistentDataEntry.FIELD_SELECTED, data);
	}, 

	unselectSelectedCell: function() {
		if ($('.selected-cell').length===0) {
			return false;
		}
		$('.selected-cell').removeClass('selected-cell');
	}, 

	onAddBtnClick: function(e) {
		// getting the first value N where newField_ is not currently used
		var NEW_FIELD_NAME='newField_';
		var tableData=this.model.table.cells('.field-cell').data();
		var newAttributeNum=0;
		var digitsList=[];
		for (i=0; i<tableData.length; i+=1) {
			if (tableData[i].indexOf(NEW_FIELD_NAME)==0) {
				digitsList.push(tableData[i].substring(NEW_FIELD_NAME.length));
			}
		}
		while (digitsList.indexOf(""+newAttributeNum) >= 0) { 
			newAttributeNum++;
		}
		var newFieldName=NEW_FIELD_NAME+""+newAttributeNum;
		var newIndex=1;
		$('.field-ID-cell').each(function(index, element){
			if (parseInt($(this).text(), 10) >= newIndex) {
				newIndex=parseInt($(this).text(), 10)+1;
			}
		});
		this.model.selectedFieldID=""+newIndex;
		this.saveNewField(newFieldName);
	},

	onDeleteBtnClick: function(e) {
		if ($('.selected-cell').length===0) {
			return false;
		}
		var $selectedCell=$('.selected-cell');
		var cellIndex=this.model.table.cell($selectedCell).index();
		var thisRow=this.model.table.row(cellIndex.row).node();
		var removedFieldID=$(thisRow).find(".field-ID-cell").text();
		this.saveRemovedField(removedFieldID);

		$('.delete-tooltipped').tooltipster('hide');
		this.selectTopCell();
	},

	onFieldClick: function(e) {
		var $clickedCell=$(e.currentTarget);
		if ($clickedCell.hasClass('selected-cell')) {
			return false;
		}
		this.unselectSelectedCell();
		$clickedCell.addClass('selected-cell');
		var cellIndex=this.model.table.cell($clickedCell).index();
		var thisRow=this.model.table.row(cellIndex.row).node();
		this.model.selectedFieldID=$(thisRow).find('.field-ID-cell').text();
		selectedFieldName=$clickedCell.text();
		var data={selectedField: selectedFieldName, 
					fieldCount: $('.field-cell').length};
		Bullet.trigger(EventType.PersistentDataEntry.FIELD_SELECTED, data);
	}, 

	render: function() {
		var contentTable;
		var fields=this.model.fields;
		contentTable=(
			<div>
				<table id='persistent-data-field-table' className='dataTable hoverable col s12'>
					<thead>
						<tr>
							<th><div className='hide field-ID-table-header'></div></th>
							<th><div className='field-table-header'>fields</div></th>
						</tr>
					</thead>
					<tbody></tbody>
				</table>
				<div>
					<a id='field-add-btn' onClick={this.onAddBtnClick} className={'z-depth-1 field-selector-header-btn btn-floating waves-effect waves-light '+Configs.App.ADD_BUTTON_COLOR}>
						<i className='mdi-content-add btn-icon field-selector-header-btn-icon'></i></a>
				</div>
				<div>
					<a id='field-delete-btn' className='z-depth-1 delete-tooltipped field-selector-header-btn btn-floating waves-effect waves-light red'>
						<i className='mdi-content-clear btn-icon field-selector-header-btn-icon'></i></a>
				</div>
			</div>
		);

		return (<div className='col s12'>{contentTable}</div>);
	}
});
