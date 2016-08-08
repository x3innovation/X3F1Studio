var extendsField = null;
module.exports = React.createClass({
	
	/* ******************************************
				LIFE CYCLE FUNCTIONS
	****************************************** */
	componentWillMount: function()
	{
		this.controller = this.props.controller;
		extendsField = this.controller.getFieldExtend();
	},

	componentDidMount: function()
	{
		this.initialize();
	},

	componentWillUnmount: function() {
		this.gFileCustomModel = null;
		this.gFields = null;		
	},

	/* ******************************************
				NON LIFE CYCLE FUNCTIONS
	****************************************** */
	initialize: function()
	{
		var _this = this;		
		parents = this.controller.loadProjectObjects(onProjectObjectsLoaded);	

		function onProjectObjectsLoaded(parents)
		{
			_this.updateParents(parents);
		}
	},
	updateParents: function(parents) {		
		var _this = this;	

		$.each(parents, function(i, parent){
			if(extendsField === parent.title){
				$('#parent-select').append(
			      $("<option selected></option>")			      		        
			        .text(parent.title)
				);
			}	
			else{
				$('#parent-select').append(
			      $("<option></option>")			      		        
			        .text(parent.title)
				);
			}	
		});	

		$('#parent-select').material_select(function() {
			_this.onParentChanged($('#parent-select').val());
		});		
	},

	onParentChanged: function(value){
		this.controller.setFieldExtend(value);
	},

	render: function() {
		var _this = this;	

		return (
			<div id='parents-container' className = 'row'>
				<div id='parents-dropdown' className='input-field col s3'>	
					<select id='parent-select' className='ref-name-selector form-select' value='default'>
						<option value='null'>Choose your option</option>							
					</select>			
					<label htmlFor='parent-select' id='extend-field'>Extends: </label>										
				</div>		
			</div>
		);
	}
});