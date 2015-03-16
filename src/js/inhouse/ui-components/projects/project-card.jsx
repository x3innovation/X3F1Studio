module.exports = React.createClass({

	contentFileLoaded : false,

	model : {},

	/* ******************************************
                LIFE CYCLE FUNCTIONS
    ****************************************** */
    componentDidMount : function()
    {
        gapi.drive.realtime.load(this.props.fileId, this.onFileLoaded, this.initializeModel);
    },

    componentDidUpdate : function()
    {
        var titleInput = document.getElementById(this.props.fileId + '-title');
        gapi.drive.realtime.databinding.bindString(this.model.title, titleInput);

        var descriptionInput = document.getElementById(this.props.fileId + '-description');
        gapi.drive.realtime.databinding.bindString(this.model.description, descriptionInput);
        resizeDescription();

        // everytime there is a change in description, textarea has to be resized
        this.model.description.addEventListener(gapi.drive.realtime.EventType.TEXT_INSERTED, resizeDescription);
        this.model.description.addEventListener(gapi.drive.realtime.EventType.TEXT_DELETED, resizeDescription);
        function resizeDescription()
        {
            $(descriptionInput).css('height', 'auto').height(descriptionInput.scrollHeight);
        }

        // buttons animation
        $('#' + this.props.fileId + '-wrapper').mouseenter(this.onProjectMouseEnter).mouseleave(this.onProjectMouseLeave);
    },
	/* ******************************************
            NON LIFE CYCLE FUNCTIONS
    ****************************************** */
    onProjectMouseEnter : function()
    {
        $('#' + this.props.fileId).stop().animate({
           borderBottomColor: "#f24235",
        }, 0);

        var fadeInDuration = 700;
        $('#' + this.props.fileId + '-flip').stop().fadeIn({duration:fadeInDuration});
        $('#' + this.props.fileId + '-edit').stop().fadeIn({duration:fadeInDuration});
        $('#' + this.props.fileId + '-remove').stop().fadeIn({duration:fadeInDuration});
    },

    onProjectMouseLeave : function()
    {
        $('#' + this.props.fileId).stop().animate({
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
            top : '50%',
            left : '50%',
            transform : 'translate(-50%, -50%)',
            WebkitTransform : 'translate(-50%, -50%)',
            MozTransform : 'translate(-50%, -50%)',
            MsTransform : 'translate(-50%, -50%)'
        };

        var cardWrapperStyle = {
            position : 'relative',
            height : '10em',
            minHeight : '60px'
        };

        content = <div className="list-group" style={cardWrapperStyle}>
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

        var descriptionWrapperStyle = {
            overflowY : 'hidden',
            padding : '0'
        };

        content = <div className="list-group">
                        <div className="list-group-item">
                            <input type="text" id={this.props.fileId + '-title'} style={titleStyle} />
                        </div>
                        <div id={this.props.fileId + '-description-wrapper'} className="list-group-item" style={descriptionWrapperStyle}>
                            <textarea id={this.props.fileId + '-description'} style={descriptionStyle}></textarea>
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
        $('#' + this.props.fileId + '-wrapper')[0].classList.toggle("flip");
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
            <div id={this.props.fileId + '-wrapper'}className="project-card panel panel-default flip-container" style={wrapperStyle}>
                <div id={this.props.fileId} className="flipper z-depth-1" style={{border:'2px solid white'}}>
                    <div className="front">
                        {content}
                    </div>
                    <div className="back">
                        Back side!<br />
                        Back side!<br />
                        Back side!<br />
                        Back side!<br />

                    </div>
                </div>
                {flipButton}
                {editButton}
                {removeButton}
            </div>
        );
    }
});