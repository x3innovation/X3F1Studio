var UserLoginFailRedirectHome = require('../common/user-login-fail-redirect-home.jsx');
var EventType = require('../../constants/event-type.js');
var ProjectCard = require('./project-card.jsx');
var googleDriveService = require('../../services/google-drive-service.js');

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
		$('#search-input').focus(function(){$(this).attr('placeholder', '');})
								.blur(function(){$(this).attr('placeholder', 'search title');});
	},

	/* ******************************************
            NON LIFE CYCLE FUNCTIONS
    ****************************************** */
    onUserLoggedIn : function()
    {
    	googleDriveService.getProjects('', this.onReceiveProjects);
    },

    onReceiveProjects : function(projects)
    {
    	this.model.projects = projects;
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

    	var titleSearchString = $('#search-input').val();
    	googleDriveService.getProjects(titleSearchString, this.onReceiveProjects);
    },

    render: function()
	{
		var content;
		if (!this.projectsReceived)
		{
			content = <div id="cards-wrapper">
						<img id="cards-wrapper-preloader" src="img/loading-spin.svg" />
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
		                                                			 projectFolderFileId={project.parents[0].id}
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
    					<input id="search-input" placeholder="search title" onChange={this.onSearchInputChange} />
    				</div>
    			</div>
    			{content}
            </div>
        );
    }
});