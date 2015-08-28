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
		var _this = this;

		Bullet.on(EventType.App.USER_LOGGED_IN, 'nav-bar.jsx>>user-logged-in', function(){
			_this.model.isUserLoggedIn = userStore.isLoggedIn;

			// temporarily disable the buttons until log out is implemented
			$('#user-log-in-out-icon').switchClass('mdi-social-person-outline', 'mdi-social-person');
			$('#user-log-in-out-btn').trigger('mouseleave').off('mouseenter mouseleave');
		});

		var $navbarTitle = $('#navbar-title');
		Bullet.on(EventType.App.PAGE_CHANGE, 'nav-bar.jsx>>page-change', function(newPageData) {
			$navbarTitle.css({'opacity': '0', 'margin-top': '30px'});
			setTimeout(function() {
				$navbarTitle.text(newPageData.title).css({'opacity': '1', 'margin-top': '0'});
			}, 600);
		});
	},

	componentWillUnmount: function() {
		Bullet.off(EventType.App.USER_LOGGED_IN, 'nav-bar.jsx>>user-logged-in');
		Bullet.off(EventType.App.PAGE_CHANGE, 'nav-bar.jsx>>page-change');
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
						<a id='logo' href='#/projects'></a>
						<div id='f1-studio-title'>F1 STUDIO</div>
						<div id='navbar-title'/>
						<div id='navbar-buttons'>
							<a id="user-log-in-out-btn" className="navbar-btn btn-floating waves-effect waves-light materialize-red tooltipped"
							   data-position="bottom" data-delay="50" data-tooltip="Log In" onClick={this.onLogInBtnClick}>
								<i id="user-log-in-out-icon" className="mdi-social-person-outline navbar-btn-icon"></i>
							</a>
						</div>
					</div>
				</nav>
			</div>
		);
	}
});