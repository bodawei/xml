/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

/**********************************************************************\
 XmlError is a base type for all error objects.  It is a subtype of
 Error, but other than that it has no purpose except to be a common
 marker for all Xml-related errors.
\**********************************************************************/

function XmlError() {
}

XmlError.prototype = new Error();

module.exports = XmlError;
