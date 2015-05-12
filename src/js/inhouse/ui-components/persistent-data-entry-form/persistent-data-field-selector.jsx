module.exports = React.createClass ({

	/* ******************************************
                LIFE CYCLE FUNCTIONS
    ****************************************** */
    componentWillMount: function() {

    },

    componentDidMount: function() {
    	$('#PD-attribute-table').DataTable();
    },


	/* ******************************************
            NON LIFE CYCLE FUNCTIONS
    ****************************************** */
	render: function() {
		var content;
		var attributes = this.props.attributes;
		content = (
			<table id='PD-attribute-table'>
				<thead> 
					<tr><th>{"Attributes"}</th></tr>
				</thead>
				<tbody>
					{
						attributes.map(function(attribute){
							return(
								<tr><td>{attribute}</td></tr>
							);
						})
					}
				</tbody>
			</table>
		);
		return (
			<div id='PD-attributes-container'>
				{content} 
			</div>
		);
	}
});