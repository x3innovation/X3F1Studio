var EventType = require('../../constants/event-type.js')

module.exports=React.createClass ({

	/* ******************************************
                LIFE CYCLE FUNCTIONS
    ****************************************** */
    componentWillMount : function() {

    },

    componentDidMount : function() {
    	var table = $('#persistent-data-attribute-table').DataTable({
    		scrollY: 300,
    		paging: false,
    		ordering: false,
    		info: false,
    		search: {
    			caseInsensitive: false
  			},
  			language: {
  				search: "_INPUT_", //removes the "search:" text, puts it directly in the searchbox
        		searchPlaceholder: "search attributes"
    		}
    	});
    },

	/* ******************************************
            NON LIFE CYCLE FUNCTIONS
    ****************************************** */
	render : function() {
		var onAttributeClick = function(event) {
	    	var attribute=$(event.currentTarget);
	    	if (attribute.hasClass('selected-cell')){
	            return;
	        }
	        else {
	            $('td.selected-cell').removeClass('selected-cell');
	            attribute.addClass('selected-cell');
	        }
	        data = {selectedAttribute: $('td.selected-cell')};
	    	Bullet.trigger(EventType.PersistentDataEntry.ATTRIBUTE_SELECTED, data);
    	};

		var contentTable;
		var attributes=this.props.attributes;
		contentTable=(
			<table id='persistent-data-attribute-table' className='dataTable hoverable col s12'>
				<thead> 
					<tr><th className='attribute-table-header'>attributes</th></tr>
				</thead>
				<tbody>
					{
						attributes.map(function(attribute){
							return(
								<AttributeRow onSelect={onAttributeClick} attributeName={attribute}/>
							);
						})
					}
				</tbody>
			</table>
		);

		return (
			<div>
				{contentTable}
			</div>
		);
	}
});

var AttributeRow = React.createClass({
	render: function() {
		var attribute = this.props.attributeName;

		return (
			<tr className='attribute-row'>
				<td className='attribute-cell' id={attribute+'-cell'} onClick={this.props.onSelect}>
					{attribute}
				</td>
			</tr>
		)
	}
});