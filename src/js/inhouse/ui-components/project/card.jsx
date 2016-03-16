var GDriveCons = require('../../constants/google-drive-constants.js');
var DefaultValueCons = require('../../constants/default-value-constants.js');
var googleDriveUtils = require('../../utils/google-drive-utils.js');

module.exports = React.createClass({
	mixins: [Navigation],

	contentFileLoaded : false,

	model : null,

	/* ******************************************
				LIFE CYCLE FUNCTIONS
	****************************************** */
	componentWillMount : function()
	{
		this.isUnmounted = false;
	},

	componentDidMount : function()
	{
		googleDriveUtils.loadDriveFileDoc(this.props.fileId, this.props.objectType, this.onFileLoaded);

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
		else if (this.props.objectType === GDriveCons.ObjectType.APPLICATION_STATE)
		{
			this.model.objectType = 'AS';
			this.model.color = '#880E4F';
		}
	},

	componentDidUpdate : function()
	{
		if (!this.isUnmounted)
		{
			if (this.model.title != null)
			{
				$('#' + this.props.fileId + '-title').val(this.model.title.toString());
			}

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

			// apply single click to flip
			var DELAY = 300, clicks = 0, timer = null;
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
		}
	},

	componentWillUnmount : function()
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
		$('.' + this.props.fileId + '-header').css('border-bottom-color', this.model.color);
		$('.' + this.props.fileId + '-card-face').css('border-bottom-color', this.model.color);
	},

	onProjectMouseLeave : function()
	{
		$('.' + this.props.fileId + '-header').css('border-bottom-color', '#9e9e9e');
		$('.' + this.props.fileId + '-card-face').css('border-bottom-color', 'transparent');
	},

	onFileLoaded : function(doc)
	{
		if (!this.isUnmounted)
		{
			this.gDoc = doc;
			var key;
			switch(this.props.objectType) {
				case GDriveCons.ObjectType.PERSISTENT_DATA:
					key = GDriveCons.CustomObjectKey.PERSISTENT_DATA;
					break;
				case GDriveCons.ObjectType.ENUM:
					key = GDriveCons.CustomObjectKey.ENUM;
					break;
				case GDriveCons.ObjectType.SNIPPET:
					key = GDriveCons.CustomObjectKey.SNIPPET;
					break;
				case GDriveCons.ObjectType.EVENT:
					key = GDriveCons.CustomObjectKey.EVENT;
					break;
				case GDriveCons.ObjectType.FLOW:
					key = GDriveCons.CustomObjectKey.FLOW;
					break;
				case GDriveCons.ObjectType.APPLICATION_STATE:
					key = GDriveCons.CustomObjectKey.APPLICATION_STATE;
					break;
				default:
					break;
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
			else if (this.props.objectType === GDriveCons.ObjectType.APPLICATION_STATE) {
                this.model.fieldNames = [];
                if (gModel) {
                    this.model.title = gModel.title.toString();
                    this.model.description = gModel.description.toString();
                    fields = gModel.fields;
                    for (i = 0, len = fields.length; i<len; i++) {
                        this.model.fieldNames.push(fields.get(i).get('name').toString());
                    }
                } else { //gModel was not properly initialized, but still need to load
                    this.model.title = DefaultValueCons.NewFileValues.APPLICATION_STATE_TITLE;
                    this.model.description = DefaultValueCons.NewFileValues.APPLICATION_STATE_DESCRIPTION;
                }
			}

			this.contentFileLoaded = true;
			$('#' + this.props.fileId).addClass('fadeIn animated');
			this.forceUpdate();
		}
		else
		{
			doc.close();
		}
	},

	getBackSideHeader: function() {
		var contentHeader = '';
		switch(this.props.objectType) {
			case GDriveCons.ObjectType.PERSISTENT_DATA:
			case GDriveCons.ObjectType.APPLICATION_STATE:
			case GDriveCons.ObjectType.EVENT:
			case GDriveCons.ObjectType.SNIPPET:
				contentHeader = 'Fields';
				break;
			case GDriveCons.ObjectType.ENUM:
				contentHeader = 'Enums';
				break;
			case GDriveCons.ObjectType.FLOW:
				/* ***TODO*** */
				break;
			default:
				break;
		}
		return contentHeader;
	},

	getBackSideContent: function() {
		var content = '';
		switch(this.props.objectType) {
			case GDriveCons.ObjectType.PERSISTENT_DATA:
			case GDriveCons.ObjectType.APPLICATION_STATE:
			case GDriveCons.ObjectType.EVENT:
			case GDriveCons.ObjectType.SNIPPET:
				if (this.model.fieldNames != null)
				{
					for (i = 0, len = this.model.fieldNames.length; i<len; i++) {
						content = content + this.model.fieldNames[i] + '\n';
					}
					break;
				}
			case GDriveCons.ObjectType.ENUM:
				if (this.model.enumNames != null)
				{
					for (i = 0, len = this.model.enumNames.length; i<len; i++) {
						content = content + this.model.enumNames[i] + '\n';
					}
					break;
				}
			case GDriveCons.ObjectType.FLOW:
				/* FLOW OBJECT CONTENT */
				break;
			default:
				break;
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
					<input type="text" className={this.props.fileId + '-header card-header noselect'} id={this.props.fileId + '-title'} readOnly />
					<div id={this.props.fileId + '-description-wrapper'} className="card-description-wrapper">
						<textarea id={this.props.fileId + '-description'} className="card-description noselect" readOnly></textarea>
					</div>
					<div id={this.props.fileId + '-object-type'}></div>
				</div>
				<div id = {this.props.fileId+'-card-back'} className={'back card-face ' + cardFaceClassName}>
					<input type="text" className={this.props.fileId + '-header card-header noselect'} id={this.props.fileId + '-back-header'} readOnly />
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
		this.transitionTo('editor', params, {fileType: this.props.objectType});
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
