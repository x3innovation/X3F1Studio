var randomYoutubeVideoUrlProvider = require('./RandomYoutubeVideoUrlProvider.js');

module.exports = React.createClass({

    counter : 0,

    componentDidMount : function()
    {
        var videoUrl = randomYoutubeVideoUrlProvider.get();
        $('#fullpage').fullpage({
            sectionsColor: ['', '#7BAABE', '#4BBFC3'],
            controlArrows: false,
            verticalCentered: false,
            css3: true,
            scrollBar: true,
            autoScrolling: true,
            navigation: true,
            navigationPosition: 'right',
            navigationTooltips: ['video', 'forum'],
            afterRender: function(){
                $('#videoBG').tubular({
                    start : 0,
                    videoId : videoUrl,
                    mute : true,
                    repeat : true
                });

                var interval = setInterval(function(){
                    clearInterval(interval);
                    // google group forums
                    var uri = "https://groups.google.com/forum/embed/?place=forum/glubey" +
                                "&parenturl=" +
                                encodeURIComponent(window.location.href);
                    $('#forum_embed').attr('src', uri);
                },500);
            },
            onLeave: function(index, nextIndex, direction){
                if(index == 1 && direction =='down'){
                    $('#tubular-container').css('pointer-events', 'none').css('z-index', '-2');
                    $('#fullpage').css('pointer-events', 'auto');
                }
                else if(index == 2 && direction =='up'){
                    $('#tubular-container').css('pointer-events', 'auto').css('z-index', '1');
                    $('#fullpage').css('pointer-events', 'none');
                }
            }
        });
    },

    componentWillUnmount : function()
    {
        // unfortunately because I hacekd the YouTube background video player
        // so that it could be loaded multiple times in this Single Page App,
        // I had to put in this flag to indicate when you leave this page, YT is no longer
        // first time loading.
        window.firstTimeRenderYT = false;
        $.fn.fullpage.destroy('all');
    },

    onVolumeMuteBtnClick : function()
    {
        if (player.isMuted())
        {
            $('#videoMuteBtn').attr('class', 'medium mdi-av-volume-off').css('color', '#f44336');
            player.setVolume(40);
            player.unMute();
        }
        else
        {
            $('#videoMuteBtn').attr('class', 'medium mdi-av-volume-up').css('color', '#4caf50');
            player.mute();
        }
    },

    onSection0ArrowDownClick : function()
    {
        $.fn.fullpage.moveSectionDown();
    },

    render: function()
	{
        var sectionStyle = {
            padding : '0',
            overflow : 'hidden'
        };

        var volumeMuteStyle = {
            position : 'absolute',
            top : '10px',
            left : '30px',
            color : '#4caf50',
            cursor : 'pointer',
            pointerEvents : 'auto'
        };

        var section0Message = {
            position : 'absolute',
            top : '20%',
            left : '50%',
            WebkitTransform : 'translate(-50%, 0)',
            MozTransform : 'translate(-50%, 0)',
            color : 'white',
            textAlign : 'center'
        };

        var section0ArrowDownStyle = {
            position : 'absolute',
            bottom : '10%',
            left : '50%',
            WebkitTransform : 'translate(-50%, 0)',
            MozTransform : 'translate(-50%, 0)',
            color : 'white',
            pointerEvents : 'auto',
            cursor : 'pointer'
        };

        var forumStyle = {
            border : '0',
            width : '100%',
            height : '70vh'
        };

        var fullpageWrapperStyle = {
            zIndex : '100',
            pointerEvents: 'none'
        };

        return (
            <div id="videoBG">
                <div id="fullpage" style={fullpageWrapperStyle}>
                    
                    <div className="section " id="section0" style={sectionStyle}>
                        <div style={section0Message}>
                            <h1 style={{fontSize:'4em'}}>Global Connections</h1>
                            <h1 style={{fontSize:'2em'}}>easy-to-make, searchable profiles</h1>
                        </div>
                        <i id="videoMuteBtn" className="medium medium mdi-av-volume-up" style={volumeMuteStyle} onClick={this.onVolumeMuteBtnClick}></i>
                        <i className="large mdi-hardware-keyboard-arrow-down" style={section0ArrowDownStyle} onClick={this.onSection0ArrowDownClick}></i>
                    </div>

                    <div className="section" id="section1" style={sectionStyle}>
                        <div className="container">
                            <div className="row">
                                <div className="col s12">
                                    <h1 style={{fontWeight:'200'}}>Forum</h1>
                                    <div className="card">
                                        <div className="card-content" style={{padding:'0'}}>
                                            <iframe id="forum_embed"
                                                src="javascript:void(0)"
                                                scrolling="no"
                                                style={forumStyle}>
                                            </iframe>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        );
    }
});