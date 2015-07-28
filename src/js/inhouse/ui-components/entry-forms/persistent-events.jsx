var EventType = require('../../constants/event-type.js');

module.exports = React.createClass({
	/* ******************************************
				LIFE CYCLE FUNCTIONS
	****************************************** */
	componentWillMount: function() {
		Bullet.on(EventType.EntryForm.GAPI_FILE_LOADED, 'persistent-events.jsx>>onGapiFileLoaded', this.onGapiFileLoaded);
	},

	componentDidMount: function() {

	},

	componentWillUnmount: function() {
		if (this.gModel.title) { this.gModel.title.removeAllEventListeners(); }

		Bullet.off(EventType.EntryForm.GAPI_FILE_LOADED, 'persistent-events.jsx>>onGapiFileLoaded');
	},

	/* ******************************************
				NON LIFE CYCLE FUNCTIONS
	****************************************** */
	onGapiFileLoaded: function(doc) {
		this.gModel = doc.getModel().getRoot().get(this.props.gapiKey);
		this.gModel.title.addEventListener(gapi.drive.realtime.EventType.TEXT_INSERTED, this.updateUi);
		this.gModel.title.addEventListener(gapi.drive.realtime.EventType.TEXT_DELETED, this.updateUi);
		this.updateUi();
	},

	updateUi: function() {
		var gModel = this.gModel;
		var title = gModel.title.toString();
		this.events = [
			{id: gModel.UpdatePersistenceEventTypeId,
			 label: 'Update',
			 name: 'Update' + title }, 
			{id: gModel.CreatePersistenceEventTypeId,
			 label: 'Create',
			 name: 'Create' + title }, 
			{id: gModel.RemovePersistenceEventTypeId,
			 label: 'Remove',
			 name: 'Remove' + title },
			{id: gModel.UpdatedPersistenceEventTypeId,
			 label: 'Updated',
			 name: title + 'Updated' },
			{id: gModel.CreatedPersistenceEventTypeId,
			 label: 'Created',
			 name: title + 'Created' },
			{id: gModel.RemovedPersistenceEventTypeId,
			 label: 'Removed',
			 name: title + 'Removed' },
			{id: gModel.RejectedUpdatePersistenceEventTypeId,
			 label: 'Update Rejected',
			 name: 'Update' + title + 'Rejected' },
			{id: gModel.RejectedCreatePersistenceEventTypeId,
			 label: 'Create Rejected',
			 name: 'Create' + title + 'Rejected' },
			{id: gModel.RejectedRemovePersistenceEventTypeId,
			 label: 'Remove Rejected',
			 name: 'Remove' + title + 'Rejected' }
		];
		this.forceUpdate();
	},

	render: function() {
		var events = this.events || [];

		var eventContents = events.map(function(event, index) {
			return (
				<div key = {event.id} className = 'col s4'>
					<div className = 'row'>
						<div className = 'col s2 input-field'>
							<input type = 'text' className = 'event-display' readOnly value = {event.id} id = {'event-' + event.id + '-name'} />
							<label htmlFor = {event.id + '-event-id'} className = 'event-label active'>Type Id</label>
						</div>
						<div className = 'col s10 input-field'>
							<input type = 'text' className = 'event-display' readOnly value = {event.name} id = {'event-' + event.id + '-name'} />
							<label htmlFor = {'event-' + event.id + '-name'} className = 'event-label active'>{event.label}</label>
						</div>
					</div>
				</div>
			);
		});

		return (
			<div id = 'persistent-events-container' className = 'row'>
				{eventContents}
			</div>
		);
	}
});
