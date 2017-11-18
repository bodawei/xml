/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

import StringBundle from '../basic/StringBundle.js';
import XmlError from './XmlError.js';
import strings from './derive/WellFormedError.json';
import codes from './derive/WellFormedError-code.json';

/**********************************************************************\
 WellFormedError holds inforamtion about a syntax error
\**********************************************************************/

class WellFormedError extends XmlError {
}

WellFormedError.ID = {};
WellFormedError.CODE = codes;
WellFormedError.STRING = new StringBundle(strings);

for (const key in strings.base) {
   WellFormedError.ID[key] = key;
}

module.exports = WellFormedError;
