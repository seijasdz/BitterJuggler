require('dotenv').config();//instatiate environment variables

CONFIG = {} //Make this global to use all over the application

CONFIG.app          = process.env.APP   || 'development';
CONFIG.port         = process.env.PORT  || '5000';

CONFIG.db_dialect   = process.env.DB_DIALECT    || 'mongo';
CONFIG.db_host      = process.env.DB_HOST       || '127.0.0.1';
CONFIG.db_port      = process.env.DB_PORT       || '27017';
CONFIG.db_name      = process.env.DB_NAME       || 'rfid';
CONFIG.db_user      = process.env.DB_USER       || 'zippyttech';
CONFIG.db_password  = process.env.DB_PASSWORD   || '123456';

CONFIG.jwt_encryption  = process.env.JWT_ENCRYPTION || 'secret';
CONFIG.jwt_expiration  = process.env.JWT_EXPIRATION || '10000';

CONFIG.operationPostUrl = process.env.POST_URL || 'http://127.0.0.1:3300/v1/test/';
CONFIG.preOperationPostUrl = process.env.PRE_POST_URL || 'http://127.0.0.1:3300/v1/test/';


CONFIG.amqpCompleteURI = process.env.AMQP_COMPLETE_URI || 'amqp://normal:normal@127.0.0.1:5672'

CONFIG.tagIgnore = process.env.ANTENNA_TAG_IGNORE || 600; // segundos
CONFIG.sendTimeout = process.env.ANTENNA_SEND_TIMEOUT || 2000; // miliseconds

CONFIG.wait = process.env.WAIT || 10;
CONFIG.old_tag_difference = process.env.OLD_TAG_DIFFERENCE || 20;
CONFIG.milliseconds_till_request = process.env.MILLISECONDS_TILL_REQUEST || 5000;
CONFIG.use_log = process.env.USE_LOG || true;
CONFIG.log_file = process.env.LOG_FILE || '/home/zippyttech/log.txt';


module.exports.CONFIG = CONFIG;
