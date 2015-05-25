var EventType = require('../../constants/event-type.js')
var Configs = require('../../app-config.js');

module.exports=React.createClass ({

	/* ******************************************
                LIFE CYCLE FUNCTIONS
    ****************************************** */
    componentWillMount : function() {
    	this.model={};
    	this.model.attributeList=this.props.attributes;
    	this.model.newAttributeCount=0;
    },

    componentDidMount : function() {
    	this.model.table = $('#persistent-data-attribute-table').DataTable({
    		scrollY: 300,
    		paging: false,
    		info: false,
    		order: [], //do not sort at table initialization to preserve order
    		search: {
    			caseInsensitive: true
  			},
  			language: {
  				search: '_INPUT_', //removes the 'search:' text, puts it directly in the searchbox
        		searchPlaceholder: 'search attributes',
        		emptyTable: 'no attributes defined'

    		},
    	});

    	this.selectTopCell();
    },

	/* ******************************************
            NON LIFE CYCLE FUNCTIONS
    ****************************************** */
   	onAddBtnClick: function(e) {
   		var newAttribute='new-attribute-'+this.model.newAttributeCount;
   		this.model.newAttributeCount++;
		this.unselectSelectedCell();

   		var newRow=this.model.table.row.add([newAttribute]).draw().node();
		$(newRow).addClass('attribute-row');
  		$(newRow).find('td').addClass('attribute-cell selected-cell')
			 	 			.attr('id', newAttribute+'-cell')
			 	 			.on('click', this.onAttributeClick);
		//setting inner scrollbar to the location of the newly added element.
		$('.dataTables_scrollBody').scrollTop($(newRow).position().top-100);
   		Bullet.trigger(EventType.PersistentDataEntry.ATTRIBUTE_ADDED);
   	},	

   	onDeleteBtnClick: function(e) {
   		var $button=$(e.currentTarget);
        e.preventDefault();
   		if ($('.selected-cell').length===0) {
   			return;
   		}
   		this.model.table.row($('.selected-cell').parents('tr')).remove().draw();
   		this.selectTopCell();
   		Bullet.trigger(EventType.PersistentDataEntry.ATTRIBUTE_REMOVED);
   	},

	onAttributeClick: function(e) {
		var $selectedCell=$(e.currentTarget);
		if ($selectedCell.hasClass('selected-cell')) {
		    return;
	    }
        else {
			this.unselectSelectedCell();
	        $selectedCell.addClass('selected-cell');
	    }
	    data = {selectedAttribute: $('.selected-cell')};
	  	Bullet.trigger(EventType.PersistentDataEntry.ATTRIBUTE_SELECTED, data);
   	},

   	selectTopCell: function() {
    	if ($('.attribute-cell').length===0) {
    		return;
    	}
   		var $firstCell=$('.attribute-cell').first();
        $firstCell.addClass('selected-cell');
   	},

   	unselectSelectedCell: function() {
   		if ($('.selected-cell').length===0) {
   			return;
   		}
       	$('.selected-cell').removeClass('selected-cell');
   	},

	render : function() {
		var contentTable;
		var attributes=this.model.attributeList;
		var rowNum=0;
		contentTable=(
			<div>
				<table id='persistent-data-attribute-table' className='dataTable hoverable col s12'>
					<thead>
						<tr><th>
							<div className='attribute-table-header'>attributes</div>
						</th></tr>
					</thead>
					<tbody>
						{
							attributes.map(function(attribute) {
								rowNum++;
								return(
									<AttributeRow onSelection={this.onAttributeClick} attributeName={attribute} key={rowNum}/>
								);
							}.bind(this))
						}
					</tbody>
				</table>
				<div>
					<a onClick={this.onAddBtnClick} id='attribute-add-header-btn'
					  	className={'header-btn btn-floating btn-small waves-effect waves-light '+Configs.App.BUTTON_COLOR}>
						<i className='mdi-content-add btn-icon'></i></a>
				</div>
				<div>
					<a onClick={this.onDeleteBtnClick} id='attribute-delete-header-btn' 
					   className='header-btn btn-floating btn-small waves-effect waves-light red'>
					   <i className='mdi-action-delete btn-icon'></i></a>
				</div>
			</div>
		);

		return (<div className='col s12'>{contentTable}</div>);
	}
});

var AttributeRow = React.createClass({
	render: function() {
		return (
			<tr className='attribute-row'>
				<td className='attribute-cell' id={this.props.attributeName+'-cell'} onClick={this.props.onSelection}>
					{this.props.attributeName}
				</td>
			</tr>
		)
	}
});