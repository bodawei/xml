/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { ValidityError, XmlWarning } from '../../error';
import { SToken } from '../../sToken';
import {
   attListDeclaration,
   comment,
   docTypeStart,
   elementStart,
   elementEnd,
   elementDeclaration,
   notationDeclaration,
   processingInstruction,
   xmlDeclaration,
} from '../../token';

import CheckXTokenValidStream from '../CheckXTokenValidStream';


function toHaveError(util) {
   return {
      compare: (actual, expected) => {
         let Constructor = expected instanceof XmlWarning ? XmlWarning : ValidityError;
         let pass = false;
         let message;

         actual.forEach((token) => {
            if (token instanceof Constructor) {
               pass = pass || util.equals(token, expected);
            }
         });

         if (pass) {
            message = `Expected not to find "${JSON.stringify(expected, undefined, 2)}".`;
         } else {
            message = `Expected to find "${JSON.stringify(expected, undefined, 2)}". Instead found ${console.json(actual)}.`;
         }

         return {
            pass: pass,
            message: message,
         };
      },
   };
}

function toBeErrorFree() {
   return {
      compare: (actual, expected) => {
         let error;
         let message;

         actual.forEach((token) => {
            if (token instanceof XmlWarning || token instanceof ValidityError) {
               error = token;
            }
         });

         if (!error) {
            message = `Expected to find one or more XmlErrors.`;
         } else {
            message = `Expected to find no XmlErrors, but found ${error.message}.`;
         }

         return {
            pass: !error,
            message: message,
         };
      },
   };
}

beforeEach(() => {
   jasmine.addMatchers({
      toHaveError,
      toBeErrorFree,
   });
});

describe('CheckXTokenValidStream (unit)', () => {
   let validator;

   beforeEach(() => {
      validator = new CheckXTokenValidStream();
   });

   function gatherTokens(stream, cb) {
      const tokens = [];

      stream.on('data', (item) => {
         tokens.push(item);
      });
      stream.on('end', () => {
         cb(tokens);
      });
   }

   function expectStream(validator, expected, done) {
      gatherTokens(validator, (tokens) => {
         expect(tokens).toHaveError(expected);
         done();
      });
   }

   function expectNoErrors(validator, done) {
      gatherTokens(validator, (tokens) => {
         expect(tokens).toBeErrorFree();
         done();
      });
   }

   describe('_transform', () => {

      beforeEach(() => {
      });

      it('passes initial tokens through', () => {
         const xmlDecl = new xmlDeclaration.XToken([], []);
         validator.write(xmlDecl);

         expect(validator.read()).toEqual(xmlDecl);
      });

      it('resumes passing through when encountering an elementStart after docTypeStart', () => {
         const dtStart = new docTypeStart.XToken('foo', undefined, false, []);
         const elStart = new elementStart.XToken('foo', undefined, []);

         validator.write(dtStart);
         validator.write(elStart);

         expect(validator.read()).toEqual(dtStart);
         expect(validator.read()).toEqual(elStart);
      });

      it('resumes passing through if end of stream reached', () => {
         const dtStart = new docTypeStart.XToken('foo', undefined, false, []);

         validator.write(dtStart);
         validator.end();

         expect(validator.read()).toEqual(dtStart);
      });

      it('adds an error if the DOCTYPE name and the element start name do not match', () => {
         const dtStart = new docTypeStart.XToken('docTypeName', undefined, false, []);
         const elStart = new elementStart.XToken('elementName', undefined, []);

         validator.write(dtStart);
         validator.write(elStart);

         expect(validator.read()).toEqual(dtStart);
         expect(validator.read()).toEqual(new ValidityError(ValidityError.ID.MISMATCH_ROOT_ELEMENT_TYPE,
            [ 'docTypeName', 'elementName' ]));
      });

      it('adds an error if the NOTATION name shows up more than once', () => {
         const nOne = new notationDeclaration.XToken('one', undefined, []);
         const nTwo = new notationDeclaration.XToken('one', undefined, []);

         validator.write(nOne);
         validator.write(nTwo);

         expect(validator.read()).toEqual(nOne);
         expect(validator.read()).toEqual(new ValidityError(ValidityError.ID.NOTATION_NOT_UNIQUE, [ 'one' ]));
         expect(validator.read()).toEqual(nTwo);
      });

      describe('element content', () => {

         it('reports an error if anything appears in an element declared to be EMPTY', (done) => {
            const elementDecl = new elementDeclaration.XToken('one', 'EMPTY', undefined, {});
            const elStart = new elementStart.XToken('one', [], {});
            const elTwo = new elementStart.XToken('one', [], {});

            validator.write(elementDecl);
            validator.write(elStart);
            validator.write(elTwo);
            validator.end();

            const expected = new ValidityError(ValidityError.ID.CONTENT_IN_EMPTY_ELEMENT, [ 'one' ]);
            expectStream(validator, expected, done);
         });

         it('reports no error if only an empty tag appears in an EMPTY element', (done) => {
            const elementDecl = new elementDeclaration.XToken('one', 'EMPTY', undefined, {});
            const elStart = new elementStart.EmptyToken('one', [], {});

            validator.write(elementDecl);
            validator.write(elStart);
            validator.end();

            gatherTokens(validator, (tokens) => {
               expect(tokens.length).toEqual(2);
               done();
            });
         });

         it('reports no error if only a start and end tag are used an EMPTY element', (done) => {
            const elementDecl = new elementDeclaration.XToken('one', 'EMPTY', undefined, {});
            const elStart = new elementStart.XToken('one', [], {});
            const elEnd = new elementEnd.XToken('one', {});

            validator.write(elementDecl);
            validator.write(elStart);
            validator.write(elEnd);
            validator.end();

            gatherTokens(validator, (tokens) => {
               expect(tokens.length).toEqual(4);
               done();
            });
         });

         describe('mixed content', () => {

            it('reports an error if any element start appears in a PCDATA-only element', (done) => {
               const elementDecl = new elementDeclaration.XToken('one', 'CHILDREN', {
                  names: [{
                     name: '#PCDATA',
                     repeat: 'ONE'
                  }]
               }, {});
               const elStart = new elementStart.XToken('one', [], {});
               const child = new elementStart.XToken('sub', [], {});
   
               validator.write(elementDecl);
               validator.write(elStart);
               validator.write(child);
               validator.end();
   
               const expected = new ValidityError(ValidityError.ID.UNDECLARED_ELEMENT_IN_MIXED, [ 'one', 'sub' ]);
               expectStream(validator, expected, done);
            });


            it('reports an error if one child element does not match any of the defined ones', (done) => {
               const elementDecl = new elementDeclaration.XToken('one', 'CHILDREN', {
                  names: [{
                     name: '#PCDATA',
                     repeat: 'ONE'
                  }, {
                     name: 'one',
                     repeat: 'ONE'
                  }, {
                     name: 'two',
                     repeat: 'ONE'
                  }]
               }, {});
               const elStart = new elementStart.XToken('one', [], {});
               const elEnd = new elementEnd.XToken('one', [], {});
               const child = new elementStart.XToken('two', [], {});
               const childEnd = new elementEnd.XToken('two', [], {});
               const thirdStart = new elementStart.XToken('three', [], {});

               validator.write(elementDecl);
               validator.write(elStart);
               validator.write(elStart);
               validator.write(elEnd);
               validator.write(child);
               validator.write(childEnd);
               validator.write(thirdStart);
               validator.end();
   
               const expected = new ValidityError(ValidityError.ID.UNDECLARED_ELEMENT_IN_MIXED, [ 'one', 'three' ]);
               expectStream(validator, expected, done);
            });

            it('reports an error if there is a comment found in mixed content in an old version', (done) => {
               const elementDecl = new elementDeclaration.XToken('one', 'CHILDREN', {
                  names: [{
                     name: '#PCDATA',
                     repeat: 'ONE'
                  }]
               }, {});
               const commentToken = new comment.XToken('stuff', {});
               const elStart = new elementStart.XToken('one', [], {});

               validator.write(elementDecl);
               validator.write(elStart);
               validator.write(commentToken);
               validator.end();
   
               const expected = new ValidityError(ValidityError.ID.MIXED_XTRA_COMMENT_PI, [ 'one', 'comment' ]);
               expectStream(validator, expected, done);
            });

            it('reports an error if there is a processing instruction found in mixed content in an old version', (done) => {
               const elementDecl = new elementDeclaration.XToken('one', 'CHILDREN', {
                  names: [{
                     name: '#PCDATA',
                     repeat: 'ONE'
                  }]
               }, {});
               const pi = new processingInstruction.XToken('stuff', undefined, {});
               const elStart = new elementStart.XToken('one', [], {});

               validator.write(elementDecl);
               validator.write(elStart);
               validator.write(pi);
               validator.end();
   
               const expected = new ValidityError(ValidityError.ID.MIXED_XTRA_COMMENT_PI, [ 'one', 'processing instruction' ]);
               expectStream(validator, expected, done);
            });

         });

      });
   
   });

   describe('write()', () => {

      describe('ElementStart tokens', () => {
         let attListDecl;

         beforeEach(() => {
            attListDecl = new attListDeclaration.XToken('one', [{
               name: 'first',
               type: 'CDATA',
               defaultType: 'yoiks',
            }], {});
         });

         it('reports no error if the attribute is in the ATTLIST', (done) => {
            const elementDecl = new elementDeclaration.XToken('one', 'CHILDREN', undefined, {});
            const startToken = new elementStart.XToken('one', [{
               name: 'first',
               value: []
            }], { open: new SToken('foo', 'foo')});

            validator.write(elementDecl);
            validator.write(attListDecl);
            validator.write(startToken);
            validator.end();

            expectNoErrors(validator, done);
         });

         it('reports an error if an attribute in the token was not declared in the corresponding ATTLIST', (done) => {
            const startToken = new elementStart.XToken('one', [{
               name: 'notPresent',
               value: []
            }], { open: new SToken('foo', 'foo')});

            validator.write(attListDecl);
            validator.write(startToken);
            validator.end();

            const expected = new ValidityError(ValidityError.ID.ELEMENTSTART_UNDECLARED_ATTRIBUTE,
               [ 'one', 'notPresent' ], startToken.pToken.open, startToken.pToken.open);
            expectStream(validator, expected, done);
         });

         it('allows for the start token to have no attributes', (done) => {
            const elementDecl = new elementDeclaration.XToken('one', 'CHILDREN', undefined, {});
            const startToken = new elementStart.XToken('one', undefined, { open: new SToken('foo', 'foo')});

            validator.write(elementDecl);
            validator.write(attListDecl);
            validator.write(startToken);
            validator.end();

            expectNoErrors(validator, done);
         });

         it('allows for there not being an ATTLIST', (done) => {
            const startToken = new elementStart.XToken('one', [{
               name: 'notPresent',
               value: []
            }], { open: new SToken('foo', 'foo')});

            validator.write(startToken);
            validator.end();

            expectNoErrors(validator, done);
         });

         it('allows for the attribute not having a name', (done) => {
            const startToken = new elementStart.XToken('one', [{
               value: []
            }], { open: new SToken('foo', 'foo')});

            validator.write(attListDecl);
            validator.write(startToken);
            validator.end();

            const expected = new ValidityError(ValidityError.ID.ELEMENTSTART_UNDECLARED_ATTRIBUTE,
               [ 'one', '' ]);
            expectStream(validator, expected, done);
         });

         it('allows for an empty pToken', (done) => {
            const startToken = new elementStart.XToken('one', [{
               name: 'notPresent',
               value: []
            }], {});

            validator.write(attListDecl);
            validator.write(startToken);
            validator.end();

            const expected = new ValidityError(ValidityError.ID.ELEMENTSTART_UNDECLARED_ATTRIBUTE,
               [ 'one', 'notPresent' ]);
            expectStream(validator, expected, done);
         });
   
         it('reports a warning if an empty element tag is used for an element not declared to be empty', (done) => {
            const elementDecl = new elementDeclaration.XToken('one', 'CHILDREN', undefined, {});
            const emptyTag = new elementStart.EmptyToken('one', [], {});

            validator.write(elementDecl);
            validator.write(emptyTag);
            validator.end();

            const expected = new XmlWarning(XmlWarning.ID.ELEMENT_EMPTY_WITH_NONEMPTY_DECL, [ 'one' ]);
            expectStream(validator, expected, done);
         });

      });

      describe('EmptyElement tokens', () => {
         let attlist;
         let element;

         beforeEach(() => {
            attlist = new attListDeclaration.XToken('one', [{
               name: 'first',
               type: 'CDATA',
               defaultType: 'yoiks',
            }], {});
         });

         it('reports an error if an attribute in the token was not declared in the corresponding ATTLIST', (done) => {
            const startToken = new elementStart.EmptyToken('one', [{
               name: 'notPresent',
               value: []
            }], { open: new SToken('foo', 'foo')});

            validator.write(attlist);
            validator.write(startToken);
            validator.end();

            const expected = new ValidityError(ValidityError.ID.ELEMENTSTART_UNDECLARED_ATTRIBUTE,
               [ 'one', 'notPresent' ], startToken.pToken.open, startToken.pToken.open);
            expectStream(validator, expected, done);
         });

         it('reports a warning if the ELEMENT declaration indicates that this element does not need to be EMPTY', (done) => {
            element = new elementDeclaration.XToken('one', 'CHILDREN', undefined, {});
            const startToken = new elementStart.EmptyToken('one', [], { open: new SToken('foo', 'foo') });

            validator.write(element);
            validator.write(startToken);
            validator.end();

            const expected = new XmlWarning(XmlWarning.ID.ELEMENT_EMPTY_WITH_NONEMPTY_DECL,
               [ 'one' ], startToken.pToken.open, startToken.pToken.open);
            expectStream(validator, expected, done);
         });

         it('reports a warning if a start tag is used for an element declared to be empty', (done) => {
            const elementDecl = new elementDeclaration.XToken('one', 'EMPTY', undefined, {});
            const elStart = new elementStart.XToken('one', [], {});

            validator.write(elementDecl);
            validator.write(elStart);
            validator.end();

            const expected = new XmlWarning(XmlWarning.ID.ELEMENT_WITH_EMPTY_DECL, [ 'one' ]);
            expectStream(validator, expected, done);
         });

      });

      describe('ATTLIST', () => {

         it('adds an error if the ATTLIST name shows up more than once', (done) => {
            const aOne = new attListDeclaration.XToken('one', [], {});
            const aTwo = new attListDeclaration.XToken('one', [], {});
   
            validator.write(aOne);
            validator.write(aTwo);
            validator.end();

            const expected = new XmlWarning(XmlWarning.ID.ATTLISTDECL_ELEMENT_DUPLICATE, [ 'one' ]);
            expectStream(validator, expected, done);
         });

         it('doe snot blow up if the ATTLIST has no pToken', (done) => {
            const aOne = new attListDeclaration.XToken('one', []);
            const aTwo = new attListDeclaration.XToken('one', []);
   
            validator.write(aOne);
            validator.write(aTwo);
            validator.end();

            const expected = new XmlWarning(XmlWarning.ID.ATTLISTDECL_ELEMENT_DUPLICATE, [ 'one' ]);
            expectStream(validator, expected, done);
         });

         it('doe snot blow up if the ATTLIST has no element name', (done) => {
            const aOne = new attListDeclaration.XToken(undefined, []);
            const aTwo = new attListDeclaration.XToken(undefined, []);
   
            validator.write(aOne);
            validator.write(aTwo);
            validator.end();

            const expected = new XmlWarning(XmlWarning.ID.ATTLISTDECL_ELEMENT_DUPLICATE, [ '' ]);
            expectStream(validator, expected, done);
         });
   
         it('reports no warnings if the related ELEMENT declaration is already present', (done) => {
            const elDecl = new elementDeclaration.XToken('elementType', 'EMPTY', undefined, {});
            const attDecl = new attListDeclaration.XToken('elementType', [], {});

            validator.write(elDecl);
            validator.write(attDecl);
            validator.end();

            expectNoErrors(validator, done);
         });

         it('reports a warning if the related ELEMENT declaration is not present', (done) => {
            const attListDecl = new attListDeclaration.XToken('elementType', [], {});

            validator.write(attListDecl);
            validator.end();

            const expected = new XmlWarning(XmlWarning.ID.ATTLISTDECL_NO_ELEMENTDECL,
               [ 'elementType', ], attListDecl.pToken.open, attListDecl.pToken.open);
            expectStream(validator, expected, done);
         });

         it('has no problems if the PToken is not provided', (done) => {
            const elDecl = new elementDeclaration.XToken('elementType', 'EMPTY', undefined, {});
            const attListDecl = new attListDeclaration.XToken('elementType', [{
               name: 'idAttr',
               type: 'ID',
               defaultType: '#IMPLIED',
            }]);

            validator.write(elDecl);
            validator.write(attListDecl);
            validator.end();

            expectNoErrors(validator, done);
         });

         it('reports no errors if an ID attribute is well defined', (done) => {
            const elDecl = new elementDeclaration.XToken('elementType', 'EMPTY', undefined, {});
            const attListDecl = new attListDeclaration.XToken('elementType', [{
               name: 'idAttr',
               type: 'ID',
               defaultType: '#IMPLIED',
            }], {});

            validator.write(elDecl);
            validator.write(attListDecl);
            validator.end();

            expectNoErrors(validator, done);
         });

         it('reports an error if an attribute is of type ID but does not have value #IMPLIED or #REQUIRED', (done) => {
            const attListDecl = new attListDeclaration.XToken('elementType', [{
               name: 'idAttr',
               type: 'ID',
               defaultType: '',
            }], {});

            validator.write(attListDecl);
            validator.end();

            const expected = new ValidityError(ValidityError.ID.ATTLISTDECL_ID_BAD_DEFAULT,
               [ 'elementType',  'idAttr', '' ], attListDecl.pToken.open);
            expectStream(validator, expected, done);
         });

      });

      describe('ELEMENT', () => {

         it('reports no errors if multiple ELEMENT declarations are provided', (done) => {
            const elDecl1 = new elementDeclaration.XToken('one', 'EMPTY', undefined, {});
            const elDecl2 = new elementDeclaration.XToken('two', 'EMPTY', undefined, {});

            validator.write(elDecl1);
            validator.write(elDecl2);
            validator.end();

            expectNoErrors(validator, done);
         });

         it('reports no errors if the element has no pToken', (done) => {
            const elDecl1 = new elementDeclaration.XToken('one', 'EMPTY', undefined);
            const elDecl2 = new elementDeclaration.XToken('two', 'EMPTY', undefined);

            validator.write(elDecl1);
            validator.write(elDecl2);
            validator.end();

            expectNoErrors(validator, done);
         });

         it('reports an error if there is more than one ELEMENT declaration for the same element type', (done) => {
            const elDecl1 = new elementDeclaration.XToken('one', 'EMPTY', undefined, {});
            const elDecl2 = new elementDeclaration.XToken('one', 'EMPTY', undefined, {});

            validator.write(elDecl1);
            validator.write(elDecl2);
            validator.end();

            const expected = new ValidityError(ValidityError.ID.ELEMENT_EXTRA_DECLARATION,
               [ 'one' ], elDecl1.pToken.open, elDecl1.pToken.open);
            expectStream(validator, expected, done);
         });

         describe('mixed content', () => {
            it('reports no warning all children have been declared', (done) => {
               const elDecl1 = new elementDeclaration.XToken('foo', 'EMPTY', undefined, {});
               const elDecl = new elementDeclaration.XToken('one', 'CHILDREN', {
                  names: [{
                     name: '#pcdata',
                     repeat: 'ONE',
                  }, {
                     name: 'foo',
                     repeat: 'ONE',
                  }],
                  listType: 'CHOICE',
                  repeat: 'ZEROPLUS',
               }, {});

               validator.write(elDecl1);
               validator.write(elDecl);
               validator.end();

               expectNoErrors(validator, done);
            });

            it('reports an error if content spec has a duplicate name', (done) => {
               const elDecl = new elementDeclaration.XToken('one', 'CHILDREN', {
                  names: [{
                     name: '#PCDATA',
                     repeat: 'ONE',
                  }, {
                     name: 'foo',
                     repeat: 'ONE',
                  }, {
                     name: 'foo',
                     repeat: 'ONE',
                  }],
                  listType: 'CHOICE',
                  repeat: 'ZEROPLUS',
               }, {});

               validator.write(elDecl);
               validator.end();

               const expected = new ValidityError(ValidityError.ID.ELEMENTDECL_MIXED_DUPLICATE_NAME,
                  [ 'one', 'foo' ], elDecl.pToken.open);
               expectStream(validator, expected, done);
            });

            it('reports a warning if a Mixed content spec has an undeclared child type', (done) => {
               const elDecl = new elementDeclaration.XToken('one', 'CHILDREN', {
                  names: [{
                     name: '#pcdata',
                     repeat: 'ONE',
                  }, {
                     name: 'foo',
                     repeat: 'ONE',
                  }],
                  listType: 'CHOICE',
                  repeat: 'ZEROPLUS',
               }, {});

               validator.write(elDecl);
               validator.end();

               const expected = new XmlWarning(XmlWarning.ID.ELEMENT_CHILD_UNDECLARED,
                  [ 'one', 'foo' ], elDecl.pToken.open, elDecl.pToken.open);
               expectStream(validator, expected, done);
            });

            it('reports no warning if an element declaration has itself as a child', (done) => {
               const elementDecl = new elementDeclaration.XToken('one', 'CHILDREN', {
                  names: [{
                     name: '#PCDATA',
                     repeat: 'ONE'
                  }, {
                     name: 'one',
                     repeat: 'ONE'
                  }]
               }, {});
   
               validator.write(elementDecl);
               validator.end();
   
               expectNoErrors(validator, done);
            });
         });

         it('reports a warning if a children content spec has an undeclared child type', (done) => {
            const elDecl = new elementDeclaration.XToken('one', 'CHILDREN', {
               names: [{
                  names: [{
                     name: 'badChild',
                     repeat: 'ONE',
                  }],
                  listType: 'CHOICE',
                  repeat: 'ZEROPLUS',
               }],
               listType: 'CHOICE',
               repeat: 'ZEROPLUS',
            }, {});

            validator.write(elDecl);
            validator.end();

            const expected = new XmlWarning(XmlWarning.ID.ELEMENT_CHILD_UNDECLARED,
               [ 'one', 'badChild' ], elDecl.pToken.open, elDecl.pToken.open);
            expectStream(validator, expected, done);
         });

      });

   });

});
