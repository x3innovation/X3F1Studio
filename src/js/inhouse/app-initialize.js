require('./app-config.js');
require('./utils/toast-renderer.js');
require('./constants/intention-type.js');
require('./utils/intention-handler.js');
require('./route-setup.jsx');

var IntentionType = require('./constants/intention-type.js');
var EventType = require('./constants/event-type.js');

var intention = {};
intention.type = IntentionType.USER_LOG_IN;
Bullet.trigger(EventType.App.SUBMIT_INTENTION, intention);