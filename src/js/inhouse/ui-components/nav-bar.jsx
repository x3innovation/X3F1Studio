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
		var model = this.model;

		var logoStyle = {
			float : 'left',
			height : '64px'
		};

        var navStyle = {
            WebkitTransform : 'translateZ(0)',
            MozTransform : 'translateZ(0)'
        };

        return (
    		<div className="navbar">

				<nav style={navStyle}>
					<div className="nav-wrapper">
						<div className="col s12">
							<div style={{float:'left'}}>
								<img src="img/logo.svg" style={logoStyle} />
							</div>
							<ul className="right side-nav">
								
        					</ul>
						</div>
					</div>
				</nav>

			</div>
        );
    }
});