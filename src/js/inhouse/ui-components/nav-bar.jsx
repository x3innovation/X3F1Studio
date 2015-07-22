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
		Bullet.on(EventType.App.USER_LOGGED_IN, 'nav-bar.jsx>>user-logged-in', function(){
			this.model.isUserLoggedIn = userStore.isLoggedIn;

			// temporarily disable the buttons until log out is implemented
			$('#user-log-in-out-icon').switchClass('mdi-social-person-outline', 'mdi-social-person');
			$('#user-log-in-out-btn').trigger('mouseleave').off('mouseenter mouseleave');
		}.bind(this));

		Bullet.on(EventType.App.PAGE_CHANGE, 'nav-bar.jsx>>page-change', function(newPageData) {
			$('#navbar-title').css('opacity', '0');
			setTimeout(function() {
				$('#navbar-title').text(newPageData.title).css('opacity', '1');
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
						<a id='logo' href='javascript:void(0)'></a>
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