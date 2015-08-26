var userStore = require('../../stores/user-store.js');
var EventType = require('../../constants/event-type.js');

module.exports = {
    componentWillMount : function()
    {   
        var _this = this;
    	Bullet.on(EventType.App.USER_LOG_IN_FAIL, 'user-logged-in-required.jsx>>handle-user-log-in-fail', function(){
    		_this.replaceWith('home');
    		Materialize.toast('Moving to Home : user log in failed');
    	});
    },

    componentWillUnmount : function()
    {
    	Bullet.off(EventType.App.USER_LOG_IN_FAIL, 'user-logged-in-required.jsx>>handle-user-log-in-fail');
    }
}