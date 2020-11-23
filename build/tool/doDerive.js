const path = require('path');


const deriveLocale = require('./deriveLocale.js');

const SOURCE_LOCALE_DIR = path.join(__dirname, '../../source/error/locale/');
const SOURCE_DERIVED_DIR = path.join(__dirname, '../../source/error/derive/');

deriveLocale({
   sourceDir: SOURCE_LOCALE_DIR,
   destDir: SOURCE_DERIVED_DIR,
});
