/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

const StringBundle = require('../basic/StringBundle.js');
const XmlError = require('./XmlError.js');
const strings = require('../derive/SyntaxError.json');
const codes = require('../derive/SyntaxError-code.json');

/**********************************************************************\
 SyntaxError holds inforamtion about a syntax error
\**********************************************************************/

class SyntaxError extends XmlError {
}

SyntaxError.ID = {};
SyntaxError.CODE = codes;
SyntaxError.STRING = new StringBundle(strings);

for (const key in strings.base) {
   SyntaxError.ID[key] = key;
}

module.exports = SyntaxError;
