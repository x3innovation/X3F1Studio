module.exports = React.createClass ({
	/* ******************************************
                LIFE CYCLE FUNCTIONS
    ****************************************** */
    
	/* ******************************************
               NON LIFE CYCLE FUNCTIONS
    ****************************************** */
  	render: function() {
      	return (
    		<div className='PD-form'>
    			<textarea className='form-header form-header-title' defaultValue={this.props.title}></textarea>
    			<textarea className='form-header form-header-desc' defaultValue={this.props.desc}></textarea>
    		</div>
    	);
  	}
});