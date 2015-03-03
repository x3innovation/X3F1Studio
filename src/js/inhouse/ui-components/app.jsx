var NavBar = require('./nav-bar.jsx');

module.exports = React.createClass({

	render: function()
	{
        return (
        	<div>
        		<NavBar />
        		<ReactRouter.RouteHandler />
			</div>
        );
    }
});