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
			if(extendsField.id === parent.id){
				$('#parent-select').append(
			      $("<option selected></option>")			      		        
			        .text(parent.title) 
			        .val(parent.id)
				);
			}	
			else{
				$('#parent-select').append(
			      $("<option></option>")			      		        
			        .text(parent.title) 
			        .val(parent.id)
				);
			}	
		});	

		$('#parent-select').material_select(function() {			
			_this.onParentChanged( $('#parent-select option:selected').val(),  $('#parent-select option:selected').text());
		});		
	},

	onParentChanged: function(id, name){		
		this.controller.setFieldExtend(id, name);
	},

	render: function() {
		var _this = this;	

		return (
			<div id='parents-container' className = 'row'>
				<div id='parents-dropdown' className='input-field col s3'>	
					<select id='parent-select' className='ref-name-selector form-select'>
						<option value=''>None</option>							
					</select>			
					<label htmlFor='parent-select' id='extend-field'>Extends: </label>										
				</div>		
			</div>
		);
	}
});