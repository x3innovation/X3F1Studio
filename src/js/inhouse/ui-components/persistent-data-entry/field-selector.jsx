var EventType = require('../../constants/event-type.js')
var Configs = require('../../app-config.js');
var GDriveConstants = require('../../constants/google-drive-constants.js');
var DefaultValueConstants = require('../../constants/default-value-constants.js');
var DefaultFields = DefaultValueConstants.DefaultFieldAttributes;

module.exports=React.createClass ({

	/* ******************************************
                LIFE CYCLE FUNCTIONS
    ****************************************** */
    componentWillMount:  function() {
    	this.model = {};
        this.model.fields = [];
    	this.model.gModel = null;
    	this.model.table = null;
        this.model.selectedFieldName = null;
        this.model.firstRead = true;
    },

    componentDidMount: function() {
        this.initializeTooltips();
        this.initializeTable();
        
        Bullet.on(EventType.PersistentDataEntry.GAPI_FILE_LOADED, 'field-selector.jsx>>onGapiFileLoaded', this.onGapiFileLoaded);
    },

    componentWillUnmount: function() {
        Bullet.off(EventType.PersistentDataEntry.GAPI_FILE_LOADED, 'field-selector.jsx>>onGapiFileLoaded', this.onGapiFileLoaded);
    },

	/* ******************************************
            NON LIFE CYCLE FUNCTIONS
    ****************************************** */

    /*initializing jQuery stuff*/
    initializeTable: function() {
        var fieldNames = [];
        for (i = 0, len = this.model.fields.length; i < len; i++) {
            fieldNames[i] = [this.model.fields[i].name]; //an array so the datatable can parse properly
        }
        this.model.table = $('#persistent-data-field-table').DataTable({
            data: fieldNames,
            scrollY: 300,
            paging: false,
            info: false,
            order: [[0, 'asc']], //order the fields in ascending order
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
                className: 'field-cell'
            }]
        });
        $('th.field-cell').removeClass('field-cell'); //header cells should not be treated as body cells
        $('.field-cell').each(function() {
                            var $thisCell = $(this);
                            $thisCell.attr('id', ''+$thisCell.text()+'-cell');
                        });
        $('.field-cell').on('click', this.onFieldClick);

        if (this.model.firstRead) {
            this.selectTopCell();
            this.model.firstRead = false;
        }
        this.forceUpdate();
    },

    initializeTooltips: function() {
        $.fn.tooltipster('setDefaults', {
            position: 'top',
            trigger: 'click',
            speed: 250,
            interactive: true,
            onlyOne: true,
        });

        $('.delete-tooltipped').tooltipster({
            content: $('<a class="delete-tooltip waves-effect waves btn-flat">delete</a>')
                      .on('click', this.onDeleteBtnClick)
        });
    },

    /*Google API connections*/
    onGapiFileLoaded: function(doc) {
        var key = GDriveConstants.CustomObjectKey.PERSISTENT_DATA;
        this.model.gModel = doc.getModel().getRoot().get(key);
        this.model.gModel.fields.addEventListener(gapi.drive.realtime.EventType.VALUES_ADDED, this.updateUi);
        this.model.gModel.fields.addEventListener(gapi.drive.realtime.EventType.VALUES_REMOVED, this.updateUi);
        this.model.gModel.fields.addEventListener(gapi.drive.realtime.EventType.VALUES_SET, this.updateUi);
        this.updateUi();
    },

    updateUi: function() {
        this.model.fields = this.model.gModel.fields.asArray();
        this.model.table.destroy();
        this.initializeTable();
        this.selectField();
    },

    saveNewField: function() {
        if (!this.model.gModel) {
            return;
        }
        var fields = this.model.gModel.fields.asArray();
        for (i = 0, len = fields.length; i<len; i++) { //don't add if the field already exists
            if (fields[i].name === this.model.selectedFieldName) {
                return;
            }
        }
        var newField = {
                            name: this.model.selectedFieldName,
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
                       };
        this.model.gModel.fields.push(newField);
    },

    saveRemovedField: function(removedFieldName) {
        if (!this.model.gModel) {
            return;
        }
        var fields = this.model.gModel.fields.asArray();
        for (i = 0; i<fields.length; i++) {
            if (fields[i].name === removedFieldName) {
                this.model.gModel.fields.remove(i);
                return;
            }
        }
    },

    /*utility functions*/
    selectTopCell: function() {
        if ($('.field-cell').length===0) {
            return;
        }
        $('.field-cell').first().addClass('selected-cell');
        this.model.selectedFieldName = $('.selected-cell').text();
        var data = {selectedField: this.model.selectedFieldName};
        Bullet.trigger(EventType.PersistentDataEntry.FIELD_SELECTED, data);
    },

    selectField: function() {
        this.unselectSelectedCell();
        var selectedFieldName = this.model.selectedFieldName;
        $('.field-cell').each(function() {
            if ($(this).text() === selectedFieldName) {
                $(this).addClass('selected-cell');
                $('.dataTables_scrollBody').scrollTop($(this).position().top-100);
            }
        });
        var data = {selectedField: this.model.selectedFieldName};
        Bullet.trigger(EventType.PersistentDataEntry.FIELD_SELECTED, data);
    },

    unselectSelectedCell: function() {
        if ($('.selected-cell').length===0) {
            return;
        }
        $('.selected-cell').removeClass('selected-cell');
    },

    /*Event handlers*/
    onAddBtnClick: function(e) {
		this.unselectSelectedCell();
        // getting the first value N where new-field-N is not currently used
        var NEW_FIELD_NAME='new-field-';
        var tableData=this.model.table.cells('.field-cell').data();
        var newAttributeNum = 0;
        var digitsList = [];
        for (var i=0; i<tableData.length; i++) {
            if (tableData[i].indexOf(NEW_FIELD_NAME) == 0) {
                digitsList.push(tableData[i].substring(NEW_FIELD_NAME.length));
            }
        }
        while (digitsList.indexOf(""+newAttributeNum) !== -1) { 
            newAttributeNum++;
        }

        this.model.selectedFieldName = NEW_FIELD_NAME+""+newAttributeNum;
        var data = {selectedField: this.model.selectedFieldName};
        Bullet.trigger(EventType.PersistentDataEntry.FIELD_SELECTED, data);
        this.saveNewField();
   		Bullet.trigger(EventType.PersistentDataEntry.FIELD_ADDED);
   	},	

   	onDeleteBtnClick: function(e) {
   		if ($('.selected-cell').length===0) {
   			return;
   		}
        var removedFieldName = $('.selected-cell').text();
        this.saveRemovedField(removedFieldName);

        $('.delete-tooltipped').tooltipster('hide');
   		this.selectTopCell();
   		Bullet.trigger(EventType.PersistentDataEntry.FIELD_REMOVED);
   	},

	onFieldClick: function(e) {
		var $selectedCell=$(e.currentTarget);
		if ($selectedCell.hasClass('selected-cell')) {
		    return;
	    }
        this.unselectSelectedCell();
        $selectedCell.addClass('selected-cell');
        this.model.selectedFieldName = $selectedCell.text();
        var data = {selectedField: this.model.selectedFieldName};
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
                            <th>
						        <div className='field-table-header'>fields</div>
					        </th>
                        </tr>
					</thead>
					<tbody></tbody>
				</table>
				<div>
					<a id='field-add-btn' onClick={this.onAddBtnClick} className={'z-depth-2 field-selector-header-btn btn-floating waves-effect waves-light '+Configs.App.BUTTON_COLOR}>
					   <i className='mdi-content-add btn-icon'></i></a>
				</div>
				<div>
					<a id='field-delete-btn' className='z-depth-2 delete-tooltipped field-selector-header-btn btn-floating waves-effect waves-light red'>
					   <i className='mdi-action-delete btn-icon'></i></a>
				</div>
			</div>
		);

		return (<div className='col s12'>{contentTable}</div>);
	}
});

var FieldRow = React.createClass({
	render: function() {
		return (
			<tr className='field-row'>
				<td id={this.props.fieldName+'-cell'} onClick={this.props.onSelection}>
					{this.props.fieldName}
				</td>
			</tr>
		)
	}
});