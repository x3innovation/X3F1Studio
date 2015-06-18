var EventType=require('../../constants/event-type.js');
var GDriveConstants=require('../../constants/google-drive-constants.js');
var googleDriveService=require('../../services/google-drive-service.js');
var Cons=GDriveConstants.PersistentData;

module.exports=React.createClass({

	model: {}, 
	
	/* ******************************************
				LIFE CYCLE FUNCTIONS
	****************************************** */
	componentWillMount: function() {
		Bullet.on(EventType.PersistentDataEntry.GAPI_FILE_LOADED, 'persistent-events.jsx>>onGapiFileLoaded', this.onGapiFileLoaded);

	}, 

	componentDidMount: function() { 
	}, 

	componentWillUnmount: function() {
		Bullet.off(EventType.PersistentDataEntry.GAPI_FILE_LOADED, 'persistent-events.jsx>>onGapiFileLoaded');
	}, 

	/* ******************************************
				NON LIFE CYCLE FUNCTIONS
	****************************************** */
	onGapiFileLoaded: function(doc) {
		var key=GDriveConstants.CustomObjectKey.PERSISTENT_DATA;
		this.model.gModel=doc.getModel().getRoot().get(key);
		this.model.gModel.addEventListener(gapi.drive.realtime.EventType.VALUE_CHANGED, this.updateUi);
		this.updateUi();
		$('#persistent-events-container').removeClass('hide');
	}, 

	onTitleChange: function() {
		var title=$('#header-title').val();
		this.updateUi();
	}, 

	updateUi: function() {
		var gModel=this.model.gModel;
		var title=this.model.gModel.title;
		this.model.events=[
			{id: gModel.UpdatePersistenceEventTypeId, 
			 label: "Update", 
			 name: "Update "+title}, 
			{id: gModel.CreatePersistenceEventTypeId, 
			 label: "Create", 
			 name: "Create "+title}, 
			{id: gModel.RemovePersistenceEventTypeId, 
			 label: "Remove", 
			 name: "Remove "+title}, 
			{id: gModel.UpdatedPersistenceEventTypeId, 
			 label: "Updated", 
			 name: title+" Updated"}, 
			{id: gModel.CreatedPersistenceEventTypeId, 
			 label: "Created", 
			 name: title+" Created "}, 
			{id: gModel.RemovedPersistenceEventTypeId, 
			 label: "Removed", 
			 name: title+" Removed "}, 
			{id: gModel.RejectedUpdatePersistenceEventTypeId, 
			 label: "Update Rejected", 
			 name: "Update "+title+" Rejected"}, 
			{id: gModel.RejectedCreatePersistenceEventTypeId, 
			 label: "Create Rejected", 
			 name: "Create "+title+" Rejected"}, 
			{id: gModel.RejectedRemovePersistenceEventTypeId, 
			 label: "Remove Rejected", 
			 name: "Remove "+title+" Rejected"}
		];
		this.forceUpdate();
	}, 

	render: function() {
		var events=this.model.events || [];

		var eventContents=events.map(function(event, columnIndex){
				return (
					<div key={columnIndex} className="col s4">
						<div className="row">
							<div className="col s2 input-field">
								<input type="text" className="event-display" disabled value={event.id} id={"event-"+event.id+"-name"} />
								<label htmlFor={event.id+"-event-id"} className="event-label active">Type Id</label>
							</div>
							<div className="col s10 input-field">
								<input type="text" className="event-display" disabled value={event.name} id={"event-"+event.id+"-name"} />
								<label htmlFor={"event-"+event.id+"-name"} className="event-label active">{event.label}</label>
							</div>
						</div>
					</div>
				)
			})

		return(
			<div id="persistent-events-container" className="row hide">
				{eventContents}
			</div>
		);
	}
});
