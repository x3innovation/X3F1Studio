var PDFieldSelector = require('./persistent-data-field-selector.jsx');
var PDForm = require('./persistent-data-form.jsx');
var EventType = require('../../constants/event-type.js');

module.exports = React.createClass({
	/* ******************************************
                LIFE CYCLE FUNCTIONS
    ****************************************** */
    componentWillMount: function() {
        this.model = {};
        this.model.attribute='';
    },

    componentDidMount: function() {
    	var that = this;
    	Bullet.on(EventType.PersistentDataEntry.ATTRIBUTE_SELECTED, 'persistent-data-body.jsx>>attribute-selected', 
    		function(data){
    		    that.model.attribute = data.selectedAttribute.text()
    			setTimeout(function() { //make sure state was changed before performing other functions
                    that.forceUpdate(); 
                }, 0);
    		});
    },

    componentWillUnmount: function() {
    	Bullet.off(EventType.PersistentDataEntry.ATTRIBUTE_SELECTED, 'persistent-data-body.jsx>>attribute-selected');
    },

	/* ******************************************
               NON LIFE CYCLE FUNCTIONS
    ****************************************** */
    getInitialState: function() {
    	return {attribute: ""}
    },

	render: function() {
		return (
			<div id = 'persistent-data-form-wrapper'>
				<div className = 'row'>
					<div className = 'col s4' id='persistent-data-attributes-container'>
						<PDFieldSelector attributes={this.props.attributes}/>
					</div>
					<div className = 'col s8' id = 'persistent-data-form-contents'>
						<PDForm attributeName= {this.state.attribute}/>
					</div>
				</div>
			</div>
		);
	}
});