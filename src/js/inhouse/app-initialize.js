require('./app-config.js');
require('./toast-renderer.js');
require('./intention-type.js');
require('./intention-handler.js');
require('./route-setup.jsx');

var IntentionType = require('./intention-type.js');

var intention = {};
intention.type = IntentionType.USER_LOG_IN;
Bullet.trigger('App>>intention-submitted', intention);