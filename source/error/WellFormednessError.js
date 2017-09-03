/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

const StringBundle = require('../Basic/StringBundle.js');
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
