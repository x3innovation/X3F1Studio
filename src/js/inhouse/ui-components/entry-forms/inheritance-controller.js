function InheritanceController(gFileCustomObject, projectFolderFileId)
{
	// //////// private members
	var googleDriveUtils = require('../../utils/google-drive-utils.js');
	var DefaultValueConstants = require('../../constants/default-value-constants.js');
	var GDriveConstants = require('../../constants/google-drive-constants.js');
	var gFileCustomModel = gFileCustomObject;
	var pFolderId = projectFolderFileId;



	this.loadProjectObjects = function(callback)
	{
		var objectsToGet = { 
			persistentData: true,
			snippet: true
		};

		googleDriveUtils.getProjectObjects(pFolderId, '', objectsToGet, onProjectObjectsLoaded);

		function onProjectObjectsLoaded(projectObjects)
		{		
			var parents = [];
			var projectObject;
			for (var i = 0, len = projectObjects.length; i<len; i++) {
				projectObject = {
					id: projectObjects[i].id,
					title: projectObjects[i].title,
					fileType: projectObjects[i].description 
				};
				
				switch (projectObjects[i].description) {
					case GDriveConstants.ObjectType.PERSISTENT_DATA:
						if(gFileCustomModel.title.text !== projectObjects[i].title)
							parents.push(projectObject);						
						break;
					case GDriveConstants.ObjectType.SNIPPET:
						//add logic here so that only snippets can make it to the parents list 
					default: break;
				}
			}
			callback(parents);
		}
	}
	
	this.getFieldExtend = function()
	{
		return gFileCustomObject.extends !== null ? gFileCustomObject.extends : null;
	}

	this.setFieldExtend = function(value)
	{
		gFileCustomObject.extends = value;
	}
}
module.exports = InheritanceController;