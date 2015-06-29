var GDriveConstants = require('../../constants/google-drive-constants.js');
var Cons = GDriveConstants.Project;

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
		this.titleChangeTimeout = null;

		this.model = this.props.model;
		this.model.isCardFront = true;
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
		$('#' + this.props.fileId + '-description-wrapper').slimScroll();

		// need to get rid of 25% width once page is rendered
		var outerWidth = $('.row .col.s3').outerWidth() - 1;
		$('.row .col.s3').css('width', outerWidth);

		// apply single click to flip
		// $('#' + this.props.fileId + '-wrapper').on('click', this.onCardSingleClick);
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
	},

	/* ******************************************
			NON LIFE CYCLE FUNCTIONS
	****************************************** */
	onProjectMouseEnter : function()
	{
		$('#' + this.props.fileId + '-title').stop(true, true).animate({
			borderBottomColor: "#f24235"
		}, 0);

		$('.' + this.props.fileId + '-card-face').stop(true, true).animate({
			borderBottomColor: "#f24235"
		}, 500);
	},

	onProjectMouseLeave : function()
	{
		$('#' + this.props.fileId + '-title').stop(true, true).animate({
			borderBottomColor: "#9e9e9e"
		}, 0);

		$('.' + this.props.fileId + '-card-face').stop(true, true).animate({
			borderBottomColor: "white"
		}, 500);
	},

	onFileLoaded : function(doc)
	{
		var gModel = doc.getModel().getRoot();

		this.model.title = gModel.get(Cons.KEY_TITLE);
		this.model.description = gModel.get(Cons.KEY_DESCRIPTION);

		this.contentFileLoaded = true;
		$('#' + this.props.fileId).addClass('fadeIn animated');
		this.forceUpdate();
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

		content = <div id={this.props.fileId + '-card'}>
						<div id={this.props.fileId + '-card-front'} className={"front card-face " + cardFaceClassName}>
							<input type="text" className="card-header noselect" id={this.props.fileId + '-title'} readOnly />
							<div id={this.props.fileId + '-description-wrapper'} className="card-description-wrapper">
								<textarea id={this.props.fileId + '-description'} className="card-description noselect" readOnly></textarea>
							</div>
						</div>
						<div id = {this.props.fileId+'-card-back'} className={"back card-face " + cardFaceClassName}>
							<input type="text" className="card-back-header noselect" id={this.props.fileId + '-back-header'} readOnly />
							<div id={this.props.fileId + '-back-side-wrapper'} className="card-back-side-wrapper">
								Back Side! <br />
								Back Side! <br />
								Back Side! <br />
								Back Side! <br />
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