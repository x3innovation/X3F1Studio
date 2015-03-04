window.Router = ReactRouter;
window.Link = Router.Link;
window.Navigation = Router.Navigation;
window.State = Router.State;
var Route = Router.Route, DefaultRoute = Router.DefaultRoute,
  Link=Router.Link, RouteHandler = Router.RouteHandler;
var App = require('./ui-components/app.jsx');
var Home = require('./ui-components/home/home.jsx');
var Project = require('./ui-components/project/project.jsx');

var routes = (
	<Route name="home" path="/" handler={App}>
		<Route name="project" path="/project" handler={Project} />
		<DefaultRoute handler={Home} />
	</Route>
);

Router.run(routes, function (Handler) {
	React.render(<Handler/>, document.body);
});