var googleDriveService = require('../../services/google-drive-service.js');
var GDriveCons = require('../../constants/google-drive-constants.js');
var DefaultValueCons = require('../../constants/default-value-constants.js');

module.exports = React.createClass({
	mixins: [Navigation],

	contentFileLoaded : false,

	model : null,

	/* ******************************************
				LIFE CYCLE FUNCTIONS
	****************************************** */
	componentDidMount : function()
	{
		gapi.drive.realtime.load(this.props.fileId, this.onFileLoaded, null);

		this.model = this.props.model;
		this.model.isCardFront = true;
		if (this.props.objectType === GDriveCons.ObjectType.PERSISTENT_DATA)
		{
			this.model.objectType = 'PD';
			this.model.color = '#3f51b5';
		}
		else if (this.props.objectType === GDriveCons.ObjectType.EVENT)
		{
			this.model.objectType = 'EV';
			this.model.color = '#ff9800';
		}
		else if (this.props.objectType === GDriveCons.ObjectType.SNIPPET)
		{
			this.model.objectType = 'SN';
			this.model.color = '#7b1fa2';
		}
		else if (this.props.objectType === GDriveCons.ObjectType.ENUM)
		{
			this.model.objectType = 'EN';
			this.model.color = '#f44336';
		}
		else if (this.props.objectType === GDriveCons.ObjectType.FLOW)
		{
			this.model.objectType = 'FL';
			this.model.color = '#4caf50';
		}
	},

	componentDidUpdate : function()
	{
		$('#' + this.props.fileId + '-title').val(this.model.title.toString());

		var descriptionInput = document.getElementById(this.props.fileId + '-description');
		if (descriptionInput !== null) { //if the description text area exists
			$(descriptionInput).val(this.model.description);
			// resize description text area
			$(descriptionInput).css('height', 'auto').height(descriptionInput.scrollHeight);
		}
		// highlight card animation
		$('#' + this.props.fileId + '-wrapper').mouseenter(this.onProjectMouseEnter).mouseleave(this.onProjectMouseLeave);

		// apply card flip
		$('#' + this.props.fileId + '-card').flip({
			axis : 'y',
			trigger : 'manual'
		});

		// apply slim scroll to description section of card's front face
		$('#' + this.props.fileId + '-description-wrapper').slimScroll({
			height : '220px'
		});

		var backSideHeader = this.getBackSideHeader();
		$('#'+ this.props.fileId + '-back-header').val(backSideHeader);

		var cardBackSide = document.getElementById(this.props.fileId+'-back-side');
		if (cardBackSide !== null) {
			var backSideContent = this.getBackSideContent();
			$(cardBackSide).val(backSideContent);
			$(cardBackSide).css('height', 'auto').height(cardBackSide.scrollHeight);
		}
		$('#' + this.props.fileId + '-back-side-wrapper').slimScroll({
			height : '220px'
		});

		// need to get rid of 25% width once page is rendered
		var outerWidth = $('.row .col.s3').outerWidth() - 1;
		$('.row .col.s3').css('width', outerWidth);

		// apply single click to flip
		var DELAY = 400, clicks = 0, timer = null;
		var onCardSingleClick = this.onCardSingleClick;
		var onCardDoubleClick = this.onCardDoubleClick;
		$('#' + this.props.fileId + '-wrapper').on('click', function(e){
			clicks++;
			if(clicks === 1)
			{
				timer = setTimeout(function(){
					onCardSingleClick();
					clicks = 0;
				}, DELAY);
			}
			else
			{
				clearTimeout(timer);
				onCardDoubleClick();
				clicks = 0;
			}
		})
		.on('dblclick', function(e){
			e.preventDefault();
		});

		// disable select
		$('#' + this.props.fileId + '-card').disableSelection();

		// display object type tag on the front of the card
		$('#' + this.props.fileId + '-object-type').addClass('card-tag card-tag-' + this.model.objectType).text(this.model.objectType);
	},

	/* ******************************************
			NON LIFE CYCLE FUNCTIONS
	****************************************** */
	onProjectMouseEnter : function()
	{
		$('#' + this.props.fileId + '-title').stop(true, true).animate({
			borderBottomColor: this.model.color
		}, 100);

		$('#' + this.props.fileId + '-back-header').stop(true, true).animate({
			borderBottomColor: this.model.color
		}, 100);

		$('.' + this.props.fileId + '-card-face').stop(true, true).animate({
			borderBottomColor: this.model.color
		}, 500);
	},

	onProjectMouseLeave : function()
	{
		$('#' + this.props.fileId + '-title').stop(true, true).animate({
			borderBottomColor: '#9e9e9e'
		}, 100);

		$('#' + this.props.fileId + '-back-header').stop(true, true).animate({
			borderBottomColor: '#9e9e9e'
		}, 100);

		$('.' + this.props.fileId + '-card-face').stop(true, true).animate({
			borderBottomColor: 'white'
		}, 500);
	},

	onFileLoaded : function(doc)
	{
		var key;
		if (this.props.objectType === GDriveCons.ObjectType.PERSISTENT_DATA)
		{
			key = GDriveCons.CustomObjectKey.PERSISTENT_DATA;
		}
		else if (this.props.objectType === GDriveCons.ObjectType.ENUM)
		{
			key = GDriveCons.CustomObjectKey.ENUM;
		}
		else if (this.props.objectType === GDriveCons.ObjectType.SNIPPET)
		{
			key = GDriveCons.CustomObjectKey.SNIPPET;
		}
		else if (this.props.objectType === GDriveCons.ObjectType.EVENT)
		{
			key = GDriveCons.CustomObjectKey.EVENT;
		}
		else if (this.props.objectType === GDriveCons.ObjectType.FLOW)
		{
			key = GDriveCons.CustomObjectKey.FLOW;
		}

		var gModel = doc.getModel().getRoot().get(key);
		var fields;
		if (this.props.objectType === GDriveCons.ObjectType.PERSISTENT_DATA) {
			this.model.fieldNames = [];
			if (gModel) {
				this.model.title = gModel.title.toString();
				this.model.description = gModel.description.toString();
				fields = gModel.fields;
				for (i = 0, len = fields.length; i<len; i++) {
					this.model.fieldNames.push(fields.get(i).get('name').toString());
				}
			} else { //gModel was not properly initialized, but still need to load
				this.model.title = DefaultValueCons.NewFileValues.PERSISTENT_DATA_TITLE;
				this.model.description = DefaultValueCons.NewFileValues.PERSISTENT_DATA_DESCRIPTION;
			}
		}
		else if (this.props.objectType === GDriveCons.ObjectType.ENUM) {
			this.model.enumNames = [];
			if (gModel) {
				this.model.title = gModel.title.toString();
				this.model.description = gModel.description.toString();
				fields = gModel.fields;
				for (i = 0, len = fields.length; i<len; i++) {
					this.model.enumNames.push(fields.get(i).name);
				}
			} else { //gModel was not properly initialized, but still need to load
				this.model.title = DefaultValueCons.NewFileValues.ENUM_TITLE;
				this.model.description = DefaultValueCons.NewFileValues.ENUM_DESCRIPTION;
			}
		}
		else if (this.props.objectType === GDriveCons.ObjectType.SNIPPET) {
			this.model.fieldNames = [];
			if (gModel) {
				this.model.title = gModel.title.toString();
				this.model.description = gModel.description.toString();
				fields = gModel.fields;
				for (i = 0, len = fields.length; i<len; i++) {
					this.model.fieldNames.push(fields.get(i).get('name').toString());
				}
			} else { //gModel was not properly initialized, but still need to load
				this.model.title = DefaultValueCons.NewFileValues.SNIPPET_TITLE;
				this.model.description = DefaultValueCons.NewFileValues.SNIPPET_DESCRIPTION;
			}
		}
		else if (this.props.objectType === GDriveCons.ObjectType.EVENT) {
			this.model.fieldNames = [];
			if (gModel) {
				this.model.title = gModel.title.toString();
				this.model.description = gModel.description.toString();
				fields = gModel.fields;
				for (i = 0, len = fields.length; i<len; i++) {
					this.model.fieldNames.push(fields.get(i).get('name').toString());
				}
			} else { //gModel was not properly initialized, but still need to load
				this.model.title = DefaultValueCons.NewFileValues.EVENT_TITLE;
				this.model.description = DefaultValueCons.NewFileValues.EVENT_DESCRIPTION;
			}
		}
		else if (this.props.objectType === GDriveCons.ObjectType.FLOW) {
			/* ***TODO*** */
		}

		this.contentFileLoaded = true;
		$('#' + this.props.fileId).addClass('fadeIn animated');
		this.forceUpdate();
	},

	getBackSideHeader: function() {
		var contentHeader = '';
		if (this.props.objectType === GDriveCons.ObjectType.PERSISTENT_DATA) {
			contentHeader = 'Persistent Data Fields';
		} else if (this.props.objectType === GDriveCons.ObjectType.EVENT) {
			contentHeader = 'Event Fields';
		} else if (this.props.objectType === GDriveCons.ObjectType.SNIPPET) {
			contentHeader = 'Snippet Fields';
		} else if (this.props.objectType === GDriveCons.ObjectType.ENUM) {
			contentHeader = 'Enums';
		} else if (this.props.objectType === GDriveCons.ObjectType.FLOW) {
			/* FLOW HEADER CONTENT */
		}
		return contentHeader;
	},
	
	getBackSideContent: function() {
		var content = '';
		if (this.props.objectType === GDriveCons.ObjectType.PERSISTENT_DATA) {
			for (i = 0, len = this.model.fieldNames.length; i<len; i++) {
				content = content + this.model.fieldNames[i] + '\n';
			}
		} else if (this.props.objectType === GDriveCons.ObjectType.EVENT) {
			for (i = 0, len = this.model.fieldNames.length; i<len; i++) {
				content = content + this.model.fieldNames[i] + '\n';
			}
		} else if (this.props.objectType === GDriveCons.ObjectType.SNIPPET) {
			for (i = 0, len = this.model.fieldNames.length; i<len; i++) {
				content = content + this.model.fieldNames[i] + '\n';
			}
		} else if (this.props.objectType === GDriveCons.ObjectType.ENUM) {
			for (i = 0, len = this.model.enumNames.length; i<len; i++) {
				content = content + this.model.enumNames[i] + '\n';
			}
		} else if (this.props.objectType === GDriveCons.ObjectType.FLOW) {
			/* FLOW OBJECT CONTENT */
		}
		return content;
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
		
		var cardFaceClassName = 'z-depth-1 ' + this.props.fileId + '-card-face';

		content =
			<div id={this.props.fileId + '-card'}>
				<div id={this.props.fileId + '-card-front'} className={'front card-face ' + cardFaceClassName}>
					<input type="text" className="card-header noselect" id={this.props.fileId + '-title'} readOnly />
					<div id={this.props.fileId + '-description-wrapper'} className="card-description-wrapper">
						<textarea id={this.props.fileId + '-description'} className="card-description noselect" readOnly></textarea>
					</div>
					<div id={this.props.fileId + '-object-type'}></div>
				</div>
				<div id = {this.props.fileId+'-card-back'} className={'back card-face ' + cardFaceClassName}>
					<input type="text" className="card-back-header noselect" id={this.props.fileId + '-back-header'} readOnly />
					<div id={this.props.fileId + '-back-side-wrapper'} className="card-back-side-wrapper">
						<textarea id={this.props.fileId+'-back-side'} className="card-description noselect" readOnly></textarea>
					</div>
				</div>
			</div>;
		return content;
	},

	onCardSingleClick : function()
	{
		var cardFront = $('#' + this.props.fileId + '-card-front');
		var cardBack = $('#' + this.props.fileId+'-card-back');
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

	onCardDoubleClick : function()
	{
		var params = {
			projectFileId: this.props.projectFileId,
			projectFolderFileId: this.props.projectFolderFileId,
			fileId: this.props.fileId
		};
		if (this.props.objectType === GDriveCons.ObjectType.PERSISTENT_DATA) {
			this.transitionTo('persistentDataEntry', params);
		} else if (this.props.objectType === GDriveCons.ObjectType.EVENT) {
			this.transitionTo('eventEntry', params);
		} else if (this.props.objectType === GDriveCons.ObjectType.SNIPPET) {
			this.transitionTo('snippetEntry', params);
		} else if (this.props.objectType === GDriveCons.ObjectType.ENUM) {
			this.transitionTo('enumEntry', params);
		} else if (this.props.objectType === GDriveCons.ObjectType.FLOW) {
			//this.transitionTo('flowEntry', params);
		}
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
