var PDFieldSelector = require('./persistent-data-field-selector.jsx');
var PDForm = require('./persistent-data-form.jsx');

module.exports = React.createClass({

	render: function() {
		return (
			<div className = 'PD-form-wrapper'>
				<PDFieldSelector attributes={this.props.attributes}/>
				<PDForm />
			</div>
		);
	}
});