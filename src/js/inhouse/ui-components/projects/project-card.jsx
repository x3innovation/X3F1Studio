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
        var content =   <div className="list-group project-card-preloader-wrapper">
                            <img className="project-card-preloader" src="img/loading-spin.svg" />
                        </div>

        return content;
    },

    getContentAfterFileLoaded : function()
    {
        var content;

        var cardFaceClassName = 'z-depth-1 ' + this.props.fileId + '-card-face';

        content = <div id={this.props.fileId + '-card'}>
                        <div id={this.props.fileId + '-card-front'} className={"front project-card-face " + cardFaceClassName}>
                            <input type="text" className="project-card-title" id={this.props.fileId + '-title'} disabled="disabled" />
                            <div id={this.props.fileId + '-description-wrapper'} className="project-card-description-wrapper">
                                <textarea id={this.props.fileId + '-description'} className="project-card-description" disabled="disabled"></textarea>
                            </div>
                        </div>
                        <div className={"back project-card-face " + cardFaceClassName}>
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
		if (!this.contentFileLoaded)
		{
			content = this.getContentBeforeFileLoaded();
		}
		else
		{
            content = this.getContentAfterFileLoaded();
		}

        return (
            <div id={this.props.fileId + '-wrapper'} className="project-card-wrapper">
                <div>
                    {content}
                </div>
            </div>
        );
    }
});