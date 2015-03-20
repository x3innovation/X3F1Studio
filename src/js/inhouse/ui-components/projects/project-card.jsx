module.exports = React.createClass({

	contentFileLoaded : false,

    model : null,

	/* ******************************************
                LIFE CYCLE FUNCTIONS
    ****************************************** */
    componentDidMount : function()
    {
        gapi.drive.realtime.load(this.props.fileId, this.onFileLoaded, this.initializeModel);
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
        resizeDescription();

        // everytime title is changed, need to save it to the underlying file's titles as well
        // this will help displaying the projects in sorted alphabetical fashion when projects are loaded.
        var titleChangeTimeout = this.titleChangeTimeout;
        var onTitleChange = function()
        {
            clearTimeout(titleChangeTimeout);
            titleChangeTimeout = setTimeout(this.saveTitleToFileItself, 500);
        }.bind(this);
        this.model.title.addEventListener(gapi.drive.realtime.EventType.TEXT_INSERTED, onTitleChange);
        this.model.title.addEventListener(gapi.drive.realtime.EventType.TEXT_DELETED, onTitleChange);
        // everytime there is a change in description, textarea has to be resized
        this.model.description.addEventListener(gapi.drive.realtime.EventType.TEXT_INSERTED, resizeDescription);
        this.model.description.addEventListener(gapi.drive.realtime.EventType.TEXT_DELETED, resizeDescription);
        function resizeDescription()
        {
            $(descriptionInput).css('height', 'auto').height(descriptionInput.scrollHeight);
        }

        // buttons animation
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
        $('#' + this.props.fileId + '-wrapper').on('click', this.onCardSingleClick);
    },

	/* ******************************************
            NON LIFE CYCLE FUNCTIONS
    ****************************************** */
    saveTitleToFileItself : function()
    {
        var saveTitleRequest = gapi.client.drive.files.patch({
            'fileId' : this.props.fileId,
            'resource' : {
                'title' : $('#' + this.props.fileId + '-title').val()
            }
        });

        saveTitleRequest.execute();
    },

    onProjectMouseEnter : function()
    {
        $('#' + this.props.fileId + '-title').stop().animate({
            borderBottomColor: "#f24235"
        }, 200);
    },

    onProjectMouseLeave : function()
    {
        $('#' + this.props.fileId + '-title').stop().animate({
            borderBottomColor: "#9e9e9e"
        }, 200);
    },

    onFileLoaded : function(doc)
    {
        // title and description need to be backwards compatible with legacy F1 Studio
        // Delete this section of code once project creation is done that creates
        // properly initialized google drive files.
        var title = doc.getModel().getRoot().get('title');
        if (title == null)
        {
            var titleString = doc.getModel().createString(this.props.title);
            doc.getModel().getRoot().set('title', titleString);
        }
        var description = doc.getModel().getRoot().get('description');
        if (description == null)
        {
            var titleString = doc.getModel().createString('');
            doc.getModel().getRoot().set('description', titleString);
        }

        var gDriveModel = doc.getModel().getRoot();
        this.model.title = gDriveModel.get('title');
        this.model.description = gDriveModel.get('description');
        
        this.contentFileLoaded = true;
        $('#' + this.props.fileId).addClass('fadeIn animated');
        this.forceUpdate();
    },

    getContentBeforeFileLoaded : function()
    {
        var content;

        var preloaderStyle = {
            position : 'absolute',
            top : '45%',
            left : '50%',
            transform : 'translate(-50%, -50%)',
            WebkitTransform : 'translate(-50%, -50%)',
            MozTransform : 'translate(-50%, -50%)',
            MsTransform : 'translate(-50%, -50%)'
        };

        var wrapperStyle = {
            height : '20em'
        };

        content = <div className="list-group" style={wrapperStyle}>
                        <img src="img/loading-spin.svg" style={preloaderStyle} />
                    </div>

        return content;
    },

    getContentAfterFileLoaded : function()
    {
        var content;

        var titleStyle = {
            height : '2rem',
            fontSize : '1.3rem',
            textAlign : 'center'
        };

        var descriptionStyle = {
            border : '0',
            resize : 'none',
            outline : 'none'
        };

        var cardFaceStyle = {
            padding : '10px 10px 0 10px',
            height : '10em',
            borderBottom : '2px solid white'
        };

        var descriptionWrapperStyle = {
            overflowY : 'auto',
            overflowX : 'hidden'
        };

        var cardFaceClassName = 'z-depth-1 ' + this.props.fileId + '-card-face';

        content = <div id={this.props.fileId + '-card'}>
                        <div id={this.props.fileId + '-card-front'} className={"front " + cardFaceClassName} style={cardFaceStyle}>
                            <input type="text" className="project-title" id={this.props.fileId + '-title'} style={titleStyle} disabled="disabled" />
                            <div id={this.props.fileId + '-description-wrapper'} style={descriptionWrapperStyle}>
                                <textarea id={this.props.fileId + '-description'} style={descriptionStyle} disabled="disabled"></textarea>
                            </div>
                        </div>
                        <div className={"back " + cardFaceClassName} style={cardFaceStyle}>
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
            cardFront.stop().fadeOut(300, function(){
                cardFront.css('visibility', 'hidden');
            });
            $('#' + this.props.fileId + '-description-wrapper').css('position', 'initial !important');    
        }
        else
        {
            cardFront.css('visibility', 'visible');
            cardFront.stop().fadeIn(300);
            $('#' + this.props.fileId + '-description-wrapper').css('position', 'relative !important');
        }

        $('#' + this.props.fileId + '-card').flip(this.model.isCardFront);
        this.model.isCardFront = !this.model.isCardFront;
    },

    render: function()
	{
		var content;
        var editButton;
        var removeButton;
        var flipButton;

		if (!this.contentFileLoaded)
		{
			content = this.getContentBeforeFileLoaded();
		}
		else
		{
            content = this.getContentAfterFileLoaded();
		}

        // styles
        var wrapperStyle = {
            position : 'relative'
        };

        return (
            <div id={this.props.fileId + '-wrapper'} style={wrapperStyle}>
                <div style={{border:'2px solid white'}}>
                    {content}
                </div>
                {flipButton}
                {editButton}
                {removeButton}
            </div>
        );
    }
});