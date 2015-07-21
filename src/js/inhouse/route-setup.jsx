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

var PersistentDataCreate = require('./ui-components/entry-forms/persistent-data/create.jsx');
var PersistentDataEntry = require('./ui-components/entry-forms/persistent-data/entry.jsx');
var EnumCreate = require('./ui-components/entry-forms/enum/create.jsx');
var EnumEntry = require('./ui-components/entry-forms/enum/entry.jsx');
var SnippetCreate = require('./ui-components/entry-forms/snippet/create.jsx');
var SnippetEntry = require('./ui-components/entry-forms/snippet/entry.jsx');
var EventCreate = require('./ui-components/entry-forms/event/create.jsx');
var EventEntry = require('./ui-components/entry-forms/event/entry.jsx');

var routes = (
	<Route name='home' path='/' handler={App}>
		<Route name='projects' path='/projects' handler={Projects} />
		<Route name='project' path='/project/:projectFolderFileId/:projectFileId' handler={Project} />
		<Route name='persistentDataCreate' path='/create-persistent-data/:projectFolderFileId/:projectFileId' handler={PersistentDataCreate} />
		<Route name='persistentDataEntry' path='/persistent-data-entry/:projectFolderFileId/:projectFileId/:fileId' handler={PersistentDataEntry} /> 
		<Route name='enumCreate' path='/create-enum/:projectFolderFileId/:projectFileId' handler={EnumCreate} />
		<Route name='enumEntry' path='/enum-entry/:projectFolderFileId/:projectFileId/:fileId' handler={EnumEntry} /> 
		<Route name='snippetCreate' path='/create-snippet/:projectFolderFileId/:projectFileId' handler={SnippetCreate} />
		<Route name='snippetEntry' path='/snippet-entry/:projectFolderFileId/:projectFileId/:fileId' handler={SnippetEntry} /> 
		<Route name='eventCreate' path='/create-event/:projectFolderFileId/:projectFileId' handler={EventCreate} />
		<Route name='eventEntry' path='/event-entry/:projectFolderFileId/:projectFileId/:fileId' handler={EventEntry} /> 
		<DefaultRoute handler={Home} />
	</Route>
);

Router.run(routes, function (Handler) {
	React.render(<Handler/>, document.body);
});