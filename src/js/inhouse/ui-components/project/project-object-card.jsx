var googleDriveService = require('../../services/google-drive-service.js');
var GDriveConstant = require('../../constants/google-drive-constants.js');

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
        if (this.props.objectType === GDriveConstant.ObjectType.PERSISTENT_DATA)
        {
            this.model.objectType = 'PD';
            this.model.color = '#3f51b5';
        }
        else if (this.props.objectType === GDriveConstant.ObjectType.EVENT)
        {
            this.model.objectType = 'EV';
            this.model.color = '#ff9800';
        }
        else if (this.props.objectType === GDriveConstant.ObjectType.ENUM)
        {
            this.model.objectType = 'EN';
            this.model.color = '#f44336';
        }
        else if (this.props.objectType === GDriveConstant.ObjectType.FLOW)
        {
            this.model.objectType = 'FL';
            this.model.color = '#4caf50';
        }
    },

    componentDidUpdate : function()
    {
        // var titleInput = document.getElementById(this.props.fileId + '-title');
        $('#' + this.props.fileId + '-title').val(this.model.title);

        var descriptionInput = document.getElementById(this.props.fileId + '-description');
        $(descriptionInput).val(this.model.description);

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
        $('#' + this.props.fileId + '-object-type').addClass('card-tag-' + this.model.objectType).text(this.model.objectType);
    },

	/* ******************************************
            NON LIFE CYCLE FUNCTIONS
    ****************************************** */
    onProjectMouseEnter : function()
    {
        $('#' + this.props.fileId + '-title').stop(true, true).animate({
            borderBottomColor: this.model.color
        }, 0);

        $('.' + this.props.fileId + '-card-face').stop(true, true).animate({
            borderBottomColor: this.model.color
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
        var key;
        if (this.props.objectType === GDriveConstant.ObjectType.PERSISTENT_DATA)
        {
            key = GDriveConstant.CustomObjectKey.PERSISTENT_DATA;
        }
        else if (this.props.objectType === GDriveConstant.ObjectType.EVENT)
        {
            key = GDriveConstant.CustomObjectKey.EVENT;
        }
        else if (this.props.objectType === GDriveConstant.ObjectType.ENUM)
        {
            key = GDriveConstant.CustomObjectKey.ENUM;
        }
        else if (this.props.objectType === GDriveConstant.ObjectType.FLOW)
        {
            key = GDriveConstant.CustomObjectKey.FLOW;
        }
        
        var gModel = doc.getModel().getRoot().get(key);
        this.model.title = gModel.title;
        this.model.description = gModel.description;
        
        this.contentFileLoaded = true;
        $('#' + this.props.fileId).addClass('fadeIn animated');
        this.forceUpdate();
    },

    getContentBeforeFileLoaded : function()
    {
        var content =   <div className="list-group card-preloader-wrapper">
                            <img className="card-preloader" src="img/loading-spin.svg" />
                        </div>

        return content;
    },

    getContentAfterFileLoaded : function()
    {
        var content;

        var cardFaceClassName = 'z-depth-1 ' + this.props.fileId + '-card-face';

        content = <div id={this.props.fileId + '-card'}>
                        <div id={this.props.fileId + '-card-front'} className={"front card-face " + cardFaceClassName}>
                            <input type="text" className="card-title noselect" id={this.props.fileId + '-title'} readOnly />
                            <div id={this.props.fileId + '-description-wrapper'} className="card-description-wrapper">
                                <textarea id={this.props.fileId + '-description'} className="card-description noselect" readOnly></textarea>
                            </div>
                            <div id={this.props.fileId + '-object-type'}></div>
                        </div>
                        <div className={"back card-face " + cardFaceClassName}>
                            Back side!<br />
                            Back side!<br />
                            Back side!<br />
                            Back side!<br />
                        </div>
                    </div>
        return content;
    },

    onCardSingleClick : function()
    {
        var cardFront = $('#' + this.props.fileId + '-card-front');
        if (this.model.isCardFront)
        {
            cardFront.stop(true, true).fadeTo(0, 300, function(){
                cardFront.css('visibility', 'hidden');
            });
            $('#' + this.props.fileId + '-description-wrapper').css('position', 'initial !important');    
        }
        else
        {
            cardFront.css('visibility', 'visible');
            cardFront.stop(true, true).fadeTo(0, 300);
            $('#' + this.props.fileId + '-description-wrapper').css('position', 'relative !important');
        }

        $('#' + this.props.fileId + '-card').flip(this.model.isCardFront);
        this.model.isCardFront = !this.model.isCardFront;
    },

    onCardDoubleClick : function()
    {
        var params = {
            projectTitle : this.props.title,
            projectFolderFileId : this.props.projectFolderFileId
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