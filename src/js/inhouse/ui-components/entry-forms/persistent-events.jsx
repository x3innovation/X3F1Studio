var EventType = require('../../constants/event-type.js');

module.exports = React.createClass({
	/* ******************************************
				LIFE CYCLE FUNCTIONS
	****************************************** */
	componentWillMount: function()
	{
		this.controller = this.props.controller;
	},

	componentDidMount: function()
	{
		this.controller.addModelUpdateListener(this.updateUi);
		this.updateUi();
	},

	/* ******************************************
				NON LIFE CYCLE FUNCTIONS
	****************************************** */
	updateUi: function() {
		var title = this.controller.getTitle();
		var persistenceEvents = this.controller.getPersistenceEvents();
		this.events = [
			{id: persistenceEvents.UpdatePersistenceEventTypeId,
			 label: 'Update',
			 name: 'Update' + title ,
			 isBusinessRequest: true}, 
			{id: persistenceEvents.CreatePersistenceEventTypeId,
			 label: 'Create',
			 name: 'Create' + title,
			 isBusinessRequest: true }, 
			{id: persistenceEvents.RemovePersistenceEventTypeId,
			 label: 'Remove',
			 name: 'Remove' + title,
			 isBusinessRequest: true },
			{id: persistenceEvents.UpdatedPersistenceEventTypeId,
			 label: 'Updated',
			 name: title + 'Updated' },
			{id: persistenceEvents.CreatedPersistenceEventTypeId,
			 label: 'Created',
			 name: title + 'Created' },
			{id: persistenceEvents.RemovedPersistenceEventTypeId,
			 label: 'Removed',
			 name: title + 'Removed' },
			{id: persistenceEvents.RejectedUpdatePersistenceEventTypeId,
			 label: 'Update Rejected',
			 name: 'Update' + title + 'Rejected' },
			{id: persistenceEvents.RejectedCreatePersistenceEventTypeId,
			 label: 'Create Rejected',
			 name: 'Create' + title + 'Rejected' },
			{id: persistenceEvents.RejectedRemovePersistenceEventTypeId,
			 label: 'Remove Rejected',
			 name: 'Remove' + title + 'Rejected' }
		];
		this.forceUpdate();
	},

	render: function() {
		var events = this.events || [];

		var eventContents = events.map(function(event, index) {
			var checkBox;
			if (event.isBusinessRequest)
			{
				var checkBoxId = event.id + '-id';
				checkBox = 	<div className='row'>
								<input type='checkbox' id={checkBoxId} className='filled-in' />
								<label htmlFor={checkBoxId}>Business Request</label>
							</div>

			}

			return (
				<div key = {event.id} className = 'col s4'>
					{checkBox}
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
