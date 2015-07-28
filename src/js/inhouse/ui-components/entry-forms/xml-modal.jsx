var GDriveConstants = require('../../constants/google-drive-constants.js');
var EventType = require('../../constants/event-type.js');

var Configs = require('../../app-config.js');

var generateXMLService = require('../../services/generate-xml-service.js');
var GDriveService = require('../../services/google-drive-service.js');

module.exports = React.createClass({
	/* ******************************************
				 LIFE CYCLE FUNCTIONS
	****************************************** */
	componentDidMount: function() {
		this.projectFile = {};
		var that = this;
	},

	/* ******************************************
				NON LIFE CYCLE FUNCTIONS
	****************************************** */
	onGenerateXMLBtnClick: function(e) {
		var objectsToGet = {
			persistentData: true,
			enum: true,
			snippet: true,
			event: true,
			flow: true
		};

		var that = this;
		GDriveService.getProjectById(this.props.projectFileId, function(project) {
			GDriveService.getProjectObjects(that.props.projectFolderFileId, '', objectsToGet, function(projectObjects) {
				generateXMLService.generateProjectXML(projectObjects, project, that.onXMLGenerated);
			});
		});
	},

	onXMLGenerated: function(xmlData) {
		var $xmlDisplay = $('#xml-display');
		var prettyXML = vkbeautify.xml(xmlData);

		var replaceAll = function(string, findArr, replacement) {
			for (var i = 0, len = findArr.length; i<len; i++) {
				string = string.split(findArr[i]).join(replacement);
			}
			return string;
		};

		this.xmlDisplayData = replaceAll(prettyXML, ['<j>', '</j>', '<j/>', '<j />'], '');
		$xmlDisplay.text(this.xmlDisplayData);
		hljs.highlightBlock($xmlDisplay[0]);
		$('#xml-display-modal').openModal({
			opacity: 0.7,
			in_duration: 200,
			out_duration: 200
		});
	},
	
	onDownloadXMLBtnClick: function(e) {
		var xmlFile = 'data:application/xml;charset=utf-8,' + encodeURIComponent(this.xmlDisplayData);
		e.currentTarget.setAttribute('download', this.props.projectFile.title+'.xml');
		e.currentTarget.setAttribute('href', xmlFile);
	},

	highlightAllContent: function(e) {
		var contentField = e.currentTarget;
		var range = document.createRange();
		range.setStartBefore(contentField.firstChild);
		range.setEndAfter(contentField.lastChild);
		var sel = window.getSelection();
		sel.removeAllRanges();
		sel.addRange(range);
	},

	render: function() {
		return (
			<div className = 'row'>
				<div id = 'xml-btn-wrapper' className = 'col s3'>
					<a id = 'generate-xml-btn' onClick = {this.onGenerateXMLBtnClick}
					   className = {'btn z-depth-1 waves-effect waves-light '+Configs.App.ADD_BUTTON_COLOR}>Generate XML</a>
				</div>
				<div id='xml-display-modal' className='modal modal-fixed-footer z-depth-2'>
					<div className='modal-content'>
						<pre><code id='xml-display' className='xml' onDoubleClick={this.highlightAllContent} /></pre>
					</div>
					<div className="modal-footer">
						<a id='xml-download-btn' className='modal-close modal-action waves-effect btn-flat'
							onClick = {this.onDownloadXMLBtnClick}>
							<i className='mdi-file-file-download' />Download XML</a>
					</div>
				</div>
			</div>
		);
	}
});
