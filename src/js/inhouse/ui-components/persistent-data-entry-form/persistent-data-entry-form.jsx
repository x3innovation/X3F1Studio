var PDContents = require('./persistent-data-form-contents.jsx');
var PDHeader = require('./persistent-data-header.jsx');

module.exports = React.createClass({
	/* ******************************************
                LIFE CYCLE FUNCTIONS
    ****************************************** */
    componentWillMount: function()
    {
    	this.model = {};
    	this.model.title = "Title";
    	this.model.description = "asdf";
    	this.model.attributes = ["a","b","c"];
    },
    
	/* ******************************************
               NON LIFE CYCLE FUNCTIONS
    ****************************************** */

    render: function() {
		return(
			<div id = 'PD-form-container'>
				<PDHeader title = {this.model.title} desc = {this.model.description} />
				<PDContents attributes = {this.model.attributes} />
			</div>
		);
	}
}); 