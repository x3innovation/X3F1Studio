var PDBody = require('./persistent-data-body.jsx');
var PDHeader = require('./persistent-data-header.jsx');

module.exports = React.createClass({
	/* ******************************************
                LIFE CYCLE FUNCTIONS
    ****************************************** */
    componentWillMount: function()
    {
    	this.model = {};
    	this.model.title = "title";
    	this.model.description = "this is a persistent data element with editable fields";
    	this.model.attributes = ["a","b","c","d","e","f","g","h","i","j","k","l", 
                                 "a2","b2","c2","d2","e2","f2","g2","h2","i2","j2","k2","l2"];
    },
    
    componentDidMount: function() {

    },

	/* ******************************************
               NON LIFE CYCLE FUNCTIONS
    ****************************************** */

    render: function() {
		return(
			<div id = 'persistent-data-form-container' className = "container">
				<PDHeader title = {this.model.title} desc = {this.model.description} />
				<PDBody attributes = {this.model.attributes} />
			</div>
		);
	}
}); 