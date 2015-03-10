var IntentionType = require('../constants/intention-type.js');
var userStore = require('../stores/user-store.js');
var EventType = require('../constants/event-type.js');

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
            this.transitionTo('projects');
        }.bind(this));
    },

    /* ******************************************
            NON LIFE CYCLE FUNCTIONS
    ****************************************** */

    onLogInBtnClick : function()
    {
        if (!this.model.isUserLoggedIn)
        {
            var intention = {};
            intention.type = IntentionType.USER_LOG_IN;
            Bullet.trigger(EventType.App.SUBMIT_INTENTION, intention);
        }
    },

	render : function()
	{
		var logoStyle = {
			position : 'absolute',
			padding : '0',
			margin : '0',
			top : '12px',
			left : '10px',
			width : '82px',
        	height : '45px',
        	background : 'url(img/logo.svg)',
        	backgroundSize : '82px 45px',
        	backgroundRepeat : 'no-repeat'
		};

        var navStyle = {
        	position : 'relative',
        	background : 'white',
        	boxShadow : '',
        	WebkitBoxShadow : '0 0 0 0 rgba(0, 0, 0, 0.16), 0 0 0 0 rgba(0, 0, 0, 0.12)',
        	MozBoxShadow : '0 0 0 0 rgba(0, 0, 0, 0.16), 0 0 0 0 rgba(0, 0, 0, 0.12)',
            boxShadow : '0 0 0 0 rgba(0, 0, 0, 0.16), 0 0 0 0 rgba(0, 0, 0, 0.12)'
        };

        var navbarButtonsStyle = {
        	position : 'absolute',
        	top : '12px',
        	right : '35px'
        };

        return (
			<nav style={navStyle}>
				<a href="javascript:void(0)" className="btn waves-effect waves-light" style={logoStyle}></a>

				<div id="navbarButtons" style={navbarButtonsStyle}>
					<a id="user-log-in-out-btn" className="btn-floating waves-effect waves-light red tooltipped" data-position="bottom" data-delay="50" data-tooltip="Log In" onClick={this.onLogInBtnClick}>
                        <i id="user-log-in-out-icon" className="mdi-social-person-outline"></i>
                    </a>
				</div>
			</nav>
        );
    }
});