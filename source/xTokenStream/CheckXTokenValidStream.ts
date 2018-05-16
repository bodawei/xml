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
import { ElementDeclaration, isXName, XNameList } from '../token/elementDeclaration';

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

type ElementDeclInfo = {
   token: ElementDeclaration,
   matcherType: 'EMPTY' | 'MIXED' | 'CHILDREN' | 'EMPTY',
   matcher: {
      [key: string]: any
   },
}

function setupContextCheck(context: ElementDeclInfo) {
   context.token.children.names.forEach((item) => {
      if (isXName(item)) {
         if (item.name && item.name.toLocaleUpperCase() !== '#PCDATA') {
            context.matcher[item.name] = true;
         }
      }
   });
}

class CheckXTokenValidStream extends stream.Transform {
   private queued: Array<ValidityError | XmlWarning>;
   private docType: XToken;
   private holding: boolean;
   private notations: { [name: string]: XToken };
   private attrDefsByElementName: ElementAttributes;
   private elementDeclarations: { [name: string]: ElementDeclInfo };
   private contentStack: Array<ElementDeclInfo>;
   private currentContext: ElementDeclInfo;

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

   push(...args: Array<any>) {
      super.push.apply(this, args);
   }

   _transform(xToken: XToken, _: string, done: StreamCallback) {
      const context = this.currentContext;

      if (context && context.matcherType === 'EMPTY') {
         if (!(xToken instanceof elementEnd.XToken)) {
            const error = new ValidityError(ValidityError.ID.CONTENT_IN_EMPTY_ELEMENT, [ this.currentContext.token.name ],
               xToken.pToken.open, xToken.pToken.open);

            this.queued.push(error);
         }
      } else if (context && context.matcherType === 'MIXED') {
         if (xToken instanceof elementStart.XToken || xToken instanceof elementStart.EmptyToken) {
            if (!context.matcher[xToken.name]) {
               const error = new ValidityError(ValidityError.ID.UNDECLARED_ELEMENT_IN_MIXED,
                  [ context.token.name, xToken.name ], xToken.pToken.open, xToken.pToken.open);

               this.queued.push(error);
            }
         } else if (xToken instanceof comment.XToken || xToken instanceof processingInstruction.XToken) {
            const commentOrPi = xToken instanceof comment.XToken ? 'comment' : 'processing instruction';
            const error = new ValidityError(ValidityError.ID.MIXED_XTRA_COMMENT_PI,
               [ context.token.name, commentOrPi ], xToken.pToken.open, xToken.pToken.open);

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
         this.validateAttListDecl(xToken);
      } else if (xToken instanceof elementDeclaration.XToken) {
         this.validateElementDecl(xToken);
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

   private validateAttListDecl(attListDecl: AttListXToken) {
      const openSToken = attListDecl.pToken.open;

      if (this.attrDefsByElementName[attListDecl.elementName]) {
         // should include location of previous
         const err = new XmlWarning(XmlWarning.ID.ATTLISTDECL_ELEMENT_DUPLICATE, [ attListDecl.elementName ],
            openSToken, openSToken);
         this.queued.push(err);
      }

      // §3.3: At user option, an XML processor may issue a warning if attributes are declared for
      //    an element type not itself declared, but this is not an error.
      // Note: This takes the position that if the element wasn't declared before this, it is a warning.
      // Conceivably this should wait until the end of the DTD and then make this assessment.
      if (!this.elementDeclarations[attListDecl.elementName]) {
         const err = new XmlWarning(XmlWarning.ID.ATTLISTDECL_NO_ELEMENTDECL,
            [ attListDecl.elementName ], openSToken, openSToken);
         this.queued.push(err);
      }

      const processedAttrDefs: AttrDefinitions = {
         token: attListDecl,
         attributes: {},
      };

      for (let index = 0; index < attListDecl.attDefs.length; index++) {
         processedAttrDefs.attributes[attListDecl.attDefs[index].name] = attListDecl.attDefs[index];
      }

      this.attrDefsByElementName[attListDecl.elementName] = processedAttrDefs;
   }

   private validateElementDecl(elDecl: ElementDeclaration): void {
      const openSToken = elDecl.pToken.open;
      let isMixed = false;

      // Validity Constraint: §3.2: Validity constraint: Unique Element Type Declaration
      //    An element type must not be declared more than once.
      if (this.elementDeclarations[elDecl.name]) {
         const err = new ValidityError(ValidityError.ID.ELEMENT_EXTRA_DECLARATION,
            [ elDecl.name ], openSToken, openSToken);
         this.queued.push(err);

         return;
      }

      // §3.2: At user option, an XML processor may issue a warning when a declaration mentions an
      //    element type for which no declaration is provided, but this is not an error.
      const childNamesMap = getNamesFromList(elDecl.children);
      const childNames = Object.keys(childNamesMap);
      for (let index = 0; index < childNames.length; index++) {
         const childName = childNames[index];

         if (childName.toLocaleUpperCase() === '#PCDATA') {
            isMixed = true;
            continue;
         }

         if (!this.elementDeclarations[childName]) {
            const err = new XmlWarning(XmlWarning.ID.ELEMENT_CHILD_UNDECLARED, [ elDecl.name, childNames[index] ],
               openSToken, openSToken);
            this.queued.push(err);
         }
      }

      this.elementDeclarations[elDecl.name] = {
         token: elDecl,
         matcherType: elDecl.contentSpecType === 'EMPTY' ? 'EMPTY' : 'CHILDREN',
         matcher: {},
      };
      if (elDecl.children && elDecl.children.names.length > 0 && isMixed) {
         this.elementDeclarations[elDecl.name].matcherType = 'MIXED',
         setupContextCheck(this.elementDeclarations[elDecl.name]);
      }
   }

   _checkelementStart(xToken: XToken) {
      const elemAttrsDef = this.attrDefsByElementName[xToken.name];
      const elementDecl = this.elementDeclarations[xToken.name];
      const attributes = xToken.attributes || [];

      if (elemAttrsDef) { // This must be required somewhere...
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

      if (!elementDecl) {
         return;
      }

      // Interoperability: §3.1: For interoperability, the empty-element tag should be
      //    used, and should only be used, for elements which are declared EMPTY.
      const tokenIsEmptyType = xToken instanceof elementStart.EmptyToken;
      const declarationIsEmpty = elementDecl.matcherType === 'EMPTY';
      let warningId;

      if (tokenIsEmptyType && !declarationIsEmpty) {
         warningId = XmlWarning.ID.ELEMENT_EMPTY_WITH_NONEMPTY_DECL;
      } else if (!tokenIsEmptyType && declarationIsEmpty) {
         warningId = XmlWarning.ID.ELEMENT_WITH_EMPTY_DECL;
      }

      if (warningId) {
         const warning = new XmlWarning(warningId, [ xToken.name ], xToken.pToken.open, xToken.pToken.open);
         this.queued.push(warning);
      }
   }
}

type NamesMap = { [elName: string]: true };

function getNamesFromList(children: XNameList): NamesMap {
   if (!children) {
      return {};
   }

   let childNames: NamesMap = {};
   for (let index = 0; index < children.names.length; index++) {
      const child = children.names[index];

      if (isXName(child)) {
         childNames[child.name] = true;
      } else {
         childNames = Object.assign(childNames, getNamesFromList(child)) as NamesMap;
      }
   }

   return childNames;
};


export default CheckXTokenValidStream;
