var userStore = require('../../stores/user-store.js');
var EventType = require('../../constants/event-type.js');

module.exports = {
    componentWillMount : function()
    {
    	Bullet.on(EventType.App.USER_LOG_IN_FAIL, 'user-logged-in-required.jsx>>handle-user-log-in-fail', function(){
    		this.replaceWith('home');
    		toast('Moving to Home : user log in failed');
    	}.bind(this));
    },

    componentWillUnmount : function()
    {
    	Bullet.off(EventType.App.USER_LOG_IN_FAIL, 'user-logged-in-required.jsx>>handle-user-log-in-fail');
    }
}