var EventType=require('../../constants/event-type.js')

module.exports=React.createClass ({
	/* ******************************************
                LIFE CYCLE FUNCTIONS
    ****************************************** */
    componentWillMount: function() {
        this.model={};
        this.model.title=this.props.title;
        this.model.description=this.props.description;
        Bullet.on(EventType.PersistentDataEntry.GAPI_DATA_FILE_LOADED,'persistent-data-form-header.jsx>>gapi-data-file-loaded', 
            this.readData);
    },

    componentDidMount: function() {
        $('#persistent-data-form-title').focus(function(){$(this).attr('placeholder', '');})
                                         .blur(function(){$(this).attr('placeholder', 'enter title');});
    },

    componentWillUnmount: function() {
        Bullet.off(EventType.PersistentDataEntry.GAPI_DATA_FILE_LOADED,'persistent-data-form-header.jsx>>gapi-data-file-loaded');
    },

	/* ******************************************
               NON LIFE CYCLE FUNCTIONS
    ****************************************** */

    readData: function(data) {
        this.model.title=data.title;
        this.model.description=data.description;
        this.forceUpdate();
    },

    onTitleChange: function(e) {
        this.model.title = e.target.value;
        this.forceUpdate();
    },

    onDescriptionChange: function(e) {
        this.model.description = e.target.value;
        this.forceUpdate();
    },

  	render: function() {
      	return (
    		<div className="row">
                <div id="persistent-data-form-header-wrapper" className="col s12">
                    <input type="text" id="persistent-data-form-title" placeholder='enter title'
                     value={this.model.title} onChange={this.onTitleChange}/>
                    <div id="persistent-data-form-desc-wrapper">
                        <textarea rows="1" id="persistent-data-form-desc" placeholder='enter description'
                         value={this.model.description} onChange={this.onDescriptionChange}></textarea>
                    </div>            
                </div>
            </div>
    	)
  	}
});