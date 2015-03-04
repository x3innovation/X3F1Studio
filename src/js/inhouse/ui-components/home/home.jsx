module.exports = React.createClass({
    render: function()
	{
		var wrapperStyle = {
			position : 'absolute',
			top : '0px',
			left : '0px',
			width : '100vw',
			height : '100vh',
			background : 'url(img/x3background.jpg)',
			backgroundSize : '100vw 100vh',
			backgroundRepeat : 'no-repeat'
		};

		var homeMessage = {
			position : 'absolute',
			top : '50%',
			left : '50%',
			WebkitTransform : 'translate(-50%, -50%)',
			MozTransform : 'translate(-50%, -50%)',
			MsTransform : 'translate(-50%, -50%)',
			transform : 'translate(-50%, -50%)',
			textAlign : 'center',
			color : 'white',
			fontSize : '1em'
		};

		var messageLogoStyle = {
			width : '50px',
			height : '38px'
		};

        return (
            <div style={wrapperStyle}>
            	<div style={homeMessage}>
            		<p>
            			<img src="img/logo.svg" style={messageLogoStyle} /><br /><br />
            			a group of<br /><br />
            			passionate, dedicated, creative and business savvy technologists<br /><br />
            			use our knowledge, our experience and our intuition<br /><br />
            			to develop<br /><br />
            			declarative, deterministic and highly efficient technology<br /><br />
            			pushing the boundaries of what can be accomplished<br /><br />
            			never settling for mediocrity<br /><br />
            			helping others reach their goals<br /><br />
            			that is who we are<br /><br />
            			we are<br /><br />
            			X3<br /><br />
            		</p>
            	</div>
            </div>
        );
    }
});