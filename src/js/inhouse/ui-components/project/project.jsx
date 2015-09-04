var UserLoginFailRedirectHome = require('../common/user-login-fail-redirect-home.jsx');
var EventType = require('../../constants/event-type.js');
var userStore = require('../../stores/user-store.js');
var googleDriveService = require('../../services/google-drive-service.js');
var Card = require('./card.jsx');
var GDriveCons = require('../../constants/google-drive-constants.js');
var DefaultValueCons = require('../../constants/default-value-constants.js');
var Configs = require('../../app-config.js');
var XMLModal = require('./xml-modal.jsx');

module.exports = React.createClass({
	mixins: [Navigation, UserLoginFailRedirectHome, State],

	projectsReceived : false,

	model : {
		buttons : {
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

		$('#project-version-btn').leanModal({
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
		gapi.drive.realtime.load(this.getParams().projectFileId, this.onProjectFileLoaded, this.onProjectModelInitialize);

		this.getProjectObjects();
	},

	onProjectFileLoaded : function(doc)
	{
		var _this = this;
		var gModel = doc.getModel();

		gModel.beginCompoundOperation();
		if (!gModel.getRoot().has(GDriveCons.Project.KEY_TITLE)) { // if initializing went wrong, reset to default values
			gModel.getRoot().set(GDriveCons.Project.KEY_TITLE, gModel.createString(DefaultValueCons.NewFileValues.PROJECT_TITLE));
		}
		if (!gModel.getRoot().has(GDriveCons.Project.KEY_DESCRIPTION)) {
			gModel.getRoot().set(GDriveCons.Project.KEY_DESCRIPTION, gModel.createString(DefaultValueCons.NewFileValues.PROJECT_DESCRIPTION));
		}
		if (!gModel.getRoot().has(GDriveCons.ProjectMetadata.KEY_VERSION)) {
			gModel.getRoot().set(GDriveCons.ProjectMetadata.KEY_VERSION, [{
				versionNum: DefaultValueCons.ProjectDefaults.VERSION_NUMBER,
				versionDescription: DefaultValueCons.ProjectDefaults.VERSION_DESCRIPTION,
				active: true
			}]);
		}
		gModel.endCompoundOperation();

		this.model.gModel = gModel;

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

		var versionList = gModel.getRoot().get(GDriveCons.ProjectMetadata.KEY_VERSION);
		var versionOptions = '';
		for (var i = 0, len=versionList.length; i<len; ++i) {
			if (versionList[i].active) {
				versionOptions+='<option selected value="'+versionList[i].versionNum+'">'+versionList[i].versionNum+'</option>';
				$('#version-description-input').val(versionList[i].versionDescription);
			} else {
				versionOptions+='<option value="'+versionList[i].versionNum+'">'+versionList[i].versionNum+'</option>';
			}
		}
		var $versionSelect = $('#version-num-select');
		$versionSelect.html(versionOptions).material_select();

	},

	onProjectModelInitialize: function(model) {
		var gRoot = model.getRoot();
		model.beginCompoundOperation();
		gRoot.set(GDriveCons.Project.KEY_TITLE, model.createString(DefaultValueCons.NewFileValues.PROJECT_TITLE));
		gRoot.set(GDriveCons.Project.KEY_DESCRIPTION, model.createString(DefaultValueCons.NewFileValues.PROJECT_DESCRIPTION));
		gRoot.set(GDriveCons.ProjectMetadata.KEY_VERSION, [{
			versionNum: DefaultValueCons.ProjectDefaults.VERSION_NUMBER,
			versionDescription: DefaultValueCons.ProjectDefaults.VERSION_DESCRIPTION,
			active: true
		}]);
		model.endCompoundOperation();
	},

	saveTitleToFileItself : function()
	{
		var newTitle = $('#project-title').val();
		googleDriveService.saveProjectTitle(this.getParams().projectFileId, newTitle, this.getParams().projectFolderFileId);
	},

	getProjectObjects : function()
	{
		this.model.projectObjects = [];
		this.forceUpdate();

		var objectsToGet = {
			persistentData: this.model.buttons.persistentData.isSearchOn,
			enum: this.model.buttons.enum.isSearchOn,
			snippet: this.model.buttons.snippet.isSearchOn,
			event: this.model.buttons.event.isSearchOn,
			flow: this.model.buttons.flow.isSearchOn
		};

		var getProjectObjectsCallback = this.onReceiveProjectObjects;

		googleDriveService.getProjectObjects(
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

	onFilterBtnClick : function(e)
	{
		var btn = e.currentTarget;
		var $btn = $(btn);
		var model = btn.dataset.objectType;

		if ($btn.hasClass(model.color))
		{
			$btn.switchClass(model.color, 'grey');
			model.isSearchOn = false;
		}
		else if ($btn.hasClass('grey'))
		{
			$btn.switchClass('grey', model.color);
			model.isSearchOn = true;
		}

		this.getProjectObjects();
	},

	onAddObjectBtnClick: function(e) {
		var btn = e.currentTarget;

		// for now, there is nothing for flows
		if (btn.dataset.objectType === GDriveCons.ObjectType.FLOW) {
			return;
		}
		this.createObjectAndTransitionTo(btn.dataset.objectType);
	},

	createObjectAndTransitionTo: function(objectType) {
		clearTimeout(this.createObjectTimeout);
		var _this = this;
		this.createObjectTimeout = setTimeout(function() {
			var routerParams = _this.getParams();
			googleDriveService.createNewF1Object(objectType, routerParams.projectFolderFileId, function(file) {
				var params = {
					projectFolderFileId: routerParams.projectFolderFileId,
					projectFileId: routerParams.projectFileId,
					fileId: file.id
				};

				_this.transitionTo('editor', params, {fileType: objectType}); 
			});
		}, 300);
	},

	onToProjectsBtnClick : function()
	{
		this.transitionTo('projects');
	},

	onAddNewVersionBtnClick: function(e) {
		var versionToAdd=$('#add-version-num-input').val();
		var $versionSelect = $('#version-num-select');
		var versionFound = false;
		$versionSelect.find('option').each(function(index, element){
		   if (element.value === versionToAdd) {
		      $versionSelect.val(versionToAdd);
		      versionFound = true;
		      return false;
		   }
		});

		if (!versionFound) {
			var versionList = this.model.gModel.getRoot().get(GDriveCons.ProjectMetadata.KEY_VERSION).slice(0);
			for (var i=0, len=versionList.length; i<len; ++i) {
				versionList[i].active = false;
			}
			versionList.push({
				versionNum: versionToAdd,
				versionDescription: '',
				active: true
			});

			$versionSelect.append('<option value="'+versionToAdd+'">'+versionToAdd+'</option>')
				.val(versionToAdd)
				.material_select();
			$('#version-description-input').val('');

			this.model.gModel.getRoot().set(GDriveCons.ProjectMetadata.KEY_VERSION, versionList);
		}
		return;
	},

	render: function()
	{
		var projectFileId = this.getParams().projectFileId;
		var projectFolderFileId = this.getParams().projectFolderFileId;
		var content;
		if (!this.projectsReceived)
		{
			content = 
				<div id='cards-wrapper' className='preloader'>
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
					<XMLModal projectObjects = {projectObjects} projectFile = {projectFile} />
				</div>;
		}

		return (
			<div className='container'>
				<i id='to-projects-btn' className='medium mdi-navigation-arrow-back' onClick={this.onToProjectsBtnClick}></i>
				<div className='row'>
					<div id='project-title-description-wrapper' className='col s12'>
						<input type='text' id='project-title' className='center' />
						<div id='project-description-wrapper'>
							<textarea rows='1' id='project-description'  className='col s8 offset-s2' />
							<a id='project-version-btn' href='#project-version-modal'
								className={'col s2 waves-effect waves-light btn ' + Configs.App.ADD_BUTTON_COLOR}>
								Version</a>
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
						<a className={'waves-effect waves-light btn ' + Configs.App.PERSISTENT_DATA_COLOR} 
							onClick={this.onFilterBtnClick} data-object-type={this.model.buttons.persistentData}>Persistent Data</a>
						<a className={'waves-effect waves-light btn ' + Configs.App.ENUM_COLOR}
							onClick={this.onFilterBtnClick} data-object-type={this.model.buttons.enum}>Enum</a>
						<a className={'waves-effect waves-light btn ' + Configs.App.SNIPPET_COLOR}
							onClick={this.onFilterBtnClick}  data-object-type={this.model.buttons.snippet}>Snippet</a>
						<a className={'waves-effect waves-light btn ' + Configs.App.EVENT_COLOR}
							onClick={this.onFilterBtnClick} data-object-type={this.model.buttons.event}>Event</a>
						<a className={'waves-effect waves-light btn ' + Configs.App.FLOW_COLOR}
							onClick={this.onFilterBtnClick} data-object-type={this.model.buttons.flow}>Flow</a>
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
								onClick={this.onAddObjectBtnClick} data-object-type={GDriveCons.ObjectType.PERSISTENT_DATA}>Persistent Data</a>
							<a className={'modal-close waves-effect waves-light btn ' + Configs.App.ENUM_COLOR}
								onClick={this.onAddObjectBtnClick} data-object-type={GDriveCons.ObjectType.ENUM}>Enum</a>
							<a className={'modal-close waves-effect waves-light btn ' + Configs.App.SNIPPET_COLOR}
								onClick={this.onAddObjectBtnClick} data-object-type={GDriveCons.ObjectType.SNIPPET}>Snippet</a>
							<a className={'modal-close waves-effect waves-light btn ' + Configs.App.EVENT_COLOR}
								onClick={this.onAddObjectBtnClick} data-object-type={GDriveCons.ObjectType.EVENT}>Event</a>
							<a className={'modal-close waves-effect waves-light btn ' + Configs.App.FLOW_COLOR}
								onClick={this.onAddObjectBtnClick} data-object-type={GDriveCons.ObjectType.FLOW}>Flow</a>
						</div>
					</div>
				</div>

				<div id='project-version-modal' className='modal z-depth-2'>
					<div className='modal-content'>
						<div className='row'>
							<div className='col s3 input-field'>
								<select id='version-num-select'/>
								<label for='version-num-select'>select version</label>
							</div>
							<div className='col s3 offset-s3 input-field'>
								<input id='add-version-num-input' type='text'/>
								<label for='add-version-num-input'>change to version</label>
							</div>
							<a id='change-version-num-btn'className={'col s3 btn waves-effect waves-light ' + Configs.App.ADD_BUTTON_COLOR} onClick={this.onAddNewVersionBtnClick}>Change Version</a>
						</div>
						<div className='row'>
							<textarea type='description' id='version-description-input' className='materialize-textarea' />
	          			<label for="version-description-input">version description</label>
          			</div>
					</div>
				</div>

				{content}
			</div>
		);
	}
});