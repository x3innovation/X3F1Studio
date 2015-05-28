var EventType=require('../../constants/event-type.js');

module.exports=React.createClass({
	/* ******************************************
                LIFE CYCLE FUNCTIONS
    ****************************************** */
    componentWillMount: function() {
    	this.model={};
    	this.model.attributeType='double';
    },

	componentDidMount: function() {
		$('select').material_select(function(){
			var data={attributeType: $('#attribute-type-dropdown input').val()};
			Bullet.trigger(EventType.PersistentDataEntry.ATTRIBUTE_TYPE_CHANGED, data);
		});

		Bullet.on(EventType.PersistentDataEntry.ATTRIBUTE_TYPE_CHANGED, 'form.jsx>>attributeTypeChanged', function(data){
		 	var newAttributeType=data.attributeType;
		 	this.onAttributeTypeChanged(newAttributeType);
		 }.bind(this));

		Bullet.on(EventType.PersistentDataEntry.ATTIBUTE_SELECTED, 'form.jsx>>attributeSelected', function(data) {
			var selectedAttribute = data.selectedAttribute;
			this.onAttributeSelected();
		}.bind(this));
	},

	componentWillUnmount: function() {
    	Bullet.off(EventType.PersistentDataEntry.ATTRIBUTE_TYPE_CHANGED, 'form.jsx>>attributeTypeChanged');
    	Bullet.off(EventType.PersistentDataEntry.ATTIBUTE_SELECTED, 'form.jsx>>attributeSelected');
    },

    componentDidUpdate: function() {

    },

	/* ******************************************
               NON LIFE CYCLE FUNCTIONS
    ****************************************** */

    onAttributeSelected: function (newAttribute) {

    },

    onAttributeTypeChanged: function(newAttributeType) {
    	this.model.attributeType=newAttributeType;
    	this.forceUpdate();
    },

	makeNameInput: function() {
		return (
			<div className='input-field col s4'>
				<input type='text' id={this.props.attributeName+'-name-field'}/>
				<label htmlFor={this.props.attributeName+'-name-field'}>name</label>
		   	</div>
		);
	},

	makeAttributeTypeInput: function() {
		return(
			<div id='attribute-type-dropdown' className='input-field col s4 offset-s4'>
				<select id={this.props.attributeName+'-type-field'} className='type-selector' value='1'>
      				<option value='1'>double</option>
      				<option value='2'>float</option>
      				<option value='3'>short</option>
      				<option value='4'>integer</option>
      				<option value='5'>long</option>
      				<option value='6'>char</option>
      				<option value='7'>string</option>
      				<option value='8'>boolean</option>
		  		</select>
		  		<label htmlFor={this.props.attributeName+'-type-field'}	>type</label>
		 	</div>
		 );
	},

	makeDescriptInput: function() {
		return(
			<div className='input-field col s12'>
				<textarea id={this.props.attributeName+'-descript-field'} className='materialize-textarea'></textarea>
				<label htmlFor={this.props.attributeName+'-descript-field'}>description</label>
		  	</div>
		); 
	},

    makeDefValueInput: function() {
		if (this.model.attributeType!=='boolean') {
			return(
				<div className='col s4 input-field'>
					<input type='text' id={this.props.attributeName+'-def-value-field'}/>
					<label htmlFor={this.props.attributeName+'-def-value-field'}>default value</label>
 	  			</div>
 	  		)
		} else {
			return(
				<div className='col s4'>
					<input type='checkbox' id={this.props.attributeName+'-def-value-field'} className='filled-in'/>
					<label htmlFor={this.props.attributeName+'-def-value-field'}>default value</label>
				</div>
			)
		}
	},

	makeCheckboxes: function() {
		return(
			<div className='col s4 offset-s4'>
				<input type='checkbox' id={this.props.attributeName+'-read-only-checkbox'} className='filled-in'/>
				<label htmlFor={this.props.attributeName+'-read-only-checkbox'}>read only</label>
				<br></br>
				<input type='checkbox' id={this.props.attributeName+'-optional-checkbox'} className='filled-in'/>
				<label htmlFor={this.props.attributeName+'-optional-checkbox'}>optional</label>
				<br></br>
				<input type='checkbox' id={this.props.attributeName+'-array-checkbox'} className='filled-in'/>
				<label htmlFor={this.props.attributeName+'-array-checkbox'}>array</label>
			</div>
		);
	},

	makeContextIdentifier: function() {
		return(
			<div className='col s12'>
				<input type='checkbox' id={this.props.attributeName+'-context-id-checkbox'} className='filled-in'/>
				<label htmlFor={this.props.attributeName+'-context-id-checkbox'}>context identifier</label>
			</div>
		);
	},

	render: function() {
		var nameInput=this.makeNameInput();
		var attributeTypeInput=this.makeAttributeTypeInput();
		var descriptInput=this.makeDescriptInput();
		var defValueInput= this.makeDefValueInput();
		var checkboxes=this.makeCheckboxes();
		var contextIdentifier=this.makeContextIdentifier();

		return(
			<div className='row'>
    			<form className='col s12' action='#!'>
					<div className='row'>
						{nameInput}
						{attributeTypeInput}
					</div>
					<div className='row'>
						{descriptInput}
					</div>
					<div className='row'>
						{defValueInput}
						{checkboxes}
					</div>
					<OptionalInput attributeType={this.model.attributeType} attributeName={this.props.attributeName}/>
					<div className='row'>
						{contextIdentifier}
					</div>
				</form>
			</div>
		);
	}
}); 

OptionalInput=React.createClass({
	render: function() {
		if (this.props.attributeType==='string'){
			return(
				<div className='row'>
					<div className='input-field col s4'>
						<input type='text' id={this.props.attributeName+'-length-field'}/>
						<label htmlFor={this.props.attributeName+'-length-field'}>length</label>
					</div>
				</div>
			);
		} else if (['double','integer','long','short','float'].indexOf(this.props.attributeType)!==-1) {
			return(
				<div className='row'>
					<div className='input-field col s4'>
						<input type='text' id={this.props.attributeName+'-min-field'}/>
						<label htmlFor={this.props.attributeName+'-min-field'}>min value</label>
					</div>
					<div className='input-field col s4'>
						<input type='text' id={this.props.attributeName+'-max-field'}/>
						<label htmlFor={this.props.attributeName+'-max-field'}>max value</label>
					</div>
				</div>
			);
		} else {
			return(
				<div className='row'>
				</div>
			);
		}
	}
});