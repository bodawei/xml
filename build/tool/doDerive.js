const path = require('path');

const deriveLocale = require('./deriveLocale.js');

const SOURCE_LOCALE_DIR = path.join(__dirname, '../../source/wellformedness/error/locale/');
const SOURCE_DERIVED_DIR = path.join(__dirname, '../../source/wellformedness/error/derive/');

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

const NEW_WARNING_SOURCE = path.join(__dirname, '../../source/basic/locale/');
const NEW_WARNING_DERIVED = path.join(__dirname, '../../source/basic/derive/');

deriveLocale({
   sourceDir: NEW_WARNING_SOURCE,
   destDir: NEW_WARNING_DERIVED,
});
