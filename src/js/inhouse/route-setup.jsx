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
var Editor = require('./ui-components/entry-forms/editor.jsx');

var routes = (
	<Route name='home' path='/' handler={App}>
		<Route name='projects' path='/projects' handler={Projects} />
		<Route name='project' path='/project/:projectFolderFileId/:projectFileId' handler={Project} />
		<Route name='editor' path='/editor/:fileType/:projectFolderFileId/:projectFileId/:fileId' handler={Editor} />

		<DefaultRoute handler={Home} />
	</Route>
);

Router.run(routes, function (Handler) {
	React.render(<Handler/>, document.body);
});