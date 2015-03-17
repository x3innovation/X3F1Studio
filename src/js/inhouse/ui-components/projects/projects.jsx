var IntentionType = require('../../constants/intention-type.js');
var intentionSubmitter = require('../../utils/intention-submitter.js');
var UserLoginFailRedirectHome = require('../commons/user-login-fail-redirect-home.jsx');
var EventType = require('../../constants/event-type.js');
var ProjectCard = require('./project-card.jsx');

module.exports = React.createClass({
	mixins: [Navigation, UserLoginFailRedirectHome],

	projectsReceived : false,

	model : {},

	/* ******************************************
                LIFE CYCLE FUNCTIONS
    ****************************************** */
	componentWillMount : function()
	{
		Bullet.on(EventType.App.USER_LOGGED_IN, 'projects.jsx>>user-logged-in', this.onUserLoggedIn);
	},

	componentDidMount : function()
	{
		// hide placeholder on focus, then display on blur
		$('#projectSearchInput').focus(function(){$(this).attr('placeholder', '');})
								.blur(function(){$(this).attr('placeholder', 'search title');});
	},

	/* ******************************************
            NON LIFE CYCLE FUNCTIONS
    ****************************************** */
    onUserLoggedIn : function()
    {
    	intentionSubmitter.submit(IntentionType.GET_PROJECTS, {}, this.onReceiveProjects);
    },

    onReceiveProjects : function(event)
    {
    	this.model.projects = event.projects;
    	this.projectsReceived = true;
    	this.forceUpdate();
    },

    onSearchInputChange : function()
    {
    	clearTimeout(this.searchTypingTimeout);
        this.searchTypingTimeout = setTimeout(this.getProjects, 500);
    },

    getProjects : function()
    {
    	this.model.projects = [];
    	this.forceUpdate();

    	var intentionPayload = {};
    	intentionPayload.titleSearchString = $('#projectSearchInput').val();
    	intentionSubmitter.submit(IntentionType.GET_PROJECTS, intentionPayload, this.onReceiveProjects);
    },

    render: function()
	{
		var content;
		if (!this.projectsReceived)
		{
			var wrapperStyle = {
				position : 'relative',
				height : '20em'
			};

			var preloaderStyle = {
				position : 'absolute',
				top : '50%',
				left : '50%',
				transform : 'translate(-50%, -50%)',
				WebkitTransform : 'translate(-50%, -50%)',
				MozTransform : 'translate(-50%, -50%)',
				MsTransform : 'translate(-50%, -50%)'
			};

			content = <div style={wrapperStyle}>
						<img src="img/loading-spin.svg" style={preloaderStyle} />
					</div>
		}
		else
		{
			// need to put search project ids in 2d array with row size 4 elements.
	        // this is to loop and display project cards, 4 cards in each row.
	        var twoDimensionalProjects = [];
	        var projects = this.model.projects;
	        var rowArray;
	        for (var i in projects)
	        {
	            if (i % 4 == 0)
	            {
	                rowArray = [];
	                rowArray.push(projects[i]);
	                twoDimensionalProjects.push(rowArray);
	            }
	            else
	            {
	                rowArray.push(projects[i]);
	            }
	        }

			content = 	(
		                    twoDimensionalProjects.map(function(rowArray, rowIndex){
		                        return (
		                            <div key={rowIndex} className="row">
		                                {
		                                    rowArray.map(function(project, columnIndex){
		                                       	return (
		                                            <div key={columnIndex} className="col s3 f1-project-card">
		                                                <ProjectCard title={project.title} 
		                                                			 fileId={project.id} />
													</div>
		                                       	)
		                                    })
		                                }
		                            </div>
		                        )
		                    })
		                );
		}

		// styles
		var headerStyle = {
			borderBottom : '1px solid #ebebeb'
		};

		var searchInputStyle = {
			width : '20em',
			fontSize : '2em',
			fontWeight : '200',
			outline : 'none',
			margin : '10px 0 10px 0',
			textAlign : 'center',
			borderTop : '0',
			borderRight : '0',
			borderLeft : '0'
		}

        return (
            <div className="container">
            	<div className="row">
					<div className="col s12" style={headerStyle}>
						<h2>Projects</h2>
					</div>
    			</div>
    			<div className="row">
    				<div className="col s12 center">
    					<input id="projectSearchInput" style={searchInputStyle} placeholder="search title" onChange={this.onSearchInputChange} />
    				</div>
    			</div>
    			{content}    			
            </div>
        );
    }
});