var UserLoginFailRedirectHome = require('../common/user-login-fail-redirect-home.jsx');
var EventType = require('../../constants/event-type.js');
var Configs = require('../../app-config.js');
var Card = require('./card.jsx');
var googleDriveService = require('../../services/google-drive-service.js');
var userStore = require('../../stores/user-store.js');

module.exports = React.createClass({
	mixins: [Navigation, UserLoginFailRedirectHome],

	projectsReceived : false,

	model : {},

	/* ******************************************
                LIFE CYCLE FUNCTIONS
    ****************************************** */
	componentWillMount : function()
	{
		Bullet.on(EventType.App.USER_LOGGED_IN, 'projects.jsx>>user-logged-in', this.initialize);

		// if user is already logged in, still need to initialize
		if (userStore.isLoggedIn)
		{
			this.initialize();
		}
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
    initialize : function()
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

    onAddProjectBtnClick: function(e) {
        clearTimeout(this.createProjectTimeout);
        this.createProjectTimeout = setTimeout(this.createNewProject, 100);
    },

    createNewProject: function() {
    	googleDriveService.createNewProject(function(project) { //transition as a callback
    		var params = {};
    		params.projectFolderFileId=project.parents[0].id;
    		params.projectFileId=project.id;
    		this.transitionTo('project', params);
    	}.bind(this));
    },

    render: function()
	{
		var content;
		if (!this.projectsReceived)
		{
			content = <div id="cards-wrapper">
						<img id="cards-wrapper-preloader" src="img/loading-spin.svg" />
					</div>;
		}
		else
		{
	        var projects = this.model.projects;	       

	        var cellStyle = {
	        	marginBottom : '30px'
	        };

	        content = 	<div className="row">
	        				{
	        					projects.map(function(project, columnIndex){
	        						return (
	        							<div key={columnIndex} className="col s3 f1-project-card" style={cellStyle}>
											<Card
												title={project.title} 
											    fileId={project.id}
												projectFolderFileId={project.parents[0].id}
												model={{}} />
										</div>
	        						);
	        					})
	        				}
				    		<div className="col s3 center">
				    			<a id="project-add-btn" className={"btn-floating waves-effect waves-light " + Configs.App.ADD_BUTTON_COLOR} 
				    				onClick={this.onAddProjectBtnClick}>
				                    <i className="mdi-content-add"></i>
				                </a>
				    		</div>	
	        			</div>;
		}

		return (
			<div className="container">
				<div className="row">
					<div className="col s12 center">
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