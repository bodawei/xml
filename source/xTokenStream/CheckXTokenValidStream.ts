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
import { AttListXToken, XAttr } from '../token/attListDeclaration';

type XToken = {
   name: string,
   [name: string]: any,
};

type StreamCallback = (value?: object) => void;

type ElementAttributes = {
   [elementName: string]: AttrDefinitions,
};

type AttrDefinitions = {
   token: AttListXToken,
   attributes: {
      [attrName: string]: XAttr,
   },
}

function setupContextCheck(xToken: XToken) {
   xToken.matcherType = 'MIXED';
   xToken.matcher = {};

   xToken.children.names.forEach((item) => {
      if (item.name && item.name.toLocaleUpperCase() !== '#PCDATA') {
         xToken.matcher[item.name] = true;
      }
   });
}

class CheckXTokenValidStream extends stream.Transform {
   private queued: Array<ValidityError | XmlWarning>;
   private docType: XToken;
   private holding: boolean;
   private notations: { [name: string]: XToken };
   private attrDefsByElementName: ElementAttributes;
   private elementDeclarations: { [name: string]: XToken };
   private contentStack: Array<XToken>;
   private currentContext: XToken;

   /* istanbul ignore next */ // Istanbul is confused by node transpilation
   constructor() {
      super({
         objectMode: true,
      });

      this.queued = [];
      this.docType = undefined;
      this.holding = false;
      this.notations = {};
      this.attrDefsByElementName = {};
      this.elementDeclarations = {};
      this.contentStack = [];
      this.currentContext = undefined;
   }

   _transform(xToken: XToken, _: string, done: StreamCallback) {
      const context = this.currentContext || {};

      if (context.contentSpecType === 'EMPTY') {
         if (!(xToken instanceof elementEnd.XToken)) {
            const error = new ValidityError(ValidityError.ID.CONTENT_IN_EMPTY_ELEMENT, [ this.currentContext.name ],
               xToken.pToken.open, xToken.pToken.open);

            this.queued.push(error);
         }
      } else if (context.matcherType === 'MIXED') {
         if (xToken instanceof elementStart.XToken || xToken instanceof elementStart.EmptyToken) {
            if (!context.matcher[xToken.name]) {
               const error = new ValidityError(ValidityError.ID.UNDECLARED_ELEMENT_IN_MIXED,
                  [ context.name, xToken.name ], xToken.pToken.open, xToken.pToken.open);

               this.queued.push(error);
            }
         } else if (xToken instanceof comment.XToken || xToken instanceof processingInstruction.XToken) {
            const commentOrPi = xToken instanceof comment.XToken ? 'comment' : 'processing instruction';
            const error = new ValidityError(ValidityError.ID.MIXED_XTRA_COMMENT_PI,
               [ context.name, commentOrPi ], xToken.pToken.open, xToken.pToken.open);

            this.queued.push(error);
         }
      }

      if (xToken instanceof notationDeclaration.XToken) {
         if (this.notations[xToken.name]) {
            this.queued.push(new ValidityError(ValidityError.ID.NOTATION_NOT_UNIQUE, [ xToken.name ],
               xToken.pToken.open, xToken.pToken.open));
         } else {
            this.notations[xToken.name] = xToken;
         }
      } else if (xToken instanceof attListDeclaration.XToken) {
         this._validateAttListDecl(xToken);
      } else if (xToken instanceof elementDeclaration.XToken) {
         this.elementDeclarations[xToken.name] = xToken;
         if (xToken.children && xToken.children.names.length > 0
            && xToken.children.names[0].name.toLocaleUpperCase() === '#PCDATA') {
            setupContextCheck(xToken);
         }
      } else if (xToken instanceof docTypeStart.XToken) {
         this.docType = xToken;
         this.holding = true;
      } else if (xToken instanceof elementStart.XToken || xToken instanceof elementStart.EmptyToken) {
         // if (!this._seenRoot) {
         if (this.docType && xToken.name !== this.docType.name) {
            this.queued.unshift(
               new ValidityError(ValidityError.ID.MISMATCH_ROOT_ELEMENT_TYPE, [ this.docType.name, xToken.name ],
                  this.docType.pToken.open, this.docType.pToken.open));
         }
         this.holding = false;
         // }

         this.currentContext = this.elementDeclarations[xToken.name];
         this.contentStack.push(this.currentContext);

         if (this.currentContext && this.currentContext.contentSpecType === 'EMPTY'
            && xToken instanceof elementStart.XToken) {
            const warning = new XmlWarning(XmlWarning.ID.INTEROP_USE_EMPTY, [ xToken.name ],
               xToken.pToken.open, xToken.pToken.open);
            this.queued.push(warning);
         }

         this._checkelementStart(xToken);
      } else if (xToken instanceof elementEnd.XToken) {
         this.contentStack.pop();
         this.currentContext = this.contentStack[this.contentStack.length - 1];
      }

      if (this.holding) {
         this.queued.push(xToken);
      } else {
         let token = this.queued.shift();

         while (token) {
            this.push(token);
            token = this.queued.shift();
         }

         this.push(xToken);
      }

      done();
   }

   _flush(done: StreamCallback) {
      let token = this.queued.shift();

      while (token) {
         this.push(token);
         token = this.queued.shift();
      }
      done();
   }

   _validateAttListDecl(attrList: AttListXToken) {
      if (this.attrDefsByElementName[attrList.elementName]) {
         // should include location of previous
         const err = new XmlWarning(XmlWarning.ID.ATTLISTDECL_ELEMENT_DUPLICATE, [ attrList.elementName ],
            attrList.pToken.elementName, attrList.pToken.open);
         this.queued.push(err);
      }

      const processedAttrDefs: AttrDefinitions = {
         token: attrList,
         attributes: {},
      };

      for (let index = 0; index < attrList.attDefs.length; index++) {
         processedAttrDefs.attributes[attrList.attDefs[index].name] = attrList.attDefs[index];
      }

      this.attrDefsByElementName[attrList.elementName] = processedAttrDefs;
   }

   _checkelementStart(xToken: XToken) {
      const elemAttrsDef = this.attrDefsByElementName[xToken.name];
      const attributes = xToken.attributes || [];

      if (!elemAttrsDef) { // This must be required somewhere...
         return;
      }

      // Validity Constraint: §3.1: Validity constraint: Attribute Value Type
      //    The attribute must have been declared; the value must be of
      //    the type declared for it.
      for (let index = 0; index < attributes.length; index++) {
         const attrName = attributes[index].name || '';
         const pToken = xToken.pToken;

         if (!elemAttrsDef.attributes[attrName]) {
            const err = new ValidityError(ValidityError.ID.ELEMENTSTART_UNDECLARED_ATTRIBUTE,
               [ xToken.name, attrName ], pToken.open, pToken.open);
            this.queued.push(err);
         }
      }
   }
}

export default CheckXTokenValidStream;
