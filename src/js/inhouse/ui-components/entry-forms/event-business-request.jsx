module.exports = React.createClass({
	mixins: [Navigation, State],
	/* ******************************************
				LIFE CYCLE FUNCTIONS
	****************************************** */
	componentWillMount: function(){
		this.controller = this.props.controller;
	},

	componentDidMount: function(){
		// load previously selected business responses
		if (this.controller.isBusinessRequest())
		{
			$('#business-request-checkbox').trigger('click');
		}
	},

	componentDidUpdate: function(){
		var _this = this;
		var $businessResponseEvents = $('#business-response-events');
		if ($businessResponseEvents.length)
		{
			$businessResponseEvents.tagit({
				availableTags: this.responseEligibleEventsTitles,
				showAutocompleteOnFocus: true,
				autocomplete: {
					messages: {
						noResults: '',
						results: function(){}
					}
				},
				beforeTagAdded: function(event, ui){
					var $newTag = ui.tag;
					var tagLabel = $newTag.find('.tagit-label').text();
					if (_this.responseEligibleEventsTitles.indexOf(tagLabel) < 0){
						return false;
					}
					else{
						_this.controller.addBusinessResponse(tagLabel);
					}
				},
				beforeTagRemoved: function(event, ui){
					var $newTag = ui.tag;
					var tagLabel = $newTag.find('.tagit-label').text();
					_this.controller.removeBusinessResponse(tagLabel);
				}
			});

			// add existing tags
			var businessResponses = _this.controller.getBusinessResponses();
			if (businessResponses.length > 0)
			{
				for (var i in businessResponses)
				{
					$businessResponseEvents.tagit('createTag', businessResponses[i]);
				}
			}
			setTimeout(function(){
				$('.tagit-autocomplete').css('display', 'none');
			}, 0);

			$('.ui-helper-hidden-accessible').remove();
		}
	},

	componentWillUnmount: function(){
		this.controller.dispose();
	},

	/* ******************************************
				NON LIFE CYCLE FUNCTIONS
	****************************************** */
	onCheck: function(e){
		var _this = this;
		if (e.currentTarget.checked){
			_this.controller.setAsBusinessRequest();
			_this.controller.getResponseEligibleEventsTitles(onTitlesLoaded);

			function onTitlesLoaded(responseEligibleEventsTitles){
				_this.responseEligibleEventsTitles = responseEligibleEventsTitles;
				_this.responsePanel = 	<div>
											<label>Business Response: </label><br />
											<div id="business-request-input-wrapper">
												<ul id="business-response-events">
												</ul>
											</div>
										</div>
				_this.forceUpdate();
			}
		}
		else{
			_this.controller.setAsNonBusinessRequest();
			_this.controller.removeAllBusinessResponses();
			$('#business-response-events').data('ui-tagit').destroy();
			_this.responsePanel = null;
			_this.forceUpdate();
		}
	},

	render: function() {
		return (
			<div>
				<div className='row'>
					<input type='checkbox' id='business-request-checkbox' className='filled-in' onChange={this.onCheck} />
					<label htmlFor='business-request-checkbox'>Business Request</label>
				</div>
				{this.responsePanel}
			</div>
		);
	}
});
