/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */

import stream from 'readable-stream';

import { ValidityError, XmlWarning } from '../error';

import {
   comment,
   elementDeclaration,
   attListDeclaration,
   docTypeStart,
   elementStart,
   elementEnd,
   notationDeclaration,
   processingInstruction,
} from '../token';

function setupContextCheck(xToken) {
   xToken.matcherType = 'MIXED';
   xToken.matcher = {};

   xToken.children.names.forEach((item) => {
      if (item.name && item.name.toLocaleUpperCase() !== '#PCDATA') {
         xToken.matcher[item.name] = true;
      }
   });
}

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
      this._elementDeclarations = {};
      this._contentStack = [];
      this._currentContext = undefined;
   }

   _transform(xToken, _, done) {
      const context = this._currentContext || {};

      if (context.contentSpecType === 'EMPTY') {
         if (!(xToken instanceof elementEnd.XToken)) {
            const error = new ValidityError(ValidityError.ID.CONTENT_IN_EMPTY_ELEMENT, [ this._currentContext.name ],
               xToken.pToken.open, xToken.pToken.open);

            this._queued.push(error);
         }
      } else if (context.matcherType === 'MIXED') {
         if (xToken instanceof elementStart.XToken || xToken instanceof elementStart.EmptyToken) {
            if (!context.matcher[xToken.name]) {
               const error = new ValidityError(ValidityError.ID.UNDECLARED_ELEMENT_IN_MIXED,
                  [ context.name, xToken.name ], xToken.pToken.open, xToken.pToken.open);

               this._queued.push(error);
            }
         } else if (xToken instanceof comment.XToken || xToken instanceof processingInstruction.XToken) {
            const commentOrPi = xToken instanceof comment.XToken ? 'comment' : 'processing instruction';
            const error = new ValidityError(ValidityError.ID.MIXED_XTRA_COMMENT_PI,
               [ context.name, commentOrPi ], xToken.pToken.open, xToken.pToken.open);

            this._queued.push(error);
         }
      }

      if (xToken instanceof notationDeclaration.XToken) {
         if (this._notations[xToken.name]) {
            this._queued.push(new ValidityError(ValidityError.ID.NOTATION_NOT_UNIQUE, [ xToken.name ],
               xToken.pToken.open, xToken.pToken.open));
         } else {
            this._notations[xToken.name] = xToken;
         }
      } else if (xToken instanceof attListDeclaration.XToken) {
         this._validateAttListDecl(xToken);
      } else if (xToken instanceof elementDeclaration.XToken) {
         this._elementDeclarations[xToken.name] = xToken;
         if (xToken.children && xToken.children.names.length > 0
            && xToken.children.names[0].name.toLocaleUpperCase() === '#PCDATA') {
            setupContextCheck(xToken);
         }
      } else if (xToken instanceof docTypeStart.XToken) {
         this._docType = xToken;
         this._holding = true;
      } else if (xToken instanceof elementStart.XToken || xToken instanceof elementStart.EmptyToken) {
         // if (!this._seenRoot) {
         if (this._docType && xToken.name !== this._docType.name) {
            this._queued.unshift(
               new ValidityError(ValidityError.ID.MISMATCH_ROOT_ELEMENT_TYPE, [ this._docType.name, xToken.name ],
                  this._docType.pToken.open, this._docType.pToken.open));
         }
         this._holding = false;
         // }

         this._currentContext = this._elementDeclarations[xToken.name];
         this._contentStack.push(this._currentContext);

         if (this._currentContext && this._currentContext.contentSpecType === 'EMPTY'
            && xToken instanceof elementStart.XToken) {
            const warning = new XmlWarning(XmlWarning.ID.INTEROP_USE_EMPTY, [ xToken.name ],
               xToken.pToken.open, xToken.pToken.open);
            this._queued.push(warning);
         }
      } else if (xToken instanceof elementEnd.XToken) {
         this._contentStack.pop();
         this._currentContext = this._contentStack[this._contentStack.length - 1];
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
