/* Copyright ® 2016-2017 by David John Burrowes. All rights reserved. */

'use strict';

const StringBundle = require('../shared/StringBundle.js');
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
