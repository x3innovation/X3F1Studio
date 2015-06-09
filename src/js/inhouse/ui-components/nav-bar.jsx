var userStore = require('../stores/user-store.js');
var EventType = require('../constants/event-type.js');
var userService = require('../services/user-service.js');

module.exports = React.createClass({
	mixins: [Navigation],

    model : {},

    /* ******************************************
                LIFE CYCLE FUNCTIONS
    ****************************************** */

    componentDidMount : function()
    {
        Bullet.on(EventType.App.USER_LOGGED_IN, 'nav-bar.js>>user-logged-in', function(){
            this.model.isUserLoggedIn = userStore.isLoggedIn;

            // temporarily disable the buttons until log out is implemented
            $('#user-log-in-out-icon').switchClass('mdi-social-person-outline', 'mdi-social-person');
            $('#user-log-in-out-btn').trigger('mouseleave').off('mouseenter mouseleave');
        }.bind(this));
    },

    /* ******************************************
            NON LIFE CYCLE FUNCTIONS
    ****************************************** */

    onLogInBtnClick : function()
    {
        if (!this.model.isUserLoggedIn)
        {
            userService.logIn();
        }
    },

	render : function()
	{
        return (
            <div className = 'navbar-fixed'>
    			<nav id="menu-nav">
                    <div className="nav-wrapper">
        				<a id="logo" href="javascript:void(0)" className="btn waves-effect waves-light"></a>
        				<div id="navbar-buttons">
        					<a id="user-log-in-out-btn" className="navbar-btn btn-floating waves-effect waves-light red tooltipped"
                               data-position="bottom" data-delay="50" data-tooltip="Log In" onClick={this.onLogInBtnClick}>
                                <i id="user-log-in-out-icon" className="mdi-social-person-outline"></i>
                            </a>
        				</div>
                    </div>
    			</nav>
            </div>
        );
    }
});