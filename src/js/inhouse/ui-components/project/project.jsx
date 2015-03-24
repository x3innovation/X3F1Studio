var UserLoginFailRedirectHome = require('../common/user-login-fail-redirect-home.jsx');
var EventType = require('../../constants/event-type.js');
var userStore = require('../../stores/user-store.js');
var googleDriveService = require('../../services/google-drive-service.js');

module.exports = React.createClass({
	mixins: [Navigation, UserLoginFailRedirectHome, State],

	projectsReceived : false,

	model : {
		buttons : {
			persistentData : {
				color : 'indigo',
				isSearchOn : true
			},
			enum : {
				color : 'red',
				isSearchOn : true
			},
			event : {
				color : 'orange',
				isSearchOn : true
			},
			flow : {
				color : 'green',
				isSearchOn : true
			}
		}
	},

	/* ******************************************
                LIFE CYCLE FUNCTIONS
    ****************************************** */
	componentWillMount : function()
	{
		// load project objects on user logged in
		Bullet.on(EventType.App.USER_LOGGED_IN, 'project.jsx>>user-logged-in', this.getProjectObjects);

		// if user is already logged in, initialize
		if (userStore.isLoggedIn)
		{
			this.getProjectObjects();
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
    getProjectObjects : function()
    {
    	this.model.searchString = $('#search-input').val();

    	this.model.projectObjects = [];
    	this.forceUpdate();

    	googleDriveService.getProjectObjects(this.getParams().projectFolderFileId, null);
    },

    onReceiveProjectObjects : function(event)
    {
    	this.model.projectObjects = event.projectObjects;
    	this.projectsReceived = true;
    	this.forceUpdate();
    },

    onSearchInputChange : function()
    {
    	clearTimeout(this.searchTypingTimeout);
        this.searchTypingTimeout = setTimeout(this.getProjectObjects, 500);
    },

    onPersistentDataBtnClick : function(event)
    {
    	var button = $(event.currentTarget);
    	var model = this.model.buttons.persistentData;
    	this.switchButtonOnOff(button, model);
    },

    onEnumBtnClick : function(event)
    {
    	var button = $(event.currentTarget);
    	var model = this.model.buttons.enum;
    	this.switchButtonOnOff(button, model);
    },

    onEventBtnClick : function(event)
    {
    	var button = $(event.currentTarget);
    	var model = this.model.buttons.event;
    	this.switchButtonOnOff(button, model);
    },

    onFlowBtnClick : function(event)
    {
    	var button = $(event.currentTarget);
    	var model = this.model.buttons.flow;
    	this.switchButtonOnOff(button, model);
    },

    switchButtonOnOff : function(button, model)
    {
    	if (button.hasClass(model.color))
    	{
    		button.switchClass(model.color, 'grey');
    		model.isSearchOn = false;
    	}
    	else if (button.hasClass('grey'))
    	{
    		button.switchClass('grey', model.color);
    		model.isSearchOn = true;
    	}

    	this.getProjectObjects();
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
						<h2>{this.getParams().projectTitle}</h2>
					</div>
    			</div>
    			<div className="row">
    				<div className="col s12 center">
    					<input id="search-input" placeholder="search title" onChange={this.onSearchInputChange} />
    				</div>
    			</div>
    			<div className="row">
    				<div className="col s12 center">
    					<a className={"waves-effect waves-light btn " + this.model.buttons.persistentData.color} onClick={this.onPersistentDataBtnClick}>Persistent Data</a>
    					<a className={"waves-effect waves-light btn " + this.model.buttons.enum.color} onClick={this.onEnumBtnClick}>Enum</a>
    					<a className={"waves-effect waves-light btn " + this.model.buttons.event.color} onClick={this.onEventBtnClick}>Event</a>
    					<a className={"waves-effect waves-light btn " + this.model.buttons.flow.color} onClick={this.onFlowBtnClick}>Flow</a>
    				</div>
    			</div>
    			{content}    			
            </div>
        );
    }
});