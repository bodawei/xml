/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

import StringBundle from '../basic/StringBundle.js';
import XmlError from './XmlError.js';
import strings from '../derive/ValidityError.json';
import codes from '../derive/ValidityError-code.json';

/**********************************************************************\
 ValidityError holds inforamtion about a validity check error
\**********************************************************************/

class ValidityError extends XmlError {
}

ValidityError.ID = {};
ValidityError.CODE = codes;
ValidityError.STRING = new StringBundle(strings);

for (const key in strings.base) {
   ValidityError.ID[key] = key;
}

export default ValidityError;
