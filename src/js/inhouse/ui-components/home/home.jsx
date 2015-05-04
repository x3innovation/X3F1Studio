var EventType = require('../../constants/event-type.js');
var Constant = require('../../constants/constant.js');

module.exports = React.createClass({
	mixins: [Navigation],

	componentWillMount : function()
	{
		if (store.get(Constant.HAS_USER_PREVIOUSLY_LOGGED_IN))
		{
			this.replaceWith('projects');
		}
	},

    render: function()
	{
        return (
            <div>
            </div>
        );
    }
});