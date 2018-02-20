/* Copyright ® 2018 by David John Burrowes. All rights reserved. */

import stream from 'readable-stream';

import tokenNs from '../token';

const ATTR_TYPES = [ 'CDATA', 'ID', 'IDREF', 'IDREFS', 'ENTITY', 'ENTITIES', 'NMTOKEN', 'NMTOKENS', 'NOTATION' ];
const DEFAULT_TYPES = [ '#FIXED', '#REQUIRED', '#IMPLIED' ];

/**********************************************************************\
 A simple stream that forces malformed XTokens to be correct.

 The basic PTokenStream and PToXTokenStream will (deliberately) allow
 one to construct invalid tokens. For example:
   <!ATTLIST myElement
      attr1 BOGUS #REQUIRED>
 will produce an XToken with a type of "BOGUS" if one has set the
 streams up in a "lax" mode (in strict mode, the first error
 encountered ends the stream so this will never get produced).
\**********************************************************************/

class FixingStream extends stream.Transform {

   /* istanbul ignore next */ // Istanbul is confused by node transpilation
   constructor() {
      super({
         objectMode: true,
      });
   }

   _transform(token, encoding, callback) {
      if (token instanceof tokenNs.attListDeclaration.XToken) {
         adjustAttListDeclaration(token);
      }

      this.push(token);

      callback();
   }

}

function adjustAttListDeclaration(token) {
   for (let index = 0; index < token.attDefs.length; index++) {
      const attDef = token.attDefs[index];
      const capType = (attDef.type || '').toLocaleUpperCase();
      const capDefType = (attDef.defaultType || '').toLocaleUpperCase();

      if (capType !== attDef.type) {
         attDef.type = capType;
      }

      if (ATTR_TYPES.indexOf(capType) === -1) {
         attDef.type = 'CDATA';
      }

      if (capDefType !== attDef.defaultType) {
         attDef.defaultType = capDefType;
      }

      if (capDefType !== '' && DEFAULT_TYPES.indexOf(capDefType) === -1) {
         attDef.defaultType = '#IMPLIED';
      }
   }
}

export default FixingStream;
