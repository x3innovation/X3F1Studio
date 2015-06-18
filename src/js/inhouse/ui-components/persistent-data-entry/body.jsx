var EventType=require('../../constants/event-type.js');
var FieldSelector=require('./field-selector.jsx');
var Form=require('./form.jsx');
var PersistentEvents=require('./persistent-events.jsx')

module.exports=React.createClass({
	/* ******************************************
				LIFE CYCLE FUNCTIONS
	****************************************** */
	componentWillMount: function() {
		Bullet.on(EventType.PersistentDataEntry.GAPI_FILE_LOADED, 'body.jsx>>onGapiFileLoaded', this.onGapiFileLoaded); 
	}, 

	componentDidMount: function() {

	}, 

	componentWillUnmount: function() {
		Bullet.off(EventType.PersistentDataEntry.GAPI_FILE_LOADED, 'body.jsx>>onGapiFileLoaded');
	}, 

	/* ******************************************
				NON LIFE CYCLE FUNCTIONS
	****************************************** */

	onGapiFileLoaded: function() {
		$('#persistent-data-body-wrapper').removeClass('hide');
		$('#body-preloader-wrapper').addClass('hide');
	}, 

	render: function() {
		return (
			<div>
				<div id='persistent-data-body-wrapper' className='row loaded hide'>	
					<div id='persistent-data-form-wrapper' className='row'>
						<div className='col s4' id='persistent-data-fields-container'>
							<FieldSelector projectFileId={this.props.projectFileId} 
											projectFolderFileId={this.props.projectFolderFileId}
											fileId={this.props.persistentDataFileId}/>
						</div>
						<div className='col s8' id='persistent-data-form-contents'>
							<Form projectFileId={this.props.projectFileId} 
									projectFolderFileId={this.props.projectFolderFileId}
									fileId={this.props.persistentDataFileId}/>
						</div>
					</div>
					<br />
					<div id='persistent-events-wrapper' className='row'>
						<div className='col s12' id='persistent-events-wrapper'>
							<PersistentEvents projectFileId={this.props.projectFileId} 
												projectFolderFileId={this.props.projectFolderFileId}
												fileId={this.props.persistentDataFileId}/>
						</div>
					</div>
				</div>

				<div id="body-preloader-wrapper" className='preloader'>
					<img id="body-preloader" src="img/loading-spin.svg" />
				</div>
			</div>
		);
	}
});
