var FieldSelector=require('./field-selector.jsx');
var Form=require('./form.jsx');
var EventType=require('../../constants/event-type.js');

module.exports=React.createClass({
	/* ******************************************
                LIFE CYCLE FUNCTIONS
    ****************************************** */
    componentWillMount: function() {
        this.model={};
        this.model.field='';
    },

    componentDidMount: function() {
    },

    componentWillUnmount: function() {
    },

	/* ******************************************
               NON LIFE CYCLE FUNCTIONS
    ****************************************** */

	render: function() {
		return (
			<div id='persistent-data-form-wrapper' className='row'>
				<div className='col s4' id='persistent-data-fields-container'>
					<FieldSelector fields={this.props.fields} />
				</div>
				<div className='col s8' id='persistent-data-form-contents'>
					<Form fieldName={this.model.field} />
				</div>
			</div>
		);
	}
});