/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */

import stream from 'readable-stream';

import { ValidityError, XmlWarning } from '../error';

import {
   attListDeclaration,
   docTypeStart,
   elementStart,
   notationDeclaration,
} from '../token';

class CheckXTokenValidStream extends stream.Transform {

   /* istanbul ignore next */ // Istanbul is confused by node transpilation
   constructor() {
      super({
         objectMode: true,
      });

      this._queued = [];
      this._docType = undefined;
      this._holding = false;
      this._notations = {};
      this._attrDefsByElementName = {};
   }

   _transform(xToken, _, done) {
      if (xToken instanceof notationDeclaration.XToken) {
         if (this._notations[xToken.name]) {
            this._queued.push(new ValidityError(ValidityError.ID.NOTATION_NOT_UNIQUE, [ xToken.name ],
               xToken.pToken.open, xToken.pToken.open));
         } else {
            this._notations[xToken.name] = xToken;
         }
      } else if (xToken instanceof attListDeclaration.XToken) {
         this._validateAttListDecl(xToken);
      } else if (xToken instanceof docTypeStart.XToken) {
         this._docType = xToken;
         this._holding = true;
      } else if (!this._seenRoot && xToken instanceof elementStart.XToken) {
         if (xToken.name !== this._docType.name) {
            this._queued.unshift(
               new ValidityError(ValidityError.ID.MISMATCH_ROOT_ELEMENT_TYPE, [ this._docType.name, xToken.name ],
                  this._docType.pToken.open, this._docType.pToken.open));
         }
         this._holding = false;
      }

      if (this._holding) {
         this._queued.push(xToken);
      } else {
         let token = this._queued.shift();

         while (token) {
            this.push(token);
            token = this._queued.shift();
         }

         this.push(xToken);
      }

      done();
   }

   _flush(done) {
      let token = this._queued.shift();

      while (token) {
         this.push(token);
         token = this._queued.shift();
      }
      done();
   }

   _validateAttListDecl(alDecl) {
      if (this._attrDefsByElementName[alDecl.elementName]) {
         // should include location of previous
         const err = new XmlWarning(XmlWarning.ID.ATTLISTDECL_ELEMENT_DUPLICATE, [ alDecl.elementName ],
            alDecl.pToken.elementName, alDecl.pToken.open);
         this._queued.push(err);
      }

      this._attrDefsByElementName[alDecl.elementName] = alDecl;
   }

}

export default CheckXTokenValidStream;
