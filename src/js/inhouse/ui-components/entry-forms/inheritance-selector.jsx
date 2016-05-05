module.exports = React.createClass({
	/* ******************************************
				LIFE CYCLE FUNCTIONS
	****************************************** */
	componentWillMount: function()
	{
		this.controller = this.props.controller;	

	},

	componentDidMount: function()
	{
		this.updateUi();
	},

	/* ******************************************
				NON LIFE CYCLE FUNCTIONS
	****************************************** */
	updateUi: function() {
		// populate parent lists
		var parents = ['abc', 'asdjk', 'ajksf'];
		$.each(parents, function(i, parent){			
			$('#parent-select').append(
		      $("<option></option>")			        
		        .text(parent)
			  );
		});
		//$('#parent-select').material_select();		
	},

	

	render: function() {
		var _this = this;	

		return (
			<div id='parents-container' className = 'row'>					
				<div id='parents-dropdown' className='col s4 '>
				<label htmlFor='parent-select' >Extends: </label>	
					<select id='parent-select'>
						<option value="" disabled selected>Choose your option</option>							
					</select>										
				</div>		
			</div>
		);
	}
});
