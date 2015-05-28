var AttributeSelector=require('./attribute-selector.jsx');
var Form=require('./form.jsx');
var EventType=require('../../constants/event-type.js');

module.exports=React.createClass({
	/* ******************************************
                LIFE CYCLE FUNCTIONS
    ****************************************** */
    componentWillMount: function() {
        this.model={};
        this.model.attribute='';
    },

    componentDidMount: function() {
    	var that=this;
    },

    componentWillUnmount: function() {
    },

	/* ******************************************
               NON LIFE CYCLE FUNCTIONS
    ****************************************** */

	render: function() {
		return (
			<div id='persistent-data-form-wrapper' className='row'>
				<div className='col s4' id='persistent-data-attributes-container'>
					<PersistentDataFieldSelector attributes={this.props.attributes} />
				</div>
				<div className='col s8' id='persistent-data-form-contents'>
					<PersistentDataForm attributeName={this.model.attribute} />
				</div>
			</div>
		);
	}
});