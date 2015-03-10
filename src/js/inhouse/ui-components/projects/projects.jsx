var intentionSubmitter = require('../../utils/intention-submitter.js');

module.exports = React.createClass({
	projectsLoaded : false,

	componentWillMount : function()
	{
		var intentionPayload = {};
	}

    render: function()
	{
		var headerStyle = {
			borderBottom : '1px solid #ebebeb'
		};

		var content;

		if (!this.projectsLoaded)
		{
			var preloaderStyle = {
				position : 'absolute',
				top : '50%',
				left : '50%',
				transform : 'translate(-50%, -50%)',
				WebkitTransform : 'translate(-50%, -50%)',
				MozTransform : 'translate(-50%, -50%)',
				MsTransform : 'translate(-50%, -50%)'
			}

			content = <img src="img/loading-spin.svg" style={preloaderStyle} />;
		}

        return (
            <div className="container">
            	<div className="row">
					<div className="col s12" style={headerStyle}>
						<h2>Projects</h2>
					</div>
					{content}
    			</div>
            </div>
        );
    }
});