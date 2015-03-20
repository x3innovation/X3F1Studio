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
		$('#project-search-input').focus(function(){$(this).attr('placeholder', '');})
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
    	intentionPayload.titleSearchString = $('#project-search-input').val();
    	intentionSubmitter.submit(IntentionType.GET_PROJECTS, intentionPayload, this.onReceiveProjects);
    },

    render: function()
	{
		var content;
		if (!this.projectsReceived)
		{
			content = <div id="projects-cards-wrapper">
						<img id="projects-cards-wrapper-preloader" src="img/loading-spin.svg" />
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

	        var cellStyle = {
	        	marginBottom : '30px'
	        };

			content = 	(
		                    twoDimensionalProjects.map(function(rowArray, rowIndex){
		                        return (
		                            <div key={rowIndex} className="row">
		                                {
		                                    rowArray.map(function(project, columnIndex){
		                                       	return (
		                                            <div key={columnIndex} className="col s3 f1-project-card" style={cellStyle}>
		                                                <ProjectCard title={project.title} 
		                                                			 fileId={project.id}
		                                                			 model={{}} />
													</div>
		                                       	)
		                                    })
		                                }
		                            </div>
		                        )
		                    })
		                );
		}

        return (
            <div className="container">
            	<div className="row">
					<div className="col s12">
						<h2>Projects</h2>
					</div>
    			</div>
    			<div className="row">
    				<div className="col s12 center">
    					<input id="project-search-input" placeholder="search title" onChange={this.onSearchInputChange} />
    				</div>
    			</div>
    			{content}    			
            </div>
        );
    }
});