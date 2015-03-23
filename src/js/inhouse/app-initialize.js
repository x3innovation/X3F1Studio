require('./app-config.js');
require('./utils/toast-renderer.js');

// user log in on app start up
var userService = require('./services/user-service.js');
userService.logIn();

require('./route-setup.jsx');