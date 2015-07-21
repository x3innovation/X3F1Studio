var EventType = require('../../constants/event-type.js');
var LocalStorageKey = require('../../constants/local-storage-key.js');

module.exports = React.createClass({
	mixins: [Navigation],

	componentWillMount : function()
	{
		if (store.get(LocalStorageKey.HAS_USER_PREVIOUSLY_LOGGED_IN))
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