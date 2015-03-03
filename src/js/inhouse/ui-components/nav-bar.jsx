module.exports = React.createClass({
	mixins: [Navigation],

    /* ******************************************
                LIFE CYCLE FUNCTIONS
    ****************************************** */

    /* ******************************************
            NON LIFE CYCLE FUNCTIONS
    ****************************************** */
	render : function()
	{
		var logoStyle = {
			position : 'absolute',
			padding : '0',
			margin : '0',
			top : '10px',
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
        	MozBoxShadow : '0 0 0 0 rgba(0, 0, 0, 0.16), 0 0 0 0 rgba(0, 0, 0, 0.12)'
        };

        var navbarButtonsStyle = {
        	position : 'absolute',
        	top : '12px',
        	right : '50px'
        };

        return (
			<nav style={navStyle}>
				<a href="javascript:void(0)" className="btn waves-effect" style={logoStyle}></a>

				<div id="navbarButtons" style={navbarButtonsStyle}>
					<a className="btn-floating waves-effect waves-light red tooltipped" data-position="bottom" data-delay="50" data-tooltip="Log In"><i className="mdi-social-person-outline"></i></a>
				</div>
			</nav>
        );
    }
});