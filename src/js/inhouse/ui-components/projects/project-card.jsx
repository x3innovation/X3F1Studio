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
        };
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

        $('#' + this.props.fileId + '-card').flip({
            axis : 'y',
            trigger : 'manual'
        });
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
        $('#' + this.props.fileId + '-card').stop().animate({
           borderBottomColor: "#f24235",
        }, 0);

        var fadeInDuration = 700;
        $('#' + this.props.fileId + '-flip').stop().fadeIn({duration:fadeInDuration});
        $('#' + this.props.fileId + '-edit').stop().fadeIn({duration:fadeInDuration});
        $('#' + this.props.fileId + '-remove').stop().fadeIn({duration:fadeInDuration});
    },

    onProjectMouseLeave : function()
    {
        $('#' + this.props.fileId + '-card').stop().animate({
           borderBottomColor: "white",
        }, 0);

        var fadeOutDuration = 500;
        $('#' + this.props.fileId + '-flip').stop().fadeOut({duration:fadeOutDuration});
        $('#' + this.props.fileId + '-edit').stop().fadeOut({duration:fadeOutDuration});
        $('#' + this.props.fileId + '-remove').stop().fadeOut({duration:fadeOutDuration});
    },

    onFileLoaded : function(doc)
    {
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
            fontSize : '1.3rem'
        };

        var descriptionStyle = {
            border : '0',
            resize : 'none',
            outline : 'none'
        };

        var cardStyle = {
            height : '10em'
        }

        content = <div id={this.props.fileId + '-card'}>
                        <div className="front z-depth-1" style={cardStyle}>
                            <input type="text" id={this.props.fileId + '-title'} style={titleStyle} />
                            <textarea id={this.props.fileId + '-description'} style={descriptionStyle}></textarea>
                        </div>
                        <div className="back z-depth-1" style={cardStyle}>
                            Back side!<br />
                            Back side!<br />
                            Back side!<br />
                            Back side!<br />
                        </div>
                    </div>
        return content;
    },

    getEditButton : function()
    {
        var editButton;

        var editButtonId = this.props.fileId + '-edit';
        var editButtonClassName = "mdi-editor-mode-edit fa-2x z-depth-1";
        var editIconStyle = {
            position : 'absolute',
            right : '35px',
            bottom : '-20',
            display: 'none',
            background: '#f24235',
            color: 'white',
            width : '20px',
            height : '20px',
            textAlign : 'center',
            cursor : 'pointer'
        };

        editButton = <i id={editButtonId} className={editButtonClassName} style={editIconStyle} />

        return editButton;
    },

    getRemoveButton : function()
    {
        var removeButton;

        var removeButtonId = this.props.fileId + '-remove';
        var removeButtonClassName = "mdi-navigation-close fa-2x z-depth-1";
        var removeIconStyle = {
            position : 'absolute',
            right : '10px',
            bottom : '-20',
            display: 'none',
            background: '#f24235',
            color: 'white',
            width : '20px',
            height : '20px',
            textAlign : 'center',
            cursor : 'pointer'
        };

        removeButton = <i id={removeButtonId} className={removeButtonClassName} style={removeIconStyle} />

        return removeButton;
    },

    getFlipButton : function()
    {
        var removeButton;

        var removeButtonId = this.props.fileId + '-flip';
        var removeButtonClassName = "mdi-image-flip fa-2x z-depth-1";
        var removeIconStyle = {
            position : 'absolute',
            right : '60px',
            bottom : '-20',
            display: 'none',
            background: '#f24235',
            color: 'white',
            width : '20px',
            height : '20px',
            textAlign : 'center',
            cursor : 'pointer'
        };

        removeButton = <i id={removeButtonId} className={removeButtonClassName} style={removeIconStyle} onClick={this.onFlipBtnClick} />

        return removeButton;
    },

    onFlipBtnClick : function()
    {
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
            editButton = this.getEditButton();
            removeButton = this.getRemoveButton();
            flipButton = this.getFlipButton();
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