var EventType=require('../../constants/event-type.js');
var FieldSelector=require('./field-selector.jsx');
var Form=require('./form.jsx');
var PersistentEvents=require('./persistent-events.jsx')

module.exports=React.createClass({
	/* ******************************************
                LIFE CYCLE FUNCTIONS
    ****************************************** */
    componentWillMount: function() {
    	
    },

    componentDidMount: function() {

    },

	/* ******************************************
               NON LIFE CYCLE FUNCTIONS
    ****************************************** */

	render: function() {
		return (
			<div id='persistent-data-body-wrapper' className='row'>
				<div id='persistent-data-form-wrapper' className='row'>
					<div className='col s4' id='persistent-data-fields-container'>
						<FieldSelector />
					</div>
					<div className='col s8' id='persistent-data-form-contents'>
						<Form />
					</div>
				</div>
				<br />
				<div id='persistent-events-wrapper' className='row'>
					<div className = 'col s12' id='persistent-events-wrapper'>
						<PersistentEvents />
					</div>
				</div>
			</div>
		);
	}
});