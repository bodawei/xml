const path = require('path');

const deriveLocale = require('./deriveLocale.js');

const SOURCE_LOCALE_DIR = path.join(__dirname, '../../source/error/locale/');
const SOURCE_DERIVED_DIR = path.join(__dirname, '../../source/error/derive/');

deriveLocale({
   sourceDir: SOURCE_LOCALE_DIR,
   destDir: SOURCE_DERIVED_DIR,
});

const NEW_VALIDITY_SOURCE = path.join(__dirname, '../../source/valid/error/locale/');
const NEW_VALIDITY_DERIVED = path.join(__dirname, '../../source/valid/error/derive/');

deriveLocale({
   sourceDir: NEW_VALIDITY_SOURCE,
   destDir: NEW_VALIDITY_DERIVED,
});
