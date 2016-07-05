function InheritanceController(gFileCustomObject, projectFolderFileId, fileType)
{
	// //////// private members
	var googleDriveUtils = require('../../utils/google-drive-utils.js');
	var DefaultValueConstants = require('../../constants/default-value-constants.js');
	var GDriveConstants = require('../../constants/google-drive-constants.js');
	var gFileCustomModel = gFileCustomObject;
	var pFolderId = projectFolderFileId;
	var fileType  = fileType;



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

				if(gFileCustomModel.title.text !== projectObjects[i].title ){
					if( fileType === 'f1-objectType-persistentData' 
						|| (fileType === 'f1-objectType-snippet' && projectObject.fileType === 'f1-objectType-snippet')){ // snippet can only inherit from snippet
						parents.push(projectObject);
					}
					
				}				
			}
			callback(parents);
		}
	}	
	this.getFieldExtend = function()
	{
		var extend = {
			name: gFileCustomObject.extends, 
			id: gFileCustomObject.extendsId
		}
		return extend;
	}

	this.setFieldExtend = function(id, name)
	{	
		gFileCustomObject.extendsId = id;
		gFileCustomObject.extends = name;
	}
}
	module.exports = InheritanceController;