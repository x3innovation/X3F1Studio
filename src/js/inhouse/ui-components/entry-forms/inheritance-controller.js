function InheritanceController(gFileCustomObject, projectFolderFileId)
{
	// //////// private members
	var googleDriveUtils = require('../../utils/google-drive-utils.js');
	var DefaultValueConstants = require('../../constants/default-value-constants.js');
	var gFileCustomModel = gFileCustomObject;
	var pFolderId = projectFolderFileId;


	

	
	this.getDataTypeParents = function(){ 
		
		return "list of parents";
	}

	this.updateDataTypeParents = function(){ //adds or removes from the parents list 
		//return "list of parents";
	}

}
module.exports = InheritanceController;