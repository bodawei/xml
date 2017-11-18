/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

import StringBundle from '../basic/StringBundle.js';
import XmlError from './XmlError.js';
import strings from './derive/XmlWarning.json';
import codes from './derive/XmlWarning-code.json';

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
