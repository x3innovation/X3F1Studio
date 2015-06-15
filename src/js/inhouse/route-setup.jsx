window.Router = ReactRouter;
window.Link = Router.Link;
window.Navigation = Router.Navigation;
window.State = Router.State;
var Route = Router.Route, DefaultRoute = Router.DefaultRoute, 
    Link = Router.Link, RouteHandler = Router.RouteHandler;
var App = require('./ui-components/app.jsx');
var Home = require('./ui-components/home/home.jsx');
var Projects = require('./ui-components/projects/projects.jsx');
var Project = require('./ui-components/project/project.jsx');
var PersistentDataEntry = require('./ui-components/persistent-data-entry/persistent-data-entry.jsx');
var PersistentDataCreate = require('./ui-components/persistent-data-entry/persistent-data-create.jsx');

//setting '/project/persistent-data-entry/...' or similar links to the Project handler
var routes = (
	<Route name='home' path='/' handler={App}>
		<Route name='projects' path='projects' handler={Projects}></Route>
		<Route name='project' path='/project/:projectFolderFileId/:projectFileId' handler={Project} />
		<Route name='persistentDataCreate' path='/persistent-data-create/:projectFolderFileId/:projectFileId'
			   handler={PersistentDataCreate} />
		<Route name='persistentDataEntry' path='/persistent-data-entry/:projectFolderFileId/:projectFileId/:persistentDataFileId'
		 	   handler={PersistentDataEntry} /> 
		<DefaultRoute handler={Home} />
	</Route>
);

Router.run(routes, function (Handler) {
	React.render(<Handler/>, document.body);
});