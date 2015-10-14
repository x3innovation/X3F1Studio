var UserLoginFailRedirectHome = require('../common/user-login-fail-redirect-home.jsx');
var EventType = require('../../constants/event-type.js');
var userStore = require('../../stores/user-store.js');
var googleDriveUtils = require('../../utils/google-drive-utils.js');
var Card = require('./card.jsx');
var GDriveCons = require('../../constants/google-drive-constants.js');
var DefaultValueCons = require('../../constants/default-value-constants.js');
var Configs = require('../../app-config.js');
var XMLModal = require('./xml-modal.jsx');

module.exports = React.createClass({
	mixins: [Navigation, UserLoginFailRedirectHome, State],

	/* ******************************************
				LIFE CYCLE FUNCTIONS
	****************************************** */
	componentWillMount : function()
	{
		this.projectsReceived = false;

		// initialize buttons
		this.model = {
			buttons : {
				all : {
					color : Configs.App.ALL_COLOR,
					isSearchOn : true
				},
				persistentData : {
					color : Configs.App.PERSISTENT_DATA_COLOR,
					isSearchOn : true
				},
				enum : {
					color : Configs.App.ENUM_COLOR,
					isSearchOn : true
				},
				snippet : {
					color : Configs.App.SNIPPET_COLOR,
					isSearchOn : true
				},
				event : {
					color : Configs.App.EVENT_COLOR,
					isSearchOn : true
				},
				flow : {
					color : Configs.App.FLOW_COLOR,
					isSearchOn : true
				}
			}
		};

		// load project objects on user logged in
		Bullet.on(EventType.App.USER_LOGGED_IN, 'project.jsx>>user-logged-in', this.initialize);
	},

	componentDidMount : function()
	{
		Bullet.trigger(EventType.App.PAGE_CHANGE, {title: 'PROJECT DETAIL'});

		// if user is already logged in, still need to initialize
		if (userStore.isLoggedIn)
		{
			this.initialize();
		}

		// hide placeholder on focus, then display on blur
		$('#search-input').focus(function(){$(this).attr('placeholder', ''); })
			.blur(function(){$(this).attr('placeholder', 'search title'); });

		// title and description blind animation wire up
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
		$('#project-title').focus(blindDownDescription).focusout(blindUpDescription);
		$('#project-description').focusout(blindUpDescription);

		// initialize add button modal
		$('#project-object-add-btn').leanModal({
			modalInitialTopPosition: '20%',
			modalEndTopPosition: '30%',
			ready: function() {
				$('#lean-overlay').css('width', '100%').css('height', '100%').css('z-index', '10');
			}
		});
	},

	componentWillUnmount : function()
	{
		this.gDoc.close();
	},

	/* ******************************************
			NON LIFE CYCLE FUNCTIONS
	****************************************** */
	initialize : function()
	{
		// load google drive project metadata file
		googleDriveUtils.loadDriveFileDoc(this.getParams().projectFileId, GDriveCons.ObjectType.PROJECT, this.onProjectFileLoaded);

		this.getProjectObjects();
	},

	onProjectFileLoaded : function(doc)
	{
		var _this = this;
		this.gDoc = doc;
		var gModel = doc.getModel();

		gModel.beginCompoundOperation();
		if (!gModel.getRoot().has(GDriveCons.Project.KEY_TITLE)) { // if initializing went wrong, reset to default values
			gModel.getRoot().set(GDriveCons.Project.KEY_TITLE, gModel.createString(DefaultValueCons.NewFileValues.PROJECT_TITLE));
		}
		if (!gModel.getRoot().has(GDriveCons.Project.KEY_DESCRIPTION)) {
			gModel.getRoot().set(GDriveCons.Project.KEY_DESCRIPTION, gModel.createString(DefaultValueCons.NewFileValues.PROJECT_DESCRIPTION));
		}
		gModel.endCompoundOperation();

		var titleInput = document.getElementById('project-title');
		var titleModel = gModel.getRoot().get(GDriveCons.Project.KEY_TITLE);
		gapi.drive.realtime.databinding.bindString(titleModel, titleInput);

		var descriptionInput = document.getElementById('project-description');
		var descriptionModel = gModel.getRoot().get(GDriveCons.Project.KEY_DESCRIPTION);
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
			titleChangeTimeout = setTimeout(_this.saveTitleToFileItself, 500);
		};
		titleModel.addEventListener(gapi.drive.realtime.EventType.TEXT_INSERTED, onTitleChange);
		titleModel.addEventListener(gapi.drive.realtime.EventType.TEXT_DELETED, onTitleChange);
		this.saveTitleToFileItself();

		$('#to-projects-btn').css('display', 'initial');
	},

	onProjectModelInitialize: function(model) {
		var gRoot = model.getRoot();
		model.beginCompoundOperation();
		gRoot.set(GDriveCons.Project.KEY_TITLE, model.createString(DefaultValueCons.NewFileValues.PROJECT_TITLE));
		gRoot.set(GDriveCons.Project.KEY_DESCRIPTION, model.createString(DefaultValueCons.NewFileValues.PROJECT_DESCRIPTION));
		model.endCompoundOperation();
	},

	saveTitleToFileItself : function()
	{
		var newTitle = $('#project-title').val();
		googleDriveUtils.saveProjectTitle(this.getParams().projectFileId, newTitle, this.getParams().projectFolderFileId);
	},

	getProjectObjects : function()
	{
		this.model.projectObjects = [];
		this.forceUpdate();

		var objectsToGet;
		if (this.model.buttons.all.isSearchOn)
		{
			objectsToGet = {
				persistentData: true,
				enum: true,
				snippet: true,
				event: true,
				flow: true
			}
		}
		else
		{
			objectsToGet = {
				persistentData: this.model.buttons.persistentData.isSearchOn,
				enum: this.model.buttons.enum.isSearchOn,
				snippet: this.model.buttons.snippet.isSearchOn,
				event: this.model.buttons.event.isSearchOn,
				flow: this.model.buttons.flow.isSearchOn
			};
		}
		
		var getProjectObjectsCallback = this.onReceiveProjectObjects;

		googleDriveUtils.getProjectObjects(
			this.getParams().projectFolderFileId,
			$('#search-input').val(),
			objectsToGet,
			getProjectObjectsCallback);
	},

	onReceiveProjectObjects : function(projectObjects)
	{
		this.model.projectObjects = projectObjects;
		this.projectsReceived = true;
		$('#project-object-add-btn').removeClass('disabled');
		this.forceUpdate();
	},

	onSearchInputChange : function()
	{
		clearTimeout(this.searchTypingTimeout);
		this.searchTypingTimeout = setTimeout(this.getProjectObjects, 500);
	},

	onFilterBtnClick: function(event)
	{
		var _this = this;
		$clickedBtn = $(event.currentTarget);
		if (isTurnedOff($clickedBtn))
		{
			$('.filter-btn').each(function(){
				if (isClickedBtn(this))
				{
					turnOn(this);
				}
				else
				{
					turnOff(this);
				}
			});

			_this.getProjectObjects();
		}

		function isTurnedOff($button)
		{
			if ($button.hasClass('grey'))
			{
				return true;
			}
			else
			{
				return false;
			}
		}

		function isClickedBtn(btnElement)
		{
			return btnElement === event.currentTarget;
		}

		function turnOn(btnElement)
		{
			var $button = $(btnElement);
			var modelName = $button.attr('data-model-name');
			var model = _this.model.buttons[modelName];
			$button.switchClass('grey', model.color);
			model.isSearchOn = true;

			if (modelName === 'all')
			{
				turnSearchOnForAllDataTypes();
			}
		}

		function turnOff(btnElement)
		{
			var $button = $(btnElement);
			var modelName = $button.attr('data-model-name');
			var model = _this.model.buttons[modelName];
			$button.switchClass(model.color, 'grey');
			model.isSearchOn = false;
		}

		function turnSearchOnForAllDataTypes()
		{
			for (var dataType in _this.model.buttons)
			{
				var model = _this.model.buttons[dataType];
				model.isSearchOn = true;
			}
		}
	},

	onAddPersistentDataBtnClick: function() {
		this.createObjectAndTransitionTo(GDriveCons.ObjectType.PERSISTENT_DATA);
	},
	onAddEnumBtnClick: function() {
		this.createObjectAndTransitionTo(GDriveCons.ObjectType.ENUM);
	},
	onAddSnippetBtnClick: function() {
		this.createObjectAndTransitionTo(GDriveCons.ObjectType.SNIPPET);
	},
	onAddEventBtnClick: function() {
		this.createObjectAndTransitionTo(GDriveCons.ObjectType.EVENT);
	},
	onAddFlowBtnClick: function() {
		/*does nothing for now*/
	},

	createObjectAndTransitionTo: function(fileType) {
		clearTimeout(this.createObjectTimeout);
		var _this = this;
		this.createObjectTimeout = setTimeout(function() {
			var routerParams = _this.getParams();
			googleDriveUtils.createNewF1Object(fileType, routerParams.projectFolderFileId, function(file) {
				var params = {
					projectFolderFileId: routerParams.projectFolderFileId,
					projectFileId: routerParams.projectFileId,
					fileId: file.id
				};

				_this.transitionTo('editor', params, {fileType: fileType}); 
			});
		}, 300);
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
			content = <div id='cards-wrapper' className='preloader'>
						<img id='cards-wrapper-preloader' src='img/loading-spin.svg' />
					</div>;
		}
		else
		{
			var projectObjects = this.model.projectObjects;
			var projectFile = {
				title: $('#project-title').val(),
				description: $('#project-description').val()
			};

			var cellStyle = {
				marginBottom : '30px'
			};

			content =
				<div className='row'>
					{
						projectObjects.map(function(projectObject, columnIndex){
							return (
								<div key={columnIndex} className='col s3 f1-project-card' style={cellStyle}>
									<Card
										title={projectObject.title}
										projectFileId={projectFileId}
										projectFolderFileId={projectFolderFileId}
										fileId={projectObject.id}
										objectType={projectObject.description}
										model={{}} />
								</div>
							);
						})
					}
					<div className = 'col s12' />
					<XMLModal projectObjects = {projectObjects} 
						projectFile = {projectFile} 
						projectFileId = {projectFileId}
						projectFolderFileId = {projectFolderFileId} />
				</div>;
		}

		return (
			<div className='container'>
				<i id='to-projects-btn' className='medium mdi-navigation-arrow-back' onClick={this.onToProjectsBtnClick}></i>
				<div className='row'>
					<div id='project-title-description-wrapper' className='col s12'>
						<input type='text' id='project-title' className='center' />
						<div id='project-description-wrapper'>
							<textarea rows='1' id='project-description' />
						</div>
					</div>
				</div>
				<div className='row'>
					<div className='col s12 center'>
						<input id='search-input' placeholder='search title' onChange={this.onSearchInputChange} />
					</div>
				</div>
				<div className='row' style={{marginBottom: '10px'}}>
					<div id='project-object-btns' className='col s12 center'>
						<a className={'waves-effect waves-light btn filter-btn ' + Configs.App.ALL_COLOR} onClick={this.onFilterBtnClick} data-model-name="all">All</a>
						<a className={'waves-effect waves-light btn filter-btn grey'} onClick={this.onFilterBtnClick} data-model-name="persistentData">Persistent Data</a>
						<a className={'waves-effect waves-light btn filter-btn grey'} onClick={this.onFilterBtnClick} data-model-name="enum">Enum</a>
						<a className={'waves-effect waves-light btn filter-btn grey'} onClick={this.onFilterBtnClick} data-model-name="snippet">Snippet</a>
						<a className={'waves-effect waves-light btn filter-btn grey'} onClick={this.onFilterBtnClick} data-model-name="event">Event</a>
						<a className={'waves-effect waves-light btn filter-btn grey'} onClick={this.onFilterBtnClick} data-model-name="flow">Flow</a>
						<a className={'btn-floating disabled waves-effect waves-light ' + Configs.App.ADD_BUTTON_COLOR}
							href='#add-project-object-modal' id='project-object-add-btn'>
							<i className='mdi-content-add' />
						</a>
					</div>
				</div>

				<div id='add-project-object-modal' className='modal z-depth-2'>
					<div className='modal-content'>
						<h4>Select a data type:</h4>
						<div className = 'modal-btn-row center'>
							<a className={'modal-close waves-effect waves-light btn ' + Configs.App.PERSISTENT_DATA_COLOR}
								onClick={this.onAddPersistentDataBtnClick}>Persistent Data</a>
							<a className={'modal-close waves-effect waves-light btn ' + Configs.App.ENUM_COLOR}
								onClick={this.onAddEnumBtnClick}>Enum</a>
							<a className={'modal-close waves-effect waves-light btn ' + Configs.App.SNIPPET_COLOR}
								onClick={this.onAddSnippetBtnClick}>Snippet</a>
							<a className={'modal-close waves-effect waves-light btn ' + Configs.App.EVENT_COLOR}
								onClick={this.onAddEventBtnClick}>Event</a>
							<a className={'modal-close waves-effect waves-light btn ' + Configs.App.FLOW_COLOR}
								onClick={this.onAddFlowBtnClick}>Flow</a>
						</div>
					</div>
				</div>

				{content}
			</div>
		);
	}
});