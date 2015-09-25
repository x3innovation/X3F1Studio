var GDriveConstants = require('../../constants/google-drive-constants.js');
var ObjectTypeCons = GDriveConstants.ObjectType;
var Cons = GDriveConstants.Project;

var Configs = require('../../app-config.js');
var GDriveUtils = require('../../utils/google-drive-utils.js');

module.exports = React.createClass({
	mixins: [Navigation],

	contentFileLoaded : false,

	model : null,

	/* ******************************************
				LIFE CYCLE FUNCTIONS
	****************************************** */
	componentWillMount: function()
	{
		this.isUnmounted = false;
	},

	componentDidMount : function()
	{
		gapi.drive.realtime.load(this.props.fileId, this.onFileLoaded, null);
		this.titleChangeTimeout = null;

		this.model = this.props.model;
		this.model.isCardFront = true;
		this.model.buttons= {
			PD: {
				color : Configs.App.PERSISTENT_DATA_COLOR,
				isSearchOn : true
			},
			EN: {
				color : Configs.App.ENUM_COLOR,
				isSearchOn : true
			},
			SN: {
				color : Configs.App.SNIPPET_COLOR,
				isSearchOn : true
			},
			EV: {
				color : Configs.App.EVENT_COLOR,
				isSearchOn : true
			},
			FL: {
				color : Configs.App.FLOW_COLOR,
				isSearchOn : true
			}
		}
	},

	componentDidUpdate : function()
	{
		var titleInput = document.getElementById(this.props.fileId + '-title');
		gapi.drive.realtime.databinding.bindString(this.model.title, titleInput);

		var descriptionInput = document.getElementById(this.props.fileId + '-description');
		gapi.drive.realtime.databinding.bindString(this.model.description, descriptionInput);
		// resize description text area
		$(descriptionInput).css('height', 'auto').height(descriptionInput.scrollHeight);

		// highlight card animation
		$('#' + this.props.fileId + '-wrapper').mouseenter(this.onProjectMouseEnter).mouseleave(this.onProjectMouseLeave);

		// apply card flip
		$('#' + this.props.fileId + '-card').flip({
			axis : 'y',
			trigger : 'manual'
		});

		// apply slim scroll to description section of card's front face
		$('#' + this.props.fileId + '-description-wrapper').slimScroll({
			height: '200px'
		});

		var cardBackSide = document.getElementById(this.props.fileId+'-back-side');
		if (cardBackSide !== null) {
			this.setBackSideContent();
			$(cardBackSide).css('height', 'auto').height(cardBackSide.scrollHeight);
		}
		$('#' + this.props.fileId + '-back-side-wrapper').slimScroll({
			height : '185px'
		});

		// apply single click to flip
		var DELAY = 300, clicks = 0, timer = null;
		var onCardSingleClick = this.onCardSingleClick;
		var onCardDoubleClick = this.onCardDoubleClick;
		$('#' + this.props.fileId + '-wrapper').on('click', function(e){
			if ($(e.target).hasClass('card-back-search') || $(e.target).hasClass('project-object-btn')
				|| $(e.target).hasClass('project-object-filter-wrapper')) { 
				return; 
			}

			clicks++;
			if(clicks === 1)
			{
				timer = setTimeout(function() {
					onCardSingleClick(e);
					clicks = 0;
				}, DELAY);
			}
			else
			{
				clearTimeout(timer);
				onCardDoubleClick(e);
				clicks = 0;
			}
		})
		.on('dblclick', function(e){
			e.preventDefault();
		});

		// disable select
		$('#' + this.props.fileId + '-card').disableSelection();
	},

	componentWillUnmount: function()
	{
		this.isUnmounted = true;
		if (this.gDoc != null)
		{
			this.gDoc.close();
		}
	},

	/* ******************************************
			NON LIFE CYCLE FUNCTIONS
	****************************************** */
	onProjectMouseEnter : function()
	{
		$('#' + this.props.fileId + '-title').css('border-bottom-color', '#f24235');
		$('.' + this.props.fileId + '-card-face').css('border-bottom-color', '#f24235');
	},

	onProjectMouseLeave : function()
	{
		$('#' + this.props.fileId + '-title').css('border-bottom-color', '#9e9e9e');
		$('.' + this.props.fileId + '-card-face').css('border-bottom-color', 'transparent');
	},

	onFileLoaded : function(doc)
	{
		if (!this.isUnmounted)
		{
			this.gDoc = doc;
			var gModel = doc.getModel().getRoot();

			this.model.title = gModel.get(Cons.KEY_TITLE);
			this.model.description = gModel.get(Cons.KEY_DESCRIPTION);

			this.contentFileLoaded = true;
			$('#' + this.props.fileId).addClass('fadeIn animated');
			this.forceUpdate();
		}
	},

	setBackSideContent: function() {
		var objectsToGet = {
			persistentData : true,
			enum : true,
			event : true,
			snippet : true,
			flow : true
		};

		var $cardBack = $('#'+this.props.fileId+'-back-side');
		var content = '';

		var callback = function(projectObjects) {
			var projectObject;
			var labelType;
			var objectDict = {PD: [], EN: [], SN: [], EV: [], FL: []}; //group the data objects by type
			for (i = 0, len = projectObjects.length; i<len; i++) {
				projectObject = projectObjects[i];
				switch (projectObject.description) {
					case ObjectTypeCons.PERSISTENT_DATA:
						objectDict.PD.push(projectObject);
						break;
					case ObjectTypeCons.ENUM:
						objectDict.EN.push(projectObject);
						break;
					case ObjectTypeCons.SNIPPET:
						objectDict.SN.push(projectObject);
						break;
					case ObjectTypeCons.EVENT:
						objectDict.EV.push(projectObject);
						break;
					case ObjectTypeCons.FLOW:
						objectDict.FL.push(projectObject);
						break;
					default: break;
				}
			}
			for (var objectType in objectDict) {
				for (i = 0, len = objectDict[objectType].length; i<len; i++) {
					projectObject = objectDict[objectType][i];
					contentRow = 
						'<div class="project-object-row"><span class="left project-object-name">'+projectObject.title+'</span>'+ 
						'<span class="right project-object-tag card-tag-'+objectType+'">'+objectType+'</span></div>';
					content = content + contentRow;
				}
			}
			$cardBack.html(content);
		};

		GDriveUtils.getProjectObjects(this.props.projectFolderFileId, '', objectsToGet, callback);
	},

	onProjectObjectBtnClick: function(e) {
		var $clicked = $(e.target);
		var objectType = $clicked.text();
		this.model.buttons[objectType].isSearchOn = !this.model.buttons[objectType].isSearchOn;
		$clicked.toggleClass(this.model.buttons[objectType].color + ' grey');
		this.searchProjectObjects();
	},

	getContentBeforeFileLoaded : function()
	{
		var content =
			<div className="list-group card-preloader-wrapper">
				<img className="card-preloader" src="img/loading-spin.svg" />
			</div>;

		return content;
	},

	getContentAfterFileLoaded : function()
	{
		var content;

		var fileId = this.props.fileId;
		var cardFaceClassName = 'z-depth-1 ' + fileId + '-card-face';

		content =
			<div id={fileId + '-card'}>
				<div id={fileId + '-card-front'} className={'front card-face ' + cardFaceClassName}>
					<input type="text" className={this.props.fileId + '-header card-header noselect'} id={fileId + '-title'} readOnly />
					<div id={fileId + '-description-wrapper'} className="card-description-wrapper">
						<textarea id={fileId + '-description'} className="card-description noselect" readOnly />
					</div>
				</div>
				<div id = {fileId + '-card-back'} className={'back card-face ' + cardFaceClassName}>
					<div className = 'project-object-filter-wrapper'>
						<input type="text" className="card-back-search noselect" id={fileId + '-back-search'}
							onChange={this.onSearchBarChange} placeholder='search project objects' />
						<div id = {fileId + '-card-back-btns'} className ='card-back-btns-wrapper row'>
							<a className={"waves-effect waves-light btn project-object-btn col s2 offset-s1 "
							 + Configs.App.PERSISTENT_DATA_COLOR} onClick = {this.onProjectObjectBtnClick}>PD</a>
							<a className={"waves-effect waves-light btn project-object-btn col s2 "
							 + Configs.App.ENUM_COLOR} onClick = {this.onProjectObjectBtnClick}>EN</a>
							<a className={"waves-effect waves-light btn project-object-btn col s2 "
							 + Configs.App.SNIPPET_COLOR} onClick = {this.onProjectObjectBtnClick}>SN</a>
							<a className={"waves-effect waves-light btn project-object-btn col s2 "
							 + Configs.App.EVENT_COLOR} onClick = {this.onProjectObjectBtnClick}>EV</a>
							<a className={"waves-effect waves-light btn project-object-btn col s2 "
							 + Configs.App.FLOW_COLOR} onClick = {this.onProjectObjectBtnClick}>FL</a>
						</div>
					</div>
					<div id={fileId + '-back-side-wrapper'} className="card-back-side-wrapper">
						<div id={this.props.fileId+'-back-side'} className="card-description card-project-objects" />
					</div>
				</div>
			</div>;
		return content;
	},

	onSearchBarChange: function (e) {
		clearTimeout(this.searchBackContentTimeout);
		this.searchBackContentTimeout = setTimeout(this.searchProjectObjects, 200)
	},

	searchProjectObjects: function() {
		var searchString = $('#'+this.props.fileId + '-back-search').val().toLowerCase();
		var buttons = this.model.buttons;
		$('#'+this.props.fileId+'-back-side').find('.project-object-row').each(function(index, element) {
			var $this = $(this);
			var objectName = $this.find('.project-object-name').text().toLowerCase();
			var objectType = $this.find('.project-object-tag').text();
			$this.addClass('hide');
			if (objectName.indexOf(searchString) >= 0  && buttons[objectType].isSearchOn) {
				$this.removeClass('hide');
			}
		});
	},

	onCardSingleClick : function(e)
	{
		var cardFront = $('#' + this.props.fileId + '-card-front');
		if (this.model.isCardFront)
		{
			cardFront.stop(true, true).fadeOut(300, function(){
				cardFront.css('visibility', 'hidden');
			});
			$('#' + this.props.fileId + '-description-wrapper').css('position', 'initial !important');
		}
		else
		{
			cardFront.css('visibility', 'visible');
			cardFront.stop(true, true).fadeIn(300);
			$('#' + this.props.fileId + '-description-wrapper').css('position', 'relative !important');
		}

		$('#' + this.props.fileId + '-card').flip(this.model.isCardFront);
		this.model.isCardFront = !this.model.isCardFront;
	},

	onCardDoubleClick : function(e)
	{
		var params = {
			projectFolderFileId : this.props.projectFolderFileId,
			projectFileId : this.props.fileId
		};
		this.transitionTo('project', params);
	},

	render: function()
	{
		var content;
		if (!this.contentFileLoaded)
		{
			content = this.getContentBeforeFileLoaded();
		}
		else
		{
			content = this.getContentAfterFileLoaded();
		}

		return (
			<div id={this.props.fileId + '-wrapper'} className="card-wrapper">
				<div>
					{content}
				</div>
			</div>
		);
	}
});
