/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

const StringBundle = require('../Basic/StringBundle.js');
const XmlError = require('./XmlError.js');
const strings = require('../derive/XmlWarning.json');
const codes = require('../derive/XmlWarning-code.json');

/**********************************************************************\
 XmlWarning is used to report messages that are not fatal in nature.
\**********************************************************************/

class XmlWarning extends XmlError {
}

XmlWarning.ID = {};
XmlWarning.CODE = codes;
XmlWarning.STRING = new StringBundle(strings);

for (const key in strings.base) {
   XmlWarning.ID[key] = key;
}

module.exports = XmlWarning;
