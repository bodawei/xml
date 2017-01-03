/* Copyright ® 2016-2017 by David John Burrowes. All rights reserved. */

'use strict';

const StringBundle = require('../shared/StringBundle.js');
const XmlError = require('./XmlError.js');
const strings = require('../derive/WellFormednessError.json');
const codes = require('../derive/WellFormednessError-code.json');

class WellFormednessError extends XmlError {
}

WellFormednessError.ID = {};
WellFormednessError.CODE = codes;
WellFormednessError.STRING = new StringBundle(strings);

for (const key in strings.base) {
   WellFormednessError.ID[key] = key;
}

module.exports = WellFormednessError;
