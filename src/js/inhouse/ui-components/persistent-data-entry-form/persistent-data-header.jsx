module.exports = React.createClass ({
	/* ******************************************
                LIFE CYCLE FUNCTIONS
    ****************************************** */
    
	/* ******************************************
               NON LIFE CYCLE FUNCTIONS
    ****************************************** */
  	render: function() {
      	return (
    		<div className="row">
                <div id="persistent-data-form-header-wrapper" className="col s12">
                    <input type="text" id="persistent-data-form-title" defaultValue = {this.props.title}/>
                    <div id="persistent-data-form-desc-wrapper">
                        <textarea rows="1" id="persistent-data-form-desc" defaultValue = {this.props.desc}></textarea>
                    </div>            
                </div>
          </div>
    	)
  	}
});