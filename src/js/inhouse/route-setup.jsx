window.Router = ReactRouter;
window.Link = Router.Link;
window.Navigation = Router.Navigation;
window.State = Router.State;
var Route = Router.Route, DefaultRoute = Router.DefaultRoute,
  Link=Router.Link, RouteHandler = Router.RouteHandler;
var App = require('./ui-components/app.jsx');
var Home = require('./ui-components/home/home.jsx');
var Projects = require('./ui-components/projects/projects.jsx');
var Project = require('./ui-components/project/project.jsx');
var PersistentDataEntryForm = require('./ui-components/persistent-data-entry-form/persistent-data-entry-form.jsx');

//setting '/project/persistent-data-entry-form/...' or similar links to the Project handler
var routes = (
	<Route name='home' path='/' handler={App}>
		<Route name='projects' path='projects' handler={Projects}></Route>
		<Route name='project' path='/project/:projectFolderFileId/:projectFileId' handler={Project} />
		<Route name='persistent-data-entry-form' path='/persistent-data-entry-form/:persistentDataFileId'
		 handler={PersistentDataEntryForm} /> 
		<DefaultRoute handler={Home} />
	</Route>
);

Router.run(routes, function (Handler) {
	React.render(<Handler/>, document.body);
});