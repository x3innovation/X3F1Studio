var UserLoginFailRedirectHome = require('../common/user-login-fail-redirect-home.jsx');
var EventType = require('../../constants/event-type.js');
var userStore = require('../../stores/user-store.js');
var googleDriveService = require('../../services/google-drive-service.js');
var Card = require('./card.jsx');
var GDriveCons = require('../../constants/google-drive-constants.js');
var DefaultValueCons = require('../../constants/default-value-constants.js');
var Configs = require('../../app-config.js');

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
		Bullet.on(EventType.App.USER_LOGGED_IN, 'project.jsx>>user-logged-in', this.initialize);
	},

	componentDidMount : function()
	{

        // if user is already logged in, still need to initialize
        if (userStore.isLoggedIn)
        {
            this.initialize();
        }

		// hide placeholder on focus, then display on blur
		$('#search-input').focus(function(){$(this).attr('placeholder', '');})
						  .blur(function(){$(this).attr('placeholder', 'search title');});

		// title and description blind animation wire up
		$('#project-title').focus(blindDownDescription).focusout(blindUpDescription);
		$('#project-description').focusout(blindUpDescription);
		function blindDownDescription()
		{
			if ($('#project-description-wrapper').css('display') == 'none')
			{
				$('#project-description-wrapper').toggle('blind');
			}
		}
		function blindUpDescription()
		{
			setTimeout(function(){
				if (!$('#project-description').is(':focus') && !$('#project-title').is(':focus'))
				{
					$('#project-description-wrapper').toggle('blind');
				}	
			}, 100);			
		}

        // initialize add button modal
        $('#project-object-add-btn').leanModal({
            modalInitialTopPosition: '20%',
            modalEndTopPosition: '30%',
            ready: function() {
                $('#lean-overlay').css('width', '100%').css('height', '100%').css('z-index', '10');
            }
        });
	},

	/* ******************************************
            NON LIFE CYCLE FUNCTIONS
    ****************************************** */
    initialize : function()
    {
    	// load google drive project metadata file
		gapi.drive.realtime.load(this.getParams().projectFileId, this.onProjectFileLoaded, null);

		this.getProjectObjects();
    },

    onProjectFileLoaded : function(doc)
    {
    	var gModel = doc.getModel();

        if (!gModel.getRoot().get(GDriveCons.Project.KEY_TITLE)) {
            gModel.getRoot().set(GDriveCons.Project.KEY_TITLE, 
                                 gModel.createString(DefaultValueCons.NewFileValues.PROJECT_TITLE));
            gModel.getRoot().set(GDriveCons.Project.KEY_DESCRIPTION, 
                                 gModel.createString(DefaultValueCons.NewFileValues.PROJECT_DESCRIPTION));
        }

    	var titleInput = document.getElementById('project-title');
    	var titleModel = gModel.getRoot().get(GDriveCons.Project.KEY_TITLE) 
    	gapi.drive.realtime.databinding.bindString(titleModel, titleInput);

    	var descriptionInput = document.getElementById('project-description');
    	var descriptionModel = gModel.getRoot().get(GDriveCons.Project.KEY_DESCRIPTION) 
		gapi.drive.realtime.databinding.bindString(descriptionModel, descriptionInput);
		$('#project-description-wrapper').css('display', 'initial');
		autosize(document.getElementById('project-description'));
		$('#project-description-wrapper').css('display', 'none');

    	// everytime title is changed, need to save it to the underlying file's titles as well
        // this will help displaying the projects in sorted alphabetical fashion when projects are loaded.
        var titleChangeTimeout = this.titleChangeTimeout;
        var onTitleChange = function()
        {
            clearTimeout(titleChangeTimeout);
            titleChangeTimeout = setTimeout(this.saveTitleToFileItself, 500);
        }.bind(this);
        titleModel.addEventListener(gapi.drive.realtime.EventType.TEXT_INSERTED, onTitleChange);
        titleModel.addEventListener(gapi.drive.realtime.EventType.TEXT_DELETED, onTitleChange);
    },

    saveTitleToFileItself : function()
    {
    	var newTitle = $('#project-title').val();
        googleDriveService.saveProjectTitle(this.getParams().projectFileId, newTitle, this.getParams().projectFolderFileId)
    },

    getProjectObjects : function()
    {
    	this.model.projectObjects = [];
    	this.forceUpdate();

    	googleDriveService.getProjectObjects(this.getParams().projectFolderFileId,
    										 $('#search-input').val(),
    										 this.model.buttons.persistentData.isSearchOn,
    										 this.model.buttons.enum.isSearchOn,
    										 this.model.buttons.event.isSearchOn,
    										 this.model.buttons.flow.isSearchOn,
    										 this.onReceiveProjectObjects);
    },

    onReceiveProjectObjects : function(projectObjects)
    {
    	this.model.projectObjects = projectObjects;
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

    onAddPersistentDataBtnClick : function(e)
    {
        this.createNewPersistentData();
    },

    createNewPersistentData: function() 
    {
        googleDriveService.createNewPersistentData(this.getParams().projectFolderFileId, function(file) {
            var params={};
            params.projectFolderFileId = this.getParams().projectFolderFileId;
            params.projectFileId = this.getParams().projectFileId;
            params.persistentDataFileId = file.id;
            this.transitionTo('persistentDataEntry', params);
            $('#lean-overlay').remove();
        }.bind(this)); 
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

    onToProjectsBtnClick : function()
    {
    	this.transitionTo('projects');
    },

    render: function()
	{
        var projectFileId = this.getParams().projectFileId;
        var projectFolderFileId = this.getParams().projectFolderFileId;
		var content;
		if (!this.projectsReceived)
		{
			content = <div id="cards-wrapper">
						<img id="cards-wrapper-preloader" src="img/loading-spin.svg" />
					</div>
		}
		else
		{
	        var projectObjects = this.model.projectObjects;

	        var cellStyle = {
	        	marginBottom : '30px'
	        };

	        content = 	<div className="row">
	        				{
	        					projectObjects.map(function(projectObject, columnIndex){
                                   	return (
                                        <div key={columnIndex} className="col s3 f1-project-card" style={cellStyle}>
                                            <Card title={projectObject.title} 
                                                               projectFileId={projectFileId}
                                                               projectFolderFileId={projectFolderFileId}
                                            				   fileId={projectObject.id}
                                            				   objectType={projectObject.description}
                                            				   model={{}} />
										</div>
                                   	)
                                })
	        				}
	        			</div>;
		}

        return (
            <div className="container">
            	<i id="to-projects-btn" className='medium mdi-navigation-arrow-back' onClick={this.onToProjectsBtnClick}></i>
            	<div className="row">
					<div id="project-title-description-wrapper" className="col s12">
						<input type="text" id="project-title" className="center" />
						<div id="project-description-wrapper">
							<textarea rows="1" id="project-description"></textarea>
						</div>						
					</div>
    			</div>
    			<div className="row">
    				<div className="col s12 center">
    					<input id="search-input" placeholder="search title" onChange={this.onSearchInputChange} />
    				</div>
    			</div>
    			<div className="row" style={{marginBottom:'10px'}}>
    				<div id="project-object-btns" className="col s12 center">
    					<a className={"waves-effect waves-light btn " + Configs.App.PERSISTENT_DATA_COLOR} onClick={this.onPersistentDataBtnClick}>Persistent Data</a>
    					<a className={"waves-effect waves-light btn " + Configs.App.ENUM_COLOR} onClick={this.onEnumBtnClick}>Enum</a>
    					<a className={"waves-effect waves-light btn " + Configs.App.EVENT_COLOR} onClick={this.onEventBtnClick}>Event</a>
    					<a className={"waves-effect waves-light btn " + Configs.App.FLOW_COLOR} onClick={this.onFlowBtnClick}>Flow</a>
                        <a id="project-object-add-btn" className={"btn-floating waves-effect waves-light " + Configs.App.ADD_BUTTON_COLOR} href="#add-project-object-modal">
                            <i className="mdi-content-add"></i>
                        </a>
    				</div>
    			</div>

                <div id="add-project-object-modal" className="modal z-depth-2">
                    <div className="modal-content">
                        <h4>Select a data type:</h4>
                        <div className = "modal-btn-row center">
                            <a className={"waves-effect waves-light btn " + Configs.App.PERSISTENT_DATA_COLOR}
                               onClick={this.onAddPersistentDataBtnClick}>Persistent Data</a>
                            <a className={"waves-effect waves-light btn " + Configs.App.ENUM_COLOR}>Enum</a>
                            <a className={"waves-effect waves-light btn " + Configs.App.EVENT_COLOR}>Event</a>
                            <a className={"waves-effect waves-light btn " + Configs.App.FLOW_COLOR}>Flow</a>
                        </div>
                    </div>
                </div>

    			{content}
            </div>
        );
    }
});