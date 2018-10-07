/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import stream from 'readable-stream';

import { EntityMetaData, EntityKind, util } from '../../basic';
import { ValidityError, WellFormedError, XmlError, XmlWarning } from '../../error';
import { SToken } from '../../sToken';
import nameList, { XNameList } from '../../token/common/nameList';
import {
   attListDeclaration,
   charData,
   cdata,
   comment,
   docTypeEnd,
   docTypeStart,
   elementStart,
   elementEnd,
   elementDeclaration,
   entityEnd,
   entityDeclaration,
   entityReference,
   entityStart,
   notationDeclaration,
   ProcessingInstructionXToken,
   space,
   text,
   xmlDeclaration,
} from '../../token';
import { AttListXToken, AttListPToken } from '../../token/attListDeclaration';
import { ElementStart, ElementStartPToken } from '../../token/elementStart';
// import { ElementEnd } from '../../token/elementEnd';
import { ElementDeclaration } from '../../token/elementDeclaration';
import { NotationDeclaration } from '../../token/notationDeclaration';

import CheckXTokenValidStream from '../CheckXTokenValidStream';

function toHaveError(util: any) {
   return {
      compare: (actual: any, expected: any) => {
         let Constructor = expected instanceof XmlWarning ? XmlWarning : ValidityError;
         let pass = false;
         let message;

         actual.forEach((token: any) => {
            if (token instanceof Constructor) {
               pass = pass || util.equals(token, expected);
            }
         });

         if (pass) {
            message = `Expected not to find "${JSON.stringify(expected, undefined, 2)}".`;
         } else {
            message = `Expected to find "${JSON.stringify(expected, undefined, 2)}". Instead found ${JSON.stringify(actual, undefined, 2)}.`;
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
      compare: (actual: any) => {
         let error: XmlWarning | ValidityError | void = undefined;
         let message: string;

         actual.forEach((token: any) => {
            if (token instanceof XmlWarning || token instanceof ValidityError) {
               error = token;
            }
         });

         if (!error) {
            message = `Expected to find one or more XmlErrors.`;
         } else {
            message = `Expected to find no XmlErrors, but found ${(error as any).message}.`; // typeHack
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
   let validator: CheckXTokenValidStream;
   let fakeEntityManager: any;

   beforeEach(() => {
      fakeEntityManager = {
         getEntityToken() {},
      };
      validator = new CheckXTokenValidStream(fakeEntityManager);
   });

   function gatherTokens(stream: stream.Transform, cb: (tokens: any) => void) {
      const tokens: any = [];

      stream.on('data', (item: any) => {
         tokens.push(item);
      });
      stream.on('end', () => {
         cb(tokens);
      });
   }

   function expectStream(validator: CheckXTokenValidStream, expected: any, done: () => void) {
      gatherTokens(validator, (tokens) => {
         (expect(tokens) as any).toHaveError(expected); // typeHack
         done();
      });
   }

   function expectNoErrors(validator: CheckXTokenValidStream, done: () => void) {
      gatherTokens(validator, (tokens) => {
         (expect(tokens) as any).toBeErrorFree(); // typeHack
         done();
      });
   }

   describe('_transform', () => {

      it('passes initial tokens through', () => {
         const xmlDecl = new xmlDeclaration.XToken([], []);
         validator.write(xmlDecl);

         expect(validator.read()).toEqual(xmlDecl as any); // typeHack
      });

      it('resumes passing through when encountering an elementStart after docTypeStart', () => {
         const dtStart = new docTypeStart.XToken('foo', undefined, false, []);
         const elStart = new elementStart.XToken('foo', []);

         validator.write(dtStart);
         validator.write(elStart);

         expect(validator.read()).toEqual(dtStart as any); // typeHack
         expect(validator.read()).toEqual(elStart as any); // typeHack
      });

      it('resumes passing through if end of stream reached', () => {
         const dtStart = new docTypeStart.XToken('foo', undefined, false, []);

         validator.write(dtStart);
         validator.end();

         expect(validator.read()).toEqual(dtStart as any); // typeHack
      });

      it('adds an error if the DOCTYPE name and the element start name do not match', () => {
         const dtStart = new docTypeStart.XToken('docTypeName', undefined, false, []);
         const elStart = new elementStart.XToken('elementName', []);

         validator.write(dtStart);
         validator.write(elStart);

         expect(validator.read()).toEqual(dtStart as any); // typeHack
         expect(validator.read()).toEqual(new ValidityError(ValidityError.ID.MISMATCH_ROOT_ELEMENT_TYPE,
            [ 'docTypeName', 'elementName' ]));
      });

      it('adds an error if the NOTATION name shows up more than once', () => {
         const nOne = new notationDeclaration.XToken('one');
         const nTwo = new notationDeclaration.XToken('one');

         validator.write(nOne);
         validator.write(nTwo);

         expect(validator.read()).toEqual(nOne as any); // typeHack
         expect(validator.read()).toEqual(new ValidityError(ValidityError.ID.NOTATION_NOT_UNIQUE, [ 'one' ]));
         expect(validator.read()).toEqual(nTwo as any); // typeHack
      });
   
   });

   describe('write()', () => {

      describe('ElementStart tokens', () => {
         let attListDecl: AttListXToken;

         beforeEach(() => {
            attListDecl = new attListDeclaration.XToken('one', [{
               name: 'first',
               type: 'CDATA',
               value: [],
               defaultType: 'yoiks',
            }]);
         });

         it('reports no error if the attribute is in the ATTLIST', (done) => {
            const elementDecl = new elementDeclaration.XToken('one', 'ANY', undefined);
            const startToken = new elementStart.XToken('one', [{
               name: 'first',
               value: []
            }]);

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
            }]);

            validator.write(attListDecl);
            validator.write(startToken);
            validator.end();

            const expected = new ValidityError(ValidityError.ID.ELEMENTSTART_UNDECLARED_ATTRIBUTE,
               [ 'one', 'notPresent' ]);
            expectStream(validator, expected, done);
         });

         it('allows for the start token to have no attributes', (done) => {
            const elementDecl = new elementDeclaration.XToken('one', 'ANY');
            const startToken = new elementStart.XToken('one', []);

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
            }]);

            validator.write(startToken);
            validator.end();

            expectNoErrors(validator, done);
         });

         it('allows for an empty pToken', (done) => {
            const startToken = new elementStart.XToken('one', [{
               name: 'notPresent',
               value: []
            }]);

            validator.write(attListDecl);
            validator.write(startToken);
            validator.end();

            const expected = new ValidityError(ValidityError.ID.ELEMENTSTART_UNDECLARED_ATTRIBUTE,
               [ 'one', 'notPresent' ]);
            expectStream(validator, expected, done);
         });
   
         it('reports a warning if an empty element tag is used for an element not declared to be empty', (done) => {
            const elementDecl = new elementDeclaration.XToken('one', 'ANY', undefined);
            const emptyTag = new elementStart.EmptyToken('one', []);

            validator.write(elementDecl);
            validator.write(emptyTag);
            validator.end();

            const expected = new XmlWarning(XmlWarning.ID.ELEMENT_EMPTY_WITH_NONEMPTY_DECL, [ 'one' ]);
            expectStream(validator, expected, done);
         });

         it('reports an error if a required attribute was not included on the attribute', (done) => {
            const elementDecl = new elementDeclaration.XToken('one', 'ANY', undefined);
            attListDecl.attDefs.push({
               name: 'needed',
               type: 'CDATA',
               value: [],
               defaultType: '#REQUIRED',
            });
            const startToken = new elementStart.XToken('one', [{
               name: 'first',
               value: []
            }]);

            validator.write(elementDecl);
            validator.write(attListDecl);
            validator.write(startToken);
            validator.end();

            const expected = new ValidityError(ValidityError.ID.ELEMENTSTART_NO_REQUIRED,
               [ 'one', 'needed' ]);
            expectStream(validator, expected, done);
         });

         it('reports no error if a required attribute was specified', (done) => {
            const elementDecl = new elementDeclaration.XToken('one', 'ANY', undefined);
            attListDecl.attDefs.push({
               name: 'needed',
               type: 'CDATA',
               value: [],
               defaultType: '#REQUIRED',
            });
            const startToken = new elementStart.XToken('one', [{
               name: 'needed',
               value: []
            }]);

            validator.write(elementDecl);
            validator.write(attListDecl);
            validator.write(startToken);
            validator.end();

            expectNoErrors(validator, done);
         });

         describe('normalization', () => {

            it('replaces non-space white characters with spaces', (done) => {
               const elDecl1 = new elementDeclaration.XToken('testEl', 'ANY', undefined);
               const attListDecl1 = new attListDeclaration.XToken('testEl', [{
                  name: 'textAttr',
                  type: 'CDATA',
                  value: [],
                  defaultType: '#REQUIRED',
               }]);
               const startToken1 = new elementStart.XToken('testEl', [{
                  name: 'textAttr',
                  value: [
                     new text.XToken('  this\tis\nfun. \t\n but a\rcan not actually happen  ')
                  ]
               }]);

               validator.write(elDecl1);
               validator.write(attListDecl1);
               validator.write(startToken1);
               validator.end();

               gatherTokens(validator, (tokens) => {
                  expect(tokens[2].attributes[0].value[0].text)
                     .toEqual('  this is fun.    but a can not actually happen  ');
                  done();
               });
            });

            it('replaces non-space white characters with spaces in a non-CDATA attribute', (done) => {
               const elDecl1 = new elementDeclaration.XToken('testEl', 'ANY', undefined);
               const attListDecl1 = new attListDeclaration.XToken('testEl', [{
                  name: 'idRefs',
                  type: 'IDREFS',
                  value: [],
                  defaultType: '#REQUIRED',
               }]);
               const startToken1 = new elementStart.XToken('testEl', [{
                  name: 'idRefs',
                  value: [
                     new text.XToken('   one\ttwo'),
                     new text.XToken('\nthree '),
                     new text.XToken('four ')
                  ]
               }]);

               validator.write(elDecl1);
               validator.write(attListDecl1);
               validator.write(startToken1);
               validator.end();

               gatherTokens(validator, (tokens) => {
                  expect(tokens[2].attributes[0].value)
                     .toEqual([
                        new text.XToken('one two'),
                        new text.XToken(' three '),
                        new text.XToken('four'),
                     ]);
                     done();
               });
            });

            it('treats an unknown attribute as CDATA', (done) => {
               const elDecl1 = new elementDeclaration.XToken('testEl', 'ANY', undefined);
               const attListDecl1 = new attListDeclaration.XToken('testEl', [{
                  name: 'idRefs',
                  type: 'IDREFS',
                  value: [],
                  defaultType: '#IMPLIED',
               }]);
               const startToken1 = new elementStart.XToken('testEl', [{
                  name: 'undefinedAttribute',
                  value: [
                     new text.XToken('   one\ttwo \nthree four')
                  ]
               }]);

               validator.write(elDecl1);
               validator.write(attListDecl1);
               validator.write(startToken1);
               validator.end();

               gatherTokens(validator, (tokens) => {
                  expect(tokens[3].attributes[0].value[0].text)
                     .toEqual('   one two  three four');
                     done();
               });
            });

            it('treats an attribute on an element without an ATTLIST as CDATA', (done) => {
               const elDecl1 = new elementDeclaration.XToken('testEl', 'ANY', undefined);
               const startToken1 = new elementStart.XToken('testEl', [{
                  name: 'undefinedAttribute',
                  value: [
                     new text.XToken('   one\ttwo \nthree four')
                  ]
               }]);

               validator.write(elDecl1);
               validator.write(startToken1);
               validator.end();

               gatherTokens(validator, (tokens) => {
                  expect(tokens[1].attributes[0].value[0].text)
                     .toEqual('   one two  three four');
                     done();
               });
            });

         });

         describe('default value', () => {

            it('adds an attribute with a default value if no attribute was on the original start token', (done) => {
               const elDecl1 = new elementDeclaration.XToken('testEl', 'ANY', undefined);
               const attListDecl1 = new attListDeclaration.XToken('testEl', [{
                  name: 'textAttr',
                  type: 'CDATA',
                  value: [ new text.XToken('the default value') ],
                  defaultType: '',
               }]);
               const startToken1 = new elementStart.XToken('testEl', []);

               validator.write(elDecl1);
               validator.write(attListDecl1);
               validator.write(startToken1);
               validator.end();

               gatherTokens(validator, (tokens) => {
                  expect(tokens[2].attributes[0].value[0].text)
                     .toEqual('the default value');
                  done();
               });
            });

            it('adds a default value to an attribute if, somehow, it has no value but the attr is still defined', (done) => {
               const elDecl1 = new elementDeclaration.XToken('testEl', 'ANY', undefined);
               const attListDecl1 = new attListDeclaration.XToken('testEl', [{
                  name: 'textAttr',
                  type: 'CDATA',
                  value: [ new text.XToken('the default value') ],
                  defaultType: '',
               }]);
               const startToken1 = new elementStart.XToken('testEl', [{
                  name: 'textAttr',
                  value: []
               }]);

               validator.write(elDecl1);
               validator.write(attListDecl1);
               validator.write(startToken1);
               validator.end();

               gatherTokens(validator, (tokens) => {
                  expect(tokens[2].attributes[0].value[0].text)
                     .toEqual('the default value');
                  done();
               });
            });

            it('adds a default value to an attribute if, somehow, it has an empty value but the attr is still defined', (done) => {
               const elDecl1 = new elementDeclaration.XToken('testEl', 'ANY', undefined);
               const attListDecl1 = new attListDeclaration.XToken('testEl', [{
                  name: 'textAttr',
                  type: 'CDATA',
                  value: [ new text.XToken('the default value') ],
                  defaultType: '',
               }]);
               const startToken1 = new elementStart.XToken('testEl', [{
                  name: 'textAttr',
                  value: []
               }]);

               validator.write(elDecl1);
               validator.write(attListDecl1);
               validator.write(startToken1);
               validator.end();

               gatherTokens(validator, (tokens) => {
                  expect(tokens[2].attributes[0].value[0].text)
                     .toEqual('the default value');
                  done();
               });
            });

            it('does not add the default value if an attribute already has a value', (done) => {
               const elDecl1 = new elementDeclaration.XToken('testEl', 'ANY', undefined);
               const attListDecl1 = new attListDeclaration.XToken('testEl', [{
                  name: 'textAttr',
                  type: 'CDATA',
                  value: [ new text.XToken('the default value') ],
                  defaultType: '',
               }]);
               const startToken1 = new elementStart.XToken('testEl', [{
                  name: 'textAttr',
                  value: [ new text.XToken('original') ]
               }]);

               validator.write(elDecl1);
               validator.write(attListDecl1);
               validator.write(startToken1);
               validator.end();

               gatherTokens(validator, (tokens) => {
                  expect(tokens[2].attributes[0].value[0].text)
                     .toEqual('original');
                  done();
               });
            });

            it('reports an error if a #FIXED attribute does not match the declared default', (done) => {
               const elDecl1 = new elementDeclaration.XToken('testEl', 'ANY', undefined);
               const attListDecl1 = new attListDeclaration.XToken('testEl', [{
                  name: 'textAttr',
                  type: 'CDATA',
                  value: [ new text.XToken('oneTwo') ],
                  defaultType: '#FIXED',
               }]);
               const startToken1 = new elementStart.XToken('testEl', [{
                  name: 'textAttr',
                  value: [ new text.XToken('oneT') ]
               }]);

               validator.write(elDecl1);
               validator.write(attListDecl1);
               validator.write(startToken1);
               validator.end();

               const expected = new ValidityError(ValidityError.ID.ELEMENTSTART_FIXED_NOT_RIGHT,
                  [ 'testEl', 'textAttr', 'oneTwo', 'oneT' ]);
               expectStream(validator, expected, done);
            });

            it('reports no error if a #FIXED attribute matches the declared default', (done) => {
               const elDecl1 = new elementDeclaration.XToken('testEl', 'ANY', undefined);
               const attListDecl1 = new attListDeclaration.XToken('testEl', [{
                  name: 'textAttr',
                  type: 'CDATA',
                  value: [ new text.XToken('oneTwo') ],
                  defaultType: '#FIXED',
               }]);
               const startToken1 = new elementStart.XToken('testEl', [{
                  name: 'textAttr',
                  value: [ new text.XToken('oneTwo') ]
               }]);

               validator.write(elDecl1);
               validator.write(attListDecl1);
               validator.write(startToken1);
               validator.end();

               expectNoErrors(validator, done);
            });

            it('reports no error if a #FIXED attribute is not specified on the start attribute', (done) => {
               const elDecl1 = new elementDeclaration.XToken('testEl', 'ANY', undefined);
               const attListDecl1 = new attListDeclaration.XToken('testEl', [{
                  name: 'textAttr',
                  type: 'CDATA',
                  value: [ new text.XToken('oneTwo') ],
                  defaultType: '#FIXED',
               }]);
               const startToken1 = new elementStart.XToken('testEl', []);

               validator.write(elDecl1);
               validator.write(attListDecl1);
               validator.write(startToken1);
               validator.end();

               expectNoErrors(validator, done);
            });
         });

         describe('ID', () => {

            it('reports an error if an ID value is not a name', (done) => {
               const elDecl1 = new elementDeclaration.XToken('one', 'ANY', undefined);
               const attListDecl1 = new attListDeclaration.XToken('one', [{
                  name: 'idAttr',
                  type: 'ID',
                  value: [],
                  defaultType: '#REQUIRED',
               }]);
               const startToken1 = new elementStart.XToken('one', [{
                  name: 'idAttr',
                  value: [
                     new text.XToken('$$BAD')
                  ]
               }]);
               spyOn(util, 'isName').and.returnValue(false);

               validator.write(elDecl1);
               validator.write(attListDecl1);
               validator.write(startToken1);
               validator.end();

               const expected = new ValidityError(ValidityError.ID.ELEMENTSTART_ID_NAME_INVALID,
                  [ '$$BAD', 'one', 'idAttr' ]);
               expectStream(validator, expected, done);
            });

            it('it calls util.isName() with the entity meta data', (done) => {
               const elDecl1 = new elementDeclaration.XToken('one', 'ANY', undefined);
               const attListDecl1 = new attListDeclaration.XToken('one', [{
                  name: 'idAttr',
                  type: 'ID',
                  value: [],
                  defaultType: '#REQUIRED',
               }]);
               const startToken1 = new elementStart.XToken('one', [{
                  name: 'idAttr',
                  value: [
                     new text.XToken('$$BAD')
                  ]
               }]);
               spyOn(util, 'isName');

               validator.write(new EntityMetaData(undefined, 1.1, 2));
               validator.write(elDecl1);
               validator.write(attListDecl1);
               validator.write(startToken1);
               validator.end();

               gatherTokens(validator, () => {
                  expect(util.isName).toHaveBeenCalledWith('$$BAD', 1.1, 2);
                  done();
               });
            });

            it('reports an error if an ID value is used twice', (done) => {
               const elDecl1 = new elementDeclaration.XToken('one', 'ANY', undefined);
               const attListDecl1 = new attListDeclaration.XToken('one', [{
                  name: 'idAttr',
                  type: 'ID',
                  value: [],
                  defaultType: '#REQUIRED',
               }]);
               const elDecl2 = new elementDeclaration.XToken('two', 'ANY', undefined);
               const attListDecl2 = new attListDeclaration.XToken('two', [{
                  name: 'id',
                  type: 'ID',
                  value: [],
                  defaultType: '#REQUIRED',
               }]);
               const startToken1 = new elementStart.XToken('one', [{
                  name: 'idAttr',
                  value: [
                     new text.XToken('test')
                  ]
               }]);
               const startToken2 = new elementStart.XToken('two', [{
                  name: 'id',
                  value: [
                     new text.XToken('test')
                  ]
               }]);

               validator.write(elDecl1);
               validator.write(elDecl2);
               validator.write(attListDecl1);
               validator.write(attListDecl2);
               validator.write(startToken1);
               validator.write(startToken2);
               validator.end();

               const expected = new ValidityError(ValidityError.ID.ELEMENTSTART_ID_DUPLICATE,
                  [ 'test', 'two', 'id', 'one', 'idAttr' ]);
               expectStream(validator, expected, done);
            });

            it('reports an error if an ID value built from an entity reference is used twice', (done) => {
               const elDecl1 = new elementDeclaration.XToken('one', 'ANY', undefined);
               const attListDecl1 = new attListDeclaration.XToken('one', [{
                  name: 'idAttr',
                  type: 'ID',
                  value: [],
                  defaultType: '#REQUIRED',
               }]);
               const elDecl2 = new elementDeclaration.XToken('two', 'ANY', undefined);
               const attListDecl2 = new attListDeclaration.XToken('two', [{
                  name: 'id',
                  type: 'ID',
                  value: [],
                  defaultType: '#REQUIRED',
               }]);
               const startToken1 = new elementStart.XToken('one', [{
                  name: 'idAttr',
                  value: [
                     new text.XToken('test')
                  ]
               }]);
               const startToken2 = new elementStart.XToken('two', [{
                  name: 'id',
                  value: [
                     new entityStart.XToken('ref'),
                     new text.XToken('test'),
                     new entityEnd.XToken('ref'),
                  ]
               }]);

               validator.write(elDecl1);
               validator.write(elDecl2);
               validator.write(attListDecl1);
               validator.write(attListDecl2);
               validator.write(startToken1);
               validator.write(startToken2);
               validator.end();

               const expected = new ValidityError(ValidityError.ID.ELEMENTSTART_ID_DUPLICATE,
                  [ 'test', 'two', 'id', 'one', 'idAttr' ]);
               expectStream(validator, expected, done);
            });
         });

         describe('IDREF attribute', () => {
            let elDecl: ElementDeclaration;
            let endElName: any;
            let attListDecl: AttListXToken;
            let startToken: ElementStart;

            beforeEach(() => {
               elDecl = new elementDeclaration.XToken('testEl', 'ANY', undefined);
               attListDecl = new attListDeclaration.XToken('testEl', [{
                  name: 'idRefAttr',
                  type: 'IDREF',
                  value: [],
                  defaultType: '#REQUIRED',
               }]);
               startToken = new elementStart.XToken('testEl', [{
                  name: 'idRefAttr',
                  value: [
                     new text.XToken('goodName')
                  ]
               }]);
               endElName = new elementEnd.XToken('testEl');
            });

            it('it calls util.isName() with the entity meta data (whitebox)', (done) => {
               spyOn(util, 'isName');
   
               validator.write(new EntityMetaData(undefined, 1.1, 2));
               validator.write(elDecl);
               validator.write(attListDecl);
               validator.write(startToken);
               validator.end();
   
               gatherTokens(validator, () => {
                  expect(util.isName).toHaveBeenCalledWith('goodName', 1.1, 2);
                  done();
               });
            });

            it('reports no error when an IDREF attribute is valid', (done) => {
               validator.write(elDecl);
               validator.write(attListDecl);
               validator.write(startToken);
               validator.end();
   
               expectNoErrors(validator, done);
            });

            it('reports an error if an IDREF value is not a name', (done) => {
               startToken = new elementStart.XToken('testEl', [{
                  name: 'idRefAttr',
                  value: [
                     new text.XToken('$badName')
                  ]
               }]);
   
               validator.write(elDecl);
               validator.write(attListDecl);
               validator.write(startToken);
               validator.end();
   
               const expected = new ValidityError(ValidityError.ID.ELEMENTSTART_IDREF_NOT_NAME,
                  [ '$badName', 'testEl', 'idRefAttr' ]);
               expectStream(validator, expected, done);
            });

            it('reports an error if an IDREFS values are not all names', (done) => {
               attListDecl = new attListDeclaration.XToken('elName', [{
                  name: 'idRefsAttr',
                  type: 'IDREFS',
                  value: [],
                  defaultType: '#REQUIRED',
               }]);
               startToken = new elementStart.XToken('elName', [{
                  name: 'idRefsAttr',
                  value: [
                     new text.XToken('goodName $badName         $anotherBadName')
                  ]
               }]);
   
               validator.write(elDecl);
               validator.write(attListDecl);
               validator.write(startToken);
               validator.end();
   
               const expected = new ValidityError(ValidityError.ID.ELEMENTSTART_IDREFS_NOT_NAME,
                  [ '$badName, $anotherBadName', 'elName', 'idRefsAttr' ]);
               expectStream(validator, expected, done);
            });

            it('reports no error if an IDREF references an ID named before the IDREF is found', (done) => {
               attListDecl = new attListDeclaration.XToken('testEl', [{
                  name: 'idRefAttr',
                  type: 'IDREF',
                  value: [],
                  defaultType: '#IMPLIED',
               }, {
                  name: 'idAttr',
                  type: 'ID',
                  value: [],
                  defaultType: '#IMPLIED',
               }]);
               const secondStartToken = new elementStart.XToken('testEl', [{
                  name: 'idAttr',
                  value: [
                     new text.XToken('goodName')
                  ]
               }]);
   
               validator.write(elDecl);
               validator.write(attListDecl);
               validator.write(secondStartToken);
               validator.write(startToken);
               validator.write(endElName);
               validator.write(endElName);
               validator.end();
   
               expectNoErrors(validator, done);
            });

            it('reports no error if an IDREF references an ID named after the IDREF is found', (done) => {
               attListDecl = new attListDeclaration.XToken('testEl', [{
                  name: 'idRefAttr',
                  type: 'IDREF',
                  value: [],
                  defaultType: '#IMPLIED',
               }, {
                  name: 'idAttr',
                  type: 'ID',
                  value: [],
                  defaultType: '#IMPLIED',
               }]);
               const secondStartToken = new elementStart.XToken('testEl', [{
                  name: 'idAttr',
                  value: [
                     new text.XToken('goodName')
                  ]
               }]);
   
               validator.write(elDecl);
               validator.write(attListDecl);
               validator.write(startToken);
               validator.write(secondStartToken);
               validator.write(endElName);
               validator.write(endElName);
               validator.end();
   
               expectNoErrors(validator, done);
            });

            it('reports an error if an IDREF references an ID that is never found', (done) => {
               attListDecl = new attListDeclaration.XToken('testEl', [{
                  name: 'idRefAttr',
                  type: 'IDREF',
                  value: [],
                  defaultType: '#REQUIRED',
               }, {
                  name: 'idAttr',
                  type: 'ID',
                  value: [],
                  defaultType: '#REQUIRED',
               }]);
               const secondStartToken = new elementStart.XToken('testEl', [{
                  name: 'idRefAttr',
                  value: [
                     new text.XToken('first')
                  ]
               }]);
   
               validator.write(elDecl);
               validator.write(attListDecl);
               validator.write(secondStartToken);
               validator.write(endElName);
               validator.end();
   
               const expected = new ValidityError(ValidityError.ID.ELEMENTSTART_IDREF_NO_ID,
                  [ 'first', 'testEl', 'idRefAttr' ]);
               expectStream(validator, expected, done);
            });

            it('reports an error if an IDREFS references an ID that is never found', (done) => {
               const openSToken = SToken.fromString('<');
               attListDecl = new attListDeclaration.XToken('testEl', [{
                  name: 'idRefsAttr',
                  type: 'IDREFS',
                  value: [],
                  defaultType: '#REQUIRED',
               }, {
                  name: 'idAttr',
                  type: 'ID',
                  value: [],
                  defaultType: '#REQUIRED',
               }]);
               const secondStartToken = new elementStart.XToken('testEl', [{
                  name: 'idRefsAttr',
                  value: [
                     new text.XToken('goodName second third')
                  ]
               }], new ElementStartPToken({
                  open: openSToken,
               }));
   
               validator.write(elDecl);
               validator.write(attListDecl);
               validator.write(secondStartToken);
               validator.write(startToken);
               validator.write(endElName);
               validator.end();
   
               const expected = new ValidityError(ValidityError.ID.ELEMENTSTART_IDREF_NO_ID,
                  [ 'second', 'testEl', 'idRefsAttr' ], openSToken, openSToken);
               expectStream(validator, expected, done);
            });
  
         });

         describe('ENTITY attribute', () => {
            let elDecl: ElementDeclaration;
            let attListDecl: AttListXToken;
            let startToken: ElementStart;

            beforeEach(() => {
               fakeEntityManager.getEntityToken = () => {
                  return new entityDeclaration.XToken('goodName', [], undefined, 'notation');
               };

               elDecl = new elementDeclaration.XToken('testElement', 'ANY', undefined);
               attListDecl = new attListDeclaration.XToken('testElement', [{
                  name: 'entityAttr',
                  type: 'ENTITY',
                  value: [],
                  defaultType: '#REQUIRED',
               }]);
               startToken = new elementStart.XToken('testElement', [{
                  name: 'entityAttr',
                  value: [
                     new text.XToken('goodName')
                  ]
               }]);
            });

            it('reports no error when an ENTITY attribute is valid', (done) => {
               validator.write(elDecl);
               validator.write(attListDecl);
               validator.write(startToken);
               validator.end();
   
               expectNoErrors(validator, done);
            });

            it('it calls util.isName() with the entity meta data (whitebox)', (done) => {   
               spyOn(util, 'isName');

               validator.write(new EntityMetaData(undefined, 1.1, 2));
               validator.write(elDecl);
               validator.write(attListDecl);
               validator.write(startToken);
               validator.end();
   
               gatherTokens(validator, () => {
                  expect(util.isName).toHaveBeenCalledWith('goodName', 1.1, 2);
                  done();
               });
            });

            it('reports an error if an ENTITY value is not a name', (done) => {
               startToken = new elementStart.XToken('testElement', [{
                  name: 'entityAttr',
                  value: [
                     new text.XToken('$badName')
                  ]
               }]);
   
               validator.write(elDecl);
               validator.write(attListDecl);
               validator.write(startToken);
               validator.end();
   
               const expected = new ValidityError(ValidityError.ID.ELEMENTSTART_ENTITY_NOT_NAME,
                  [ '$badName', 'testElement', 'entityAttr' ]);
               expectStream(validator, expected, done);
            });

            it('reports an error if an ENTITIES values are not all names', (done) => {
               attListDecl = new attListDeclaration.XToken('testElement', [{
                  name: 'entitiesAttr',
                  type: 'ENTITIES',
                  value: [],
                  defaultType: '#REQUIRED',
               }]);
               startToken = new elementStart.XToken('testElement', [{
                  name: 'entitiesAttr',
                  value: [
                     new text.XToken('goodName $badName      $anotherBadName')
                  ]
               }]);
   
               validator.write(elDecl);
               validator.write(attListDecl);
               validator.write(startToken);
               validator.end();
   
               const expected = new ValidityError(ValidityError.ID.ELEMENTSTART_ENTITIES_NOT_NAME,
                  [ '$badName, $anotherBadName', 'testElement', 'entitiesAttr' ]);
               expectStream(validator, expected, done);
            });

            it('reports an error if an ENTITY value names an unknown entity', (done) => {
               fakeEntityManager.getEntityToken = () => undefined;

               validator.write(elDecl);
               validator.write(attListDecl);
               validator.write(startToken);
               validator.end();
   
               const expected = new ValidityError(ValidityError.ID.ELEMENTSTART_ENTITY_NO_ENTITY,
                  [ 'goodName', 'testElement', 'entityAttr' ]);
               expectStream(validator, expected, done);
            });

            it('reports an error if an ENTITY value names a parsed entity', (done) => {
               fakeEntityManager.getEntityToken = () => {
                  return new entityDeclaration.XToken('goodName', [], undefined, undefined);
               };

               validator.write(elDecl);
               validator.write(attListDecl);
               validator.write(startToken);
               validator.end();
   
               const expected = new ValidityError(ValidityError.ID.ELEMENTSTART_ENTITY_PARSED_ENTITY,
                  [ 'goodName', 'testElement', 'entityAttr' ]);
               expectStream(validator, expected, done);
            });

            it('reports an error if one or more ENTITIES names are unknown entities', (done) => {
               fakeEntityManager.getEntityToken = () => undefined;
               attListDecl = new attListDeclaration.XToken('testElement', [{
                  name: 'entitiesAttr',
                  type: 'ENTITIES',
                  value: [],
                  defaultType: '#REQUIRED',
               }]);
               startToken = new elementStart.XToken('testElement', [{
                  name: 'entitiesAttr',
                  value: [
                     new text.XToken('one two   three')
                  ]
               }]);

               validator.write(elDecl);
               validator.write(attListDecl);
               validator.write(startToken);
               validator.end();
   
               const expected = new ValidityError(ValidityError.ID.ELEMENTSTART_ENTITIES_NO_ENTITY,
                  [ 'one, two, three', 'testElement', 'entitiesAttr' ]);
               expectStream(validator, expected, done);
            });

            it('reports an error if an ENTITIES value names a parsed entity', (done) => {
               fakeEntityManager.getEntityToken = () => {
                  return new entityDeclaration.XToken('goodName', [], undefined, undefined);
               };
               attListDecl = new attListDeclaration.XToken('testElement', [{
                  name: 'entitiesAttr',
                  type: 'ENTITIES',
                  value: [],
                  defaultType: '#REQUIRED',
               }]);
               startToken = new elementStart.XToken('testElement', [{
                  name: 'entitiesAttr',
                  value: [
                     new text.XToken('one two   three')
                  ]
               }]);

               validator.write(elDecl);
               validator.write(attListDecl);
               validator.write(startToken);
               validator.end();
   
               const expected = new ValidityError(ValidityError.ID.ELEMENTSTART_ENTITIES_PARSED_ENTITY,
                  [ 'one, two, three', 'testElement', 'entitiesAttr' ]);
               expectStream(validator, expected, done);
            });
   
         });

         describe('NMTOKEN attribute', () => {
            let elDecl: ElementDeclaration;
            let attListDecl: AttListXToken;
            let startToken: ElementStart;

            beforeEach(() => {
               elDecl = new elementDeclaration.XToken('testElement', 'ANY', undefined);
               attListDecl = new attListDeclaration.XToken('testElement', [{
                  name: 'nmTokenAttr',
                  type: 'NMTOKEN',
                  value: [],
                  defaultType: '#REQUIRED',
               }]);
               startToken = new elementStart.XToken('testElement', [{
                  name: 'nmTokenAttr',
                  value: [
                     new text.XToken('goodName')
                  ]
               }]);
            });

            it('it calls util.isNmToken() with the entity meta data (whitebox)', (done) => {
               spyOn(util, 'isNmToken');
   
               validator.write(new EntityMetaData(undefined, 1.1, 2));
               validator.write(elDecl);
               validator.write(attListDecl);
               validator.write(startToken);
               validator.end();
   
               gatherTokens(validator, () => {
                  expect(util.isNmToken).toHaveBeenCalledWith('goodName', 1.1, 2);
                  done();
               });
            });

            it('reports no error when an the attribute is valid', (done) => {
               validator.write(elDecl);
               validator.write(attListDecl);
               validator.write(startToken);
               validator.end();
   
               expectNoErrors(validator, done);
            });

            it('reports an error if a the attribute value is not an Nmtoken', (done) => {
               startToken = new elementStart.XToken('testElement', [{
                  name: 'nmTokenAttr',
                  value: [
                     new text.XToken('$badName')
                  ]
               }]);
   
               validator.write(elDecl);
               validator.write(attListDecl);
               validator.write(startToken);
               validator.end();
   
               const expected = new ValidityError(ValidityError.ID.ELEMENTSTART_NMTOKEN_NOT_NMTOKEN,
                  [ '$badName', 'testElement', 'nmTokenAttr' ]);
               expectStream(validator, expected, done);
            });

            it('reports an error if an NMTOKENS attribute has values that are not all Nmtokens', (done) => {
               attListDecl = new attListDeclaration.XToken('testElement', [{
                  name: 'nmTokenAttr',
                  type: 'NMTOKENS',
                  value: [],
                  defaultType: '#REQUIRED',
               }]);
               startToken = new elementStart.XToken('testElement', [{
                  name: 'nmTokenAttr',
                  value: [
                     new text.XToken('goodName $badName         $anotherBadName')
                  ]
               }]);
   
               validator.write(elDecl);
               validator.write(attListDecl);
               validator.write(startToken);
               validator.end();
   
               const expected = new ValidityError(ValidityError.ID.ELEMENTSTART_NMTOKENS_NOT_NMTOKEN,
                  [ '$badName, $anotherBadName', 'testElement', 'nmTokenAttr' ]);
               expectStream(validator, expected, done);
            });
   
         });

         describe('NOTATION attribute', () => {
            let n1: NotationDeclaration;
            let n2: NotationDeclaration;
            let elDecl: ElementDeclaration;
            let attListDecl: AttListXToken;
            let startToken: ElementStart;

            beforeEach(() => {
               n1 = new notationDeclaration.XToken('first');
               n2 = new notationDeclaration.XToken('second');
               elDecl = new elementDeclaration.XToken('testElement', 'ANY', undefined);
               attListDecl = new attListDeclaration.XToken('testElement', [{
                  name: 'notationAttr',
                  type: 'NOTATION',
                  enumeration: [ 'first', 'second' ],
                  value: [],
                  defaultType: '#REQUIRED',
               }]);
               startToken = new elementStart.XToken('testElement', [{
                  name: 'notationAttr',
                  value: [
                     new text.XToken('first')
                  ]
               }]);
            });

            it('reports no error when the attribute is valid', (done) => {
               validator.write(n1);
               validator.write(n2);
               validator.write(elDecl);
               validator.write(attListDecl);
               validator.write(startToken);
               validator.end();
   
               expectNoErrors(validator, done);
            });

            it('reports an error when the enumeration is empty so any notation value is illegal', (done) => {
               delete attListDecl.attDefs[0].enumeration;

               validator.write(n1);
               validator.write(n2);
               validator.write(elDecl);
               validator.write(attListDecl);
               validator.write(startToken);
               validator.end();
   
               const expected = new ValidityError(ValidityError.ID.ELEMENTSTART_NOTATION_NOT_DECLARED,
                  [ 'first', 'testElement',  'notationAttr', '' ]);
               expectStream(validator, expected, done);
            });

            it('reports an error if the attribute value not among the declared values', (done) => {
               startToken = new elementStart.XToken('testElement', [{
                  name: 'notationAttr',
                  value: [
                     new text.XToken('third')
                  ]
               }]);
   
               validator.write(n1);
               validator.write(n2);
               validator.write(elDecl);
               validator.write(attListDecl);
               validator.write(startToken);
               validator.end();
   
               const expected = new ValidityError(ValidityError.ID.ELEMENTSTART_NOTATION_NOT_DECLARED,
                  [ 'third', 'testElement', 'notationAttr', 'first, second' ]);
               expectStream(validator, expected, done);
            });

         });

         describe('ENUMERATION attribute', () => {
            let elDecl: ElementDeclaration;
            let attListDecl: AttListXToken;
            let startToken: ElementStart;

            beforeEach(() => {
               elDecl = new elementDeclaration.XToken('testElement', 'ANY', undefined);
               attListDecl = new attListDeclaration.XToken('testElement', [{
                  name: 'enumerationAttr',
                  type: 'ENUMERATION',
                  enumeration: [ 'first', 'second' ],
                  value: [],
                  defaultType: '#REQUIRED',
               }]);
               startToken = new elementStart.XToken('testElement', [{
                  name: 'enumerationAttr',
                  value: [
                     new text.XToken('first')
                  ]
               }]);
            });

            it('reports no error when an the attribute is valid', (done) => {
               validator.write(elDecl);
               validator.write(attListDecl);
               validator.write(startToken);
               validator.end();
   
               expectNoErrors(validator, done);
            });

            it('reports no error when an the enumeration is empty', (done) => {
               delete attListDecl.attDefs[0].enumeration;

               validator.write(elDecl);
               validator.write(attListDecl);
               validator.write(startToken);
               validator.end();
   
               const expected = new ValidityError(ValidityError.ID.ELEMENTSTART_ENUMERATION_NOT_DECLARED,
                  [ 'first', 'testElement',  'enumerationAttr', '' ]);
               expectStream(validator, expected, done);
            });

            it('reports an error if the attribute value not among the declared values', (done) => {
               startToken = new elementStart.XToken('testElement', [{
                  name: 'enumerationAttr',
                  value: [
                     new text.XToken('third')
                  ]
               }]);
   
               validator.write(elDecl);
               validator.write(attListDecl);
               validator.write(startToken);
               validator.end();
   
               const expected = new ValidityError(ValidityError.ID.ELEMENTSTART_ENUMERATION_NOT_DECLARED,
                  [ 'third', 'testElement', 'enumerationAttr', 'first, second' ]);
               expectStream(validator, expected, done);
            });

         });

      });

      describe('EmptyElement tokens', () => {
         let attlist: AttListXToken;
         let element;

         beforeEach(() => {
            attlist = new attListDeclaration.XToken('one', [{
               name: 'first',
               type: 'CDATA',
               value: [],
               defaultType: 'yoiks',
            }]);
         });

         it('reports an error if an attribute in the token was not declared in the corresponding ATTLIST', (done) => {
            const startToken = new elementStart.EmptyToken('one', [{
               name: 'notPresent',
               value: []
            }]);

            validator.write(attlist);
            validator.write(startToken);
            validator.end();

            const expected = new ValidityError(ValidityError.ID.ELEMENTSTART_UNDECLARED_ATTRIBUTE,
               [ 'one', 'notPresent' ]);
            expectStream(validator, expected, done);
         });

         it('reports a warning if the ELEMENT declaration indicates that this element does not need to be EMPTY', (done) => {
            element = new elementDeclaration.XToken('one', 'ANY', undefined);
            const startToken = new elementStart.EmptyToken('one', []);

            validator.write(element);
            validator.write(startToken);
            validator.end();

            const expected = new XmlWarning(XmlWarning.ID.ELEMENT_EMPTY_WITH_NONEMPTY_DECL, [ 'one' ]);
            expectStream(validator, expected, done);
         });

         it('reports a warning if a start tag is used for an element declared to be empty', (done) => {
            const elementDecl = new elementDeclaration.XToken('one', 'EMPTY', undefined);
            const elStart = new elementStart.XToken('one', []);

            validator.write(elementDecl);
            validator.write(elStart);
            validator.end();

            const expected = new XmlWarning(XmlWarning.ID.ELEMENT_WITH_EMPTY_DECL, [ 'one' ]);
            expectStream(validator, expected, done);
         });

      });

      describe('ATTLIST', () => {

         it('adds an error if the ATTLIST name shows up more than once', (done) => {
            const openSToken = SToken.fromString('<!');
            const aOne = new attListDeclaration.XToken('one', []);
            const aTwo = new attListDeclaration.XToken('one', [], new AttListPToken({
               open: openSToken,
            }));
   
            validator.write(aOne);
            validator.write(aTwo);
            validator.end();

            const expected = new XmlWarning(XmlWarning.ID.ATTLISTDECL_ELEMENT_DUPLICATE, [ 'one' ], openSToken, openSToken);
            expectStream(validator, expected, done);
         });

         it('does not blow up if the ATTLIST has no pToken', (done) => {
            const aOne = new attListDeclaration.XToken('one', []);
            const aTwo = new attListDeclaration.XToken('one', []);
   
            validator.write(aOne);
            validator.write(aTwo);
            validator.end();

            const expected = new XmlWarning(XmlWarning.ID.ATTLISTDECL_ELEMENT_DUPLICATE, [ 'one' ]);
            expectStream(validator, expected, done);
         });

         it('reports no warnings if the related ELEMENT declaration is already present', (done) => {
            const elDecl = new elementDeclaration.XToken('elementType', 'EMPTY', undefined);
            const attDecl = new attListDeclaration.XToken('elementType', []);

            validator.write(elDecl);
            validator.write(attDecl);
            validator.end();

            expectNoErrors(validator, done);
         });

         it('reports a warning if the related ELEMENT declaration is not present', (done) => {
            const attListDecl = new attListDeclaration.XToken('elementType', []);

            validator.write(attListDecl);
            validator.end();

            const expected = new XmlWarning(XmlWarning.ID.ATTLISTDECL_NO_ELEMENTDECL,
               [ 'elementType', ]);
            expectStream(validator, expected, done);
         });

         it('has no problems if the PToken is not provided', (done) => {
            const elDecl = new elementDeclaration.XToken('elementType', 'EMPTY', undefined);
            const attListDecl = new attListDeclaration.XToken('elementType', [{
               name: 'idAttr',
               type: 'ID',
               value: [],
               defaultType: '#IMPLIED',
            }]);

            validator.write(elDecl);
            validator.write(attListDecl);
            validator.end();

            expectNoErrors(validator, done);
         });

         it('reports no errors if an ID attribute is well defined', (done) => {
            const elDecl = new elementDeclaration.XToken('elementType', 'EMPTY', undefined);
            const attListDecl = new attListDeclaration.XToken('elementType', [{
               name: 'idAttr',
               type: 'ID',
               value: [],
               defaultType: '#IMPLIED',
            }]);

            validator.write(elDecl);
            validator.write(attListDecl);
            validator.end();

            expectNoErrors(validator, done);
         });

         it('reports an error if an attribute is of type ID but does not have value #IMPLIED or #REQUIRED', (done) => {
            const attListDecl = new attListDeclaration.XToken('elementType', [{
               name: 'idAttr',
               type: 'ID',
               value: [],
               defaultType: '',
            }]);

            validator.write(attListDecl);
            validator.end();

            const expected = new ValidityError(ValidityError.ID.ATTLISTDECL_ID_BAD_DEFAULT,
               [ 'elementType',  'idAttr', '' ]);
            expectStream(validator, expected, done);
         });

         it('reports an error if an ATTLIST for an element type has more than one attribute of type ID', (done) => {
            const endOfDocType = new docTypeEnd.XToken();
            const attListDecl = new attListDeclaration.XToken('elementType', [{
               name: 'idAttr',
               type: 'ID',
               value: [],
               defaultType: '#IMPLIED',
            }, {
               name: 'ref',
               type: 'IDREF',
               value: [],
               defaultType: '#REQUIRED',
            }, {
               name: 'second',
               type: 'ID',
               value: [],
               defaultType: '#REQUIRED',
            }]);

            validator.write(attListDecl);
            validator.write(endOfDocType);
            validator.end();

            const expected = new ValidityError(ValidityError.ID.ATTLISTDECL_EXTRA_ID,
               [ 'elementType',  'second' ]);
            expectStream(validator, expected, done);
         });

         describe('xml:space', () => {

            it('reports no error on an enumeration declaration with preserve and default as values ', (done) => {
               const elDecl = new elementDeclaration.XToken('elementType', 'EMPTY');
               const attListDecl = new attListDeclaration.XToken('elementType', [{
                  name: 'xml:space',
                  type: 'ENUMERATION',
                  enumeration: ['preserve', 'default'],
                  defaultType: '#REQUIRED',
                  value: [],
               }]);

               validator.write(elDecl);
               validator.write(attListDecl);
               validator.end();

               expectNoErrors(validator, done);
            });

            it('reports no error on an enumeration declaration with just preserve', (done) => {
               const elDecl = new elementDeclaration.XToken('elementType', 'EMPTY');
               const attListDecl = new attListDeclaration.XToken('elementType', [{
                  name: 'xml:space',
                  type: 'ENUMERATION',
                  enumeration: ['preserve'],
                  defaultType: '',
                  value: [],
               }]);

               validator.write(elDecl);
               validator.write(attListDecl);
               validator.end();

               expectNoErrors(validator, done);
            });

            it('reports an error the xml:space type is not an enumeration', (done) => {
               const elDecl = new elementDeclaration.XToken('elementType', 'EMPTY');
               const attListDecl = new attListDeclaration.XToken('elementType', [{
                  name: 'xml:space',
                  type: 'ID',
                  defaultType: '#REQUIRED',
                  value: [],
               }]);

               validator.write(elDecl);
               validator.write(attListDecl);
               validator.end();

               const expected = new ValidityError(ValidityError.ID.ATTLISTDECL_SPACE_BAD_TYPE,
                  [ 'elementType' ]);
               expectStream(validator, expected, done);
            });

            it('reports an error the xml:space type is an enumeration but the enumeration array is not present', (done) => {
               const elDecl = new elementDeclaration.XToken('elementType', 'EMPTY');
               const attListDecl = new attListDeclaration.XToken('elementType', [{
                  name: 'xml:space',
                  type: 'ENUMERATION',
                  defaultType: '#REQUIRED',
                  value: [],
               }]);

               validator.write(elDecl);
               validator.write(attListDecl);
               validator.end();

               const expected = new ValidityError(ValidityError.ID.ATTLISTDECL_SPACE_BAD_TYPE,
                  [ 'elementType' ]);
               expectStream(validator, expected, done);
            });

            it('reports an error the xml:space name is not lower case', (done) => {
               const elDecl = new elementDeclaration.XToken('elementType', 'EMPTY');
               const attListDecl = new attListDeclaration.XToken('elementType', [{
                  name: 'XML:SPACE',
                  type: 'ENUMERATION',
                  enumeration: ['default'],
                  defaultType: '#REQUIRED',
                  value: [],
               }]);

               validator.write(elDecl);
               validator.write(attListDecl);
               validator.end();

               const expected = new ValidityError(ValidityError.ID.ATTLISTDECL_SPACE_BAD_CASE,
                  [ 'elementType', 'XML:SPACE' ]);
               expectStream(validator, expected, done);
            });

            it('reports an error the xml:space type has no enumerated values specified', (done) => {
               const elDecl = new elementDeclaration.XToken('elementType', 'EMPTY');
               const attListDecl = new attListDeclaration.XToken('elementType', [{
                  name: 'xml:space',
                  type: 'ENUMERATION',
                  enumeration: [],
                  defaultType: '#IMPLICIT',
                  value: [],
               }]);

               validator.write(elDecl);
               validator.write(attListDecl);
               validator.end();

               const expected = new ValidityError(ValidityError.ID.ATTLISTDECL_SPACE_MISSING_ENUMRATION,
                  [ 'elementType' ]);
               expectStream(validator, expected, done);
            });

            it('reports an error the xml:space type has a value in the wrong case', (done) => {
               const elDecl = new elementDeclaration.XToken('elementType', 'EMPTY');
               const attListDecl = new attListDeclaration.XToken('elementType', [{
                  name: 'xml:space',
                  type: 'ENUMERATION',
                  enumeration: ['PRESERVE', 'default'],
                  defaultType: '#IMPLICIT',
                  value: [],
               }]);

               validator.write(elDecl);
               validator.write(attListDecl);
               validator.end();

               const expected = new ValidityError(ValidityError.ID.ATTLISTDECL_SPACE_BAD_ENUMRATION,
                  [ 'elementType', 'PRESERVE' ]);
               expectStream(validator, expected, done);
            });

            it('reports an error the xml:space type has an illegal value', (done) => {
               const elDecl = new elementDeclaration.XToken('elementType', 'EMPTY');
               const attListDecl = new attListDeclaration.XToken('elementType', [{
                  name: 'xml:space',
                  type: 'ENUMERATION',
                  enumeration: ['bogus', 'default'],
                  defaultType: '#IMPLICIT',
                  value: [],
               }]);

               validator.write(elDecl);
               validator.write(attListDecl);
               validator.end();

               const expected = new ValidityError(ValidityError.ID.ATTLISTDECL_SPACE_BAD_ENUMRATION,
                  [ 'elementType', 'bogus' ]);
               expectStream(validator, expected, done);
            });

         });

         describe('ID', () => {

            it('calls util.isName() to validate name', (done) => {
               spyOn(util, 'isName').and.returnValue(false);
               const elDecl = new elementDeclaration.XToken('elementType', 'EMPTY');
               const attListDecl = new attListDeclaration.XToken('elementType', [{
                  name: 'idAttr',
                  type: 'ID',
                  defaultType: '#REQUIRED',
                  value: [
                     new text.XToken('$bad'),
                  ],
               }]);

               validator.write(elDecl);
               validator.write(attListDecl);
               validator.end();

               gatherTokens(validator, () => {
                  expect(util.isName).toHaveBeenCalledWith('$bad', 1, 5);
                  done();
               });
            });

            it('reports an error if the default value for an ID attribute is not a name', (done) => {
               const elDecl = new elementDeclaration.XToken('elementType', 'EMPTY');
               const attListDecl = new attListDeclaration.XToken('elementType', [{
                  name: 'idAttr',
                  type: 'ID',
                  defaultType: '#REQUIRED',
                  value: [
                     new text.XToken('$bad'),
                  ],
               }]);

               validator.write(elDecl);
               validator.write(attListDecl);
               validator.end();

               const expected = new ValidityError(ValidityError.ID.ATTLISTDECL_BAD_ID_DEFAULT,
                  [ 'elementType',  'idAttr', '$bad' ]);
               expectStream(validator, expected, done);
            });

         });

         describe('IDREF', () => {

            it('calls util.isName() to validate name', (done) => {
               spyOn(util, 'isName').and.returnValue(false);
               const elDecl = new elementDeclaration.XToken('elementType', 'EMPTY');
               const attListDecl = new attListDeclaration.XToken('elementType', [{
                  name: 'idRefAttr',
                  type: 'IDREF',
                  defaultType: '#REQUIRED',
                  value: [
                     new text.XToken('$bad'),
                  ],
               }]);

               validator.write(elDecl);
               validator.write(attListDecl);
               validator.end();

               gatherTokens(validator, () => {
                  expect(util.isName).toHaveBeenCalledWith('$bad', 1, 5);
                  done();
               });
            });

            it('reports an error if the default value for an IDREF attribute is not a name', (done) => {
               const elDecl = new elementDeclaration.XToken('elementType', 'EMPTY');
               const attListDecl = new attListDeclaration.XToken('elementType', [{
                  name: 'idRefAttr',
                  type: 'IDREF',
                  defaultType: '#REQUIRED',
                  value: [
                     new text.XToken('$bad'),
                  ],
               }]);

               validator.write(elDecl);
               validator.write(attListDecl);
               validator.end();

               const expected = new ValidityError(ValidityError.ID.ATTLISTDECL_BAD_IDREF_DEFAULT,
                  [ 'elementType',  'idRefAttr', '$bad' ]);
               expectStream(validator, expected, done);
            });

         });

         describe('IDREFS', () => {

            it('calls util.isName() to validate name', (done) => {
               spyOn(util, 'isName').and.returnValue(false);
               const elDecl = new elementDeclaration.XToken('elementType', 'EMPTY');
               const attListDecl = new attListDeclaration.XToken('elementType', [{
                  name: 'idRefsAttr',
                  type: 'IDREFS',
                  defaultType: '#REQUIRED',
                  value: [
                     new text.XToken('$bad good $bad2'),
                  ],
               }]);

               validator.write(elDecl);
               validator.write(attListDecl);
               validator.end();

               gatherTokens(validator, () => {
                  expect(util.isName).toHaveBeenCalledWith('$bad', 1, 5);
                  done();
               });
            });

            it('reports an error if the default value for an IDREFS attribute has a non-name', (done) => {
               const elDecl = new elementDeclaration.XToken('elementType', 'EMPTY');
               const attListDecl = new attListDeclaration.XToken('elementType', [{
                  name: 'idRefsAttr',
                  type: 'IDREFS',
                  defaultType: '#REQUIRED',
                  value: [
                     new text.XToken('$bad good $bad2'),
                  ],
               }]);

               validator.write(elDecl);
               validator.write(attListDecl);
               validator.end();

               const expected = new ValidityError(ValidityError.ID.ATTLISTDECL_BAD_IDREFS_DEFAULT,
                  [ 'elementType',  'idRefsAttr', '$bad, $bad2' ]);
               expectStream(validator, expected, done);
            });

         });

         describe('ENTITY', () => {

            it('calls util.isName() to validate name', (done) => {
               spyOn(util, 'isName').and.returnValue(false);
               const elDecl = new elementDeclaration.XToken('elementType', 'EMPTY');
               const attListDecl = new attListDeclaration.XToken('elementType', [{
                  name: 'entityAttr',
                  type: 'ENTITY',
                  defaultType: '#REQUIRED',
                  value: [
                     new text.XToken('$bad'),
                  ],
               }]);

               validator.write(elDecl);
               validator.write(attListDecl);
               validator.end();

               gatherTokens(validator, () => {
                  expect(util.isName).toHaveBeenCalledWith('$bad', 1, 5);
                  done();
               });
            });

            it('reports an error if the default value for an IDREF attribute is not a name', (done) => {
               const elDecl = new elementDeclaration.XToken('elementType', 'EMPTY');
               const attListDecl = new attListDeclaration.XToken('elementType', [{
                  name: 'entityAttr',
                  type: 'ENTITY',
                  defaultType: '#REQUIRED',
                  value: [
                     new text.XToken('$bad'),
                  ],
               }]);

               validator.write(elDecl);
               validator.write(attListDecl);
               validator.end();

               const expected = new ValidityError(ValidityError.ID.ATTLISTDECL_BAD_ENTITY_DEFAULT,
                  [ 'elementType',  'entityAttr', '$bad' ]);
               expectStream(validator, expected, done);
            });

         });

         describe('ENTITIES', () => {

            it('calls util.isName() to validate name', (done) => {
               spyOn(util, 'isName').and.returnValue(false);
               const elDecl = new elementDeclaration.XToken('elementType', 'EMPTY');
               const attListDecl = new attListDeclaration.XToken('elementType', [{
                  name: 'entitiesAttr',
                  type: 'ENTITIES',
                  defaultType: '#REQUIRED',
                  value: [
                     new text.XToken('$bad good $bad2'),
                  ],
               }]);

               validator.write(elDecl);
               validator.write(attListDecl);
               validator.end();

               gatherTokens(validator, () => {
                  expect(util.isName).toHaveBeenCalledWith('$bad', 1, 5);
                  done();
               });
            });

            it('reports an error if the default value for an ENTITIES attribute has a non-name', (done) => {
               const elDecl = new elementDeclaration.XToken('elementType', 'EMPTY');
               const attListDecl = new attListDeclaration.XToken('elementType', [{
                  name: 'entitiesAttr',
                  type: 'ENTITIES',
                  defaultType: '#REQUIRED',
                  value: [
                     new text.XToken('$bad good $bad2'),
                  ],
               }]);

               validator.write(elDecl);
               validator.write(attListDecl);
               validator.end();

               const expected = new ValidityError(ValidityError.ID.ATTLISTDECL_BAD_ENTITIES_DEFAULT,
                  [ 'elementType',  'entitiesAttr', '$bad, $bad2' ]);
               expectStream(validator, expected, done);
            });

            it('reports no errors if the default value for an ENTITIES attribute are all good', (done) => {
               const elDecl = new elementDeclaration.XToken('elementType', 'EMPTY');
               const attListDecl = new attListDeclaration.XToken('elementType', [{
                  name: 'entitiesAttr',
                  type: 'ENTITIES',
                  defaultType: '#REQUIRED',
                  value: [
                     new text.XToken('all awesome good'),
                  ],
               }]);

               validator.write(elDecl);
               validator.write(attListDecl);
               validator.end();

               expectNoErrors(validator, done);
            });

         });


         describe('NMTOKEN', () => {

            it('calls util.isNmToken() to validate name', (done) => {
               spyOn(util, 'isNmToken').and.returnValue(false);
               const elDecl = new elementDeclaration.XToken('elementType', 'EMPTY');
               const attListDecl = new attListDeclaration.XToken('elementType', [{
                  name: 'nmTokenAttr',
                  type: 'NMTOKEN',
                  defaultType: '#REQUIRED',
                  value: [
                     new text.XToken('$bad'),
                  ],
               }]);

               validator.write(elDecl);
               validator.write(attListDecl);
               validator.end();

               gatherTokens(validator, () => {
                  expect(util.isNmToken).toHaveBeenCalledWith('$bad', 1, 5);
                  done();
               });
            });
            it('reports an error if the default value for an NMTOKEN attribute is not a name', (done) => {
               const elDecl = new elementDeclaration.XToken('elementType', 'EMPTY');
               const attListDecl = new attListDeclaration.XToken('elementType', [{
                  name: 'nmTokenAttr',
                  type: 'NMTOKEN',
                  defaultType: '#REQUIRED',
                  value: [
                     new text.XToken('$bad'),
                  ],
               }]);

               validator.write(elDecl);
               validator.write(attListDecl);
               validator.end();

               const expected = new ValidityError(ValidityError.ID.ATTLISTDECL_BAD_NMTOKEN_DEFAULT,
                  [ 'elementType',  'nmTokenAttr', '$bad' ]);
               expectStream(validator, expected, done);
            });

         });

         describe('NMTOKENS', () => {

            it('calls util.isNmToken() to validate name', (done) => {
               spyOn(util, 'isNmToken').and.returnValue(false);
               const elDecl = new elementDeclaration.XToken('elementType', 'EMPTY');
               const attListDecl = new attListDeclaration.XToken('elementType', [{
                  name: 'nmTokenAttr',
                  type: 'NMTOKENS',
                  defaultType: '#REQUIRED',
                  value: [
                     new text.XToken('$bad good $alsoBad'),
                  ],
               }]);

               validator.write(elDecl);
               validator.write(attListDecl);
               validator.end();

               gatherTokens(validator, () => {
                  expect(util.isNmToken).toHaveBeenCalledWith('$bad', 1, 5);
                  done();
               });
            });
            it('reports an error if the default value for an NMTOKENS attribute is not a name', (done) => {
               const elDecl = new elementDeclaration.XToken('elementType', 'EMPTY');
               const attListDecl = new attListDeclaration.XToken('elementType', [{
                  name: 'nmTokensAttr',
                  type: 'NMTOKENS',
                  defaultType: '#REQUIRED',
                  value: [
                     new text.XToken('$bad good $alsoBad'),
                  ],
               }]);

               validator.write(elDecl);
               validator.write(attListDecl);
               validator.end();

               const expected = new ValidityError(ValidityError.ID.ATTLISTDECL_BAD_NMTOKENS_DEFAULT,
                  [ 'elementType',  'nmTokensAttr', '$bad, $alsoBad' ]);
               expectStream(validator, expected, done);
            });

            it('reports no errors if the default value for an NMTOKENS attribute are all good', (done) => {
               const elDecl = new elementDeclaration.XToken('elementType', 'EMPTY');
               const attListDecl = new attListDeclaration.XToken('elementType', [{
                  name: 'nmTokensAttr',
                  type: 'NMTOKENS',
                  defaultType: '#REQUIRED',
                  value: [
                     new text.XToken('all awesome good'),
                  ],
               }]);

               validator.write(elDecl);
               validator.write(attListDecl);
               validator.end();

               expectNoErrors(validator, done);
            });

         });

         describe('NOTATION', () => {

            function setup(emd: EntityMetaData) {
               const endOfDocType = new docTypeEnd.XToken();
               const elDecl = new elementDeclaration.XToken('elementType', 'ANY', undefined);
               const attListDecl = new attListDeclaration.XToken('elementType', [{
                  name: 'notation1',
                  type: 'NOTATION',
                  enumeration: [],
                  value: [],
                  defaultType: '#IMPLIED',
               }, {
                  name: 'ref',
                  type: 'IDREF',
                  value: [],
                  defaultType: '#REQUIRED',
               }, {
                  name: 'notation2',
                  type: 'NOTATION',
                  enumeration: [],
                  value: [],
                  defaultType: '#REQUIRED',
               }]);

               validator.write(emd);
               validator.write(elDecl);
               validator.write(attListDecl);
               validator.write(endOfDocType);
               validator.end();
            };

            function setupEmptyElement(emd: EntityMetaData) {
               const endOfDocType = new docTypeEnd.XToken();
               const elDecl = new elementDeclaration.XToken('elementType', 'EMPTY', undefined);
               const attListDecl = new attListDeclaration.XToken('elementType', [{
                  name: 'notation1',
                  type: 'NOTATION',
                  enumeration: [],
                  value: [],
                  defaultType: '#IMPLIED',
               }, {
                  name: 'ref',
                  type: 'IDREF',
                  defaultType: '#REQUIRED',
                  value: [],
               }]);

               validator.write(emd);
               validator.write(elDecl);
               validator.write(attListDecl);
               validator.write(endOfDocType);
               validator.end();
            };

            function setupDuplicateNotationValues(emd: EntityMetaData) {
               const endOfDocType = new docTypeEnd.XToken();
               const elDecl = new elementDeclaration.XToken('elementType', 'ANY', undefined);
               const notation1 = new notationDeclaration.XToken('first', undefined);
               const notation2 = new notationDeclaration.XToken('second', undefined);
               const notation3 = new notationDeclaration.XToken('third', undefined);
               const attListDecl = new attListDeclaration.XToken('elementType', [{
                  name: 'notationAttr',
                  type: 'NOTATION',
                  enumeration: ['first', 'second', 'first', 'third', 'third', 'first'],
                  value: [],
                  defaultType: '#IMPLIED',
               }]);

               validator.write(emd);
               validator.write(notation1);
               validator.write(notation2);
               validator.write(notation3);
               validator.write(elDecl);
               validator.write(attListDecl);
               validator.write(endOfDocType);
               validator.end();
            };

            it('reports an error if a notation value has not been declared at ATTLIST declaration time', (done) => {
               const elDecl = new elementDeclaration.XToken('elementType', 'EMPTY', undefined);
               const notation = new notationDeclaration.XToken('first', undefined);
               const attListDecl = new attListDeclaration.XToken('elementType', [{
                  name: 'notation1',
                  type: 'NOTATION',
                  enumeration: ['first', 'second'],
                  value: [],
                  defaultType: '#IMPLIED',
               }]);

               validator.write(notation);
               validator.write(elDecl);
               validator.write(attListDecl);
               validator.end();

               const expected = new ValidityError(ValidityError.ID.ATTLISTDECL_BAD_NOTATION,
                  [ 'elementType',  'notation1', 'second' ]);
               expectStream(validator, expected, done);
            });

            it('reports no error if a 1.0/1 ATTLISTs NOTATION declaration has duplicate names', (done) => {
               setupDuplicateNotationValues(new EntityMetaData(EntityKind.DOCUMENT, 1.0, 1));

               expectNoErrors(validator, done);
            });

            it('reports an error if a 1.0/3 ATTLISTs NOTATION declaration has duplicate names', (done) => {
               setupDuplicateNotationValues(new EntityMetaData(EntityKind.DOCUMENT, 1.0, 3));

               const expected = new ValidityError(ValidityError.ID.ATTLISTDECL_DUPLICATE_NOTATION,
                  [ 'elementType', 'notationAttr', 'first, third' ]);
               expectStream(validator, expected, done);
            });

            it('reports an error if a 1.1/* ATTLISTs NOTATION declaration has duplicate names', (done) => {
               setupDuplicateNotationValues(new EntityMetaData(EntityKind.DOCUMENT, 1.1, 1));

               const expected = new ValidityError(ValidityError.ID.ATTLISTDECL_DUPLICATE_NOTATION,
                  [ 'elementType', 'notationAttr', 'first, third' ]);
               expectStream(validator, expected, done);
            });

            it('reports no error if an 1.0/1 ATTLIST has more than one NOTATION attribute', (done) => {
               setup(new EntityMetaData(EntityKind.DOCUMENT, 1.0, 1));

               expectNoErrors(validator, done);
            });

            it('reports an error if an 1.0/>1 ATTLIST has more than one NOTATION attribute', (done) => {
               setup(new EntityMetaData(EntityKind.DOCUMENT, 1.0, 2));

               const expected = new ValidityError(ValidityError.ID.ATTLISTDECL_EXTRA_NOTATION,
                  [ 'elementType',  'notation2' ]);
               expectStream(validator, expected, done);
            });

            it('reports an error if an 1.1/* ATTLIST has more than one NOTATION attribute', (done) => {
               setup(new EntityMetaData(EntityKind.DOCUMENT, 1.1, 2));

               const expected = new ValidityError(ValidityError.ID.ATTLISTDECL_EXTRA_NOTATION,
                  [ 'elementType',  'notation2' ]);
               expectStream(validator, expected, done);
            });

            it('reports no error if an 1.0/1 ATTLIST has more a NOTATION attribute on an EMPTY element type', (done) => {
               setupEmptyElement(new EntityMetaData(EntityKind.DOCUMENT, 1.0, 1));

               expectNoErrors(validator, done);
            });

            it('reports an error if an 1.0/>1 ATTLIST has more a NOTATION attribute on an EMPTY element type', (done) => {
               setupEmptyElement(new EntityMetaData(EntityKind.DOCUMENT, 1.0, 2));

               const expected = new ValidityError(ValidityError.ID.ATTLISTDECL_EMPTY_NOTATION,
                  [ 'elementType',  'notation1' ]);
               expectStream(validator, expected, done);
            });

            it('reports an error if an 1.1/* ATTLIST has more a NOTATION attribute on an EMPTY element type', (done) => {
               setupEmptyElement(new EntityMetaData(EntityKind.DOCUMENT, 1.1, 2));

               const expected = new ValidityError(ValidityError.ID.ATTLISTDECL_EMPTY_NOTATION,
                  [ 'elementType',  'notation1' ]);
               expectStream(validator, expected, done);
            });

            it('reports an error if the default value for a NOTATION attribute does not match one of the defined values', (done) => {
               const elDecl = new elementDeclaration.XToken('elementType', 'EMPTY');
               const notation1 = new notationDeclaration.XToken('first');
               const notation2 = new notationDeclaration.XToken('second');
               const attListDecl = new attListDeclaration.XToken('elementType', [{
                  name: 'noteAttr',
                  type: 'NOTATION',
                  enumeration: ['first', 'second'],
                  value: [
                     new text.XToken('third'),
                  ],
                  defaultType: '',
               }]);

               validator.write(notation1);
               validator.write(notation2);
               validator.write(elDecl);
               validator.write(attListDecl);
               validator.end();

               const expected = new ValidityError(ValidityError.ID.ATTLISTDECL_BAD_NOTATION_DEFAULT,
                  [ 'elementType',  'noteAttr', 'first, second', 'third' ]);
               expectStream(validator, expected, done);
            });

         });

         describe('ENUMERATION', () => {

            function setupDuplicateEnumerationValues(emd: EntityMetaData) {
               const endOfDocType = new docTypeEnd.XToken();
               const elDecl = new elementDeclaration.XToken('elementType', 'ANY', undefined);
               const attListDecl = new attListDeclaration.XToken('elementType', [{
                  name: 'enumerationAttr',
                  type: 'ENUMERATION',
                  enumeration: ['first', 'second', 'first', 'third', 'third', 'first'],
                  value: [],
                  defaultType: '#IMPLIED',
               }]);

               validator.write(emd);
               validator.write(elDecl);
               validator.write(attListDecl);
               validator.write(endOfDocType);
               validator.end();
            };

            it('reports no error if a 1.0/1 ATTLISTs ENUMERATION declaration has duplicate nmTokens', (done) => {
               setupDuplicateEnumerationValues(new EntityMetaData(EntityKind.DOCUMENT, 1.0, 1));

               expectNoErrors(validator, done);
            });

            it('reports an error if a 1.0/3 ATTLISTs ENUMERATION declaration has duplicate nmTokens', (done) => {
               setupDuplicateEnumerationValues(new EntityMetaData(EntityKind.DOCUMENT, 1.0, 3));

               const expected = new ValidityError(ValidityError.ID.ATTLISTDECL_DUPLICATE_ENUMERATION,
                  [ 'elementType', 'enumerationAttr', 'first, third' ]);
               expectStream(validator, expected, done);
            });

            it('reports an error if a 1.1/* ATTLISTs ENUMERATION declaration has duplicate nmTokens', (done) => {
               setupDuplicateEnumerationValues(new EntityMetaData(EntityKind.DOCUMENT, 1.1, 1));

               const expected = new ValidityError(ValidityError.ID.ATTLISTDECL_DUPLICATE_ENUMERATION,
                  [ 'elementType', 'enumerationAttr', 'first, third' ]);
               expectStream(validator, expected, done);
            });

            it('reports no error if a 1.0/3 ATTLISTs ENUMERATION declaration has no duplicate nmTokens', (done) => {
               const endOfDocType = new docTypeEnd.XToken();
               const elDecl = new elementDeclaration.XToken('elementType', 'ANY', undefined);
               const attListDecl = new attListDeclaration.XToken('elementType', [{
                  name: 'enumerationAttr',
                  type: 'ENUMERATION',
                  enumeration: ['first', 'second'],
                  value: [],
                  defaultType: '#IMPLIED',
               }]);

               validator.write(new EntityMetaData(EntityKind.DOCUMENT, 1.0, 3));
               validator.write(elDecl);
               validator.write(attListDecl);
               validator.write(endOfDocType);
               validator.end();

               expectNoErrors(validator, done);
            });

            it('reports an error if the default value for a enumeration attribute does not match one of the defined values', (done) => {
               const elDecl = new elementDeclaration.XToken('elementType', 'EMPTY');
               const attListDecl = new attListDeclaration.XToken('elementType', [{
                  name: 'noteAttr',
                  type: 'ENUMERATION',
                  enumeration: ['first', 'second'],
                  value: [
                     new text.XToken('third'),
                  ],
                  defaultType: '',
               }]);

               validator.write(elDecl);
               validator.write(attListDecl);
               validator.end();

               const expected = new ValidityError(ValidityError.ID.ATTLISTDECL_BAD_ENUMERATION_DEFAULT,
                  [ 'elementType',  'noteAttr', 'first, second', 'third' ]);
               expectStream(validator, expected, done);
            });

         });

         it('ignores attribute declarations after the first encountered', (done) => {
            const endOfDocType = new docTypeEnd.XToken();
            const attListDecl1 = new attListDeclaration.XToken('elementType', [{
               name: 'idAttr',
               type: 'ID',
               value: [],
               defaultType: '#IMPLIED',
            }, {
               name: 'anAttribute',
               type: 'CDATA',
               value: [],
               defaultType: '#REQUIRED',
            }]);
            const attListDecl2 = new attListDeclaration.XToken('elementType', [{
               name: 'anAttribute',
               type: 'ID', // This would cause us to have two ID's, if this were honored
               value: [],
               defaultType: '#REQUIRED',
            }]);

            validator.write(attListDecl1);
            validator.write(attListDecl2);
            validator.write(endOfDocType);
            validator.end();

            const notExpected = new ValidityError(ValidityError.ID.ATTLISTDECL_EXTRA_ID,
               [ 'elementType',  'anAttribute' ]);
            gatherTokens(validator, (tokens) => {
               (expect(tokens) as any).not.toHaveError(notExpected); // typeHack
               done();
            });
         });

         it('reports a warning if more than one attribute definition is provided for an attribute', (done) => {
            const endOfDocType = new docTypeEnd.XToken();
            const attListDecl1 = new attListDeclaration.XToken('elementType', [{
               name: 'idAttr',
               type: 'ID',
               value: [],
               defaultType: '#IMPLIED',
            }, {
               name: 'anAttribute',
               type: 'CDATA',
               value: [],
               defaultType: '#REQUIRED',
            }]);
            const attListDecl2 = new attListDeclaration.XToken('elementType', [{
               name: 'anAttribute',
               type: 'ID', // This would cause us to have two ID's, if this were honored
               value: [],
               defaultType: '#REQUIRED',
            }]);

            validator.write(attListDecl1);
            validator.write(attListDecl2);
            validator.write(endOfDocType);
            validator.end();

            const expected = new XmlWarning(XmlWarning.ID.ATTLISTDECL_ATTR_EXTRA_DECLARATION,
               [ 'elementType',  'anAttribute' ]);
            expectStream(validator, expected, done);
         });

      });

      describe('ELEMENT', () => {

         it('reports no errors if multiple ELEMENT declarations are provided', (done) => {
            const elDecl1 = new elementDeclaration.XToken('one', 'EMPTY', undefined);
            const elDecl2 = new elementDeclaration.XToken('two', 'EMPTY', undefined);

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
            const elDecl1 = new elementDeclaration.XToken('one', 'EMPTY', undefined);
            const elDecl2 = new elementDeclaration.XToken('one', 'EMPTY', undefined);

            validator.write(elDecl1);
            validator.write(elDecl2);
            validator.end();

            const expected = new ValidityError(ValidityError.ID.ELEMENT_EXTRA_DECLARATION, [ 'one' ]);
            expectStream(validator, expected, done);
         });

         describe('mixed content', () => {
            it('reports no warning all children have been declared', (done) => {
               const elDecl1 = new elementDeclaration.XToken('foo', 'EMPTY', undefined);
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
               });

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
               });

               validator.write(elDecl);
               validator.end();

               const expected = new ValidityError(ValidityError.ID.ELEMENTDECL_MIXED_DUPLICATE_NAME,
                  [ 'one', 'foo' ]);
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
               });

               validator.write(elDecl);
               validator.end();

               const expected = new XmlWarning(XmlWarning.ID.ELEMENT_CHILD_UNDECLARED,
                  [ 'one', 'foo' ]);
               expectStream(validator, expected, done);
            });

            it('reports no warning if an element declaration has itself as a child', (done) => {
               const elementDecl1 = new elementDeclaration.XToken('two', 'ANY', undefined);
               const elementDecl2 = new elementDeclaration.XToken('one', 'CHILDREN', {
                  names: [{
                     name: '#PCDATA',
                     repeat: 'ONE'
                  }, {
                     name: 'two',
                     repeat: 'ONE'
                  }],
                  repeat: 'ONE',
                  listType: 'CHOICE'
               });
   
               validator.write(elementDecl1);
               validator.write(elementDecl2);
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
            });

            validator.write(elDecl);
            validator.end();

            const expected = new XmlWarning(XmlWarning.ID.ELEMENT_CHILD_UNDECLARED,
               [ 'one', 'badChild' ]);
            expectStream(validator, expected, done);
         });

      });

      describe('Error tokens', () => {

         it('ignores Errors when doing overall contextual checking', (done) => {
            const elDecl1 = new elementDeclaration.XToken('one', 'ANY', undefined);
            const startToken = new elementStart.XToken('one', [], new ElementStartPToken({ open: SToken.fromString('foo')}));

            validator.write(elDecl1);
            validator.write(startToken);
            validator.write(new WellFormedError(WellFormedError.ID.ELEMENTDECL_NO_NAME, [ 'x' ]));
            validator.end();

            gatherTokens(validator, (tokens) => {
               const errors = tokens.filter((token: any) => token instanceof XmlError);

               expect(errors.length).toBe(1);
               done();
            });
         });

      });

      describe('content', () => {
         describe('ANY', () => {
            const commentToken = new comment.CommentXToken('testComment');
            const piToken = new ProcessingInstructionXToken('test', 'pi');
            const cDataToken = new cdata.XToken('testCData');
            const elementStartToken = new elementStart.XToken('one', []);

            const data: Array<[any, 1|1.1, 1|2|3|4|5|6, boolean]> = [
               [ commentToken, 1, 1, true],
               [ commentToken, 1, 2, true],
               [ commentToken, 1, 3, true],
               [ commentToken, 1, 4, false ],
               [ commentToken, 1, 5, false ],
               [ commentToken, 1, 6, false ],
               [ commentToken, 1.1, 1, true],
               [ commentToken, 1.1, 2, false ],
               [ commentToken, 1.1, 3, false ],
               [ piToken, 1, 1, true],
               [ piToken, 1, 2, true],
               [ piToken, 1, 3, true],
               [ piToken, 1, 4, false ],
               [ piToken, 1, 5, false ],
               [ piToken, 1, 6, false ],
               [ piToken, 1.1, 1, true],
               [ piToken, 1.1, 2, false ],
               [ piToken, 1.1, 3, false ],
               [ cDataToken, 1, 1, true],
               [ cDataToken, 1, 2, true],
               [ cDataToken, 1, 3, true],
               [ cDataToken, 1, 4, false ],
               [ cDataToken, 1, 5, false ],
               [ cDataToken, 1, 6, false ],
               [ cDataToken, 1.1, 1, true],
               [ cDataToken, 1.1, 2, false ],
               [ cDataToken, 1.1, 3, false ],
               [ elementStartToken, 1, 1, false],
               [ elementStartToken, 1, 2, false],
               [ elementStartToken, 1, 3, false],
               [ elementStartToken, 1, 4, false ],
               [ elementStartToken, 1, 5, false ],
               [ elementStartToken, 1, 6, false ],
               [ elementStartToken, 1.1, 1, false ],
               [ elementStartToken, 1.1, 2, false ],
               [ elementStartToken, 1.1, 3, false ],
            ]
            data.forEach(([token, version, rev, causesError]) => {
               let errorToken: ValidityError;

               if (causesError) {
                  if (token === commentToken) {
                     errorToken = new ValidityError(ValidityError.ID.ANY_XTRA_COMMENT, [ 'one', version.toString(), rev.toString() ]);
                  } else if (token === piToken) {
                     errorToken = new ValidityError(ValidityError.ID.ANY_XTRA_PI, [ 'one', version.toString(), rev.toString() ]);
                  } else if (token === cDataToken) {
                     errorToken = new ValidityError(ValidityError.ID.ANY_XTRA_CDATA, [ 'one', version.toString(), rev.toString() ]);
                  }
               }
                     
               it(`${ causesError ? 'reports an error' : 'accepts'} if a ${token.type} token appears in an ANY element in XML ${version}/${rev}`, (done) => {
                  const emd = new EntityMetaData(EntityKind.DOCUMENT, version, rev);
                  const elementDecl = new elementDeclaration.XToken('one', 'ANY');
                  const startToken = new elementStart.XToken('one', []);
      
                  validator.write(emd);
                  validator.write(elementDecl);
                  validator.write(startToken);
                  validator.write(token);
                  validator.end();
      
                  if (causesError) {
                     expectStream(validator, errorToken, done);
                  } else {
                     expectNoErrors(validator, done);
                  }
               });
            });

            it('reports an error if an element is used that was not declared', (done) => {
               const elementDecl = new elementDeclaration.XToken('one', 'ANY');
               const startToken = new elementStart.XToken('one', []);
               const undeclaredToken = new elementStart.XToken('two', []);
   
               validator.write(elementDecl);
               validator.write(startToken);
               validator.write(undeclaredToken);
               validator.end();
   
               const errorToken = new ValidityError(ValidityError.ID.ANY_UNDECLARED_ELEMENT, [ 'one', 'two' ]);

               expectStream(validator, errorToken, done);
            });

            it('reports an error if a completely unsupported bit of markup shows up', (done) => {
               const elementDecl = new elementDeclaration.XToken('one', 'ANY');
               const startToken = new elementStart.XToken('one', []);
   
               validator.write(elementDecl);
               validator.write(startToken);
               validator.write(elementDecl);
               validator.end();
   
               const errorToken = new ValidityError(ValidityError.ID.ANY_XTRA_MARKUP, [ 'one' ]);

               expectStream(validator, errorToken, done);
            });

            it('reports errors even when no ptoken is present', (done) => {
               const elementDecl = new elementDeclaration.XToken('one', 'ANY');
               const startToken = new elementStart.XToken('one', []);
   
               validator.write(elementDecl);
               validator.write(startToken);
               validator.write(elementDecl);
               validator.end();
   
               const errorToken = new ValidityError(ValidityError.ID.ANY_XTRA_MARKUP, [ 'one' ]);

               expectStream(validator, errorToken, done);
            });

            it('reports no errors when passing char data through it', (done) => {
               const elementDecl = new elementDeclaration.XToken('one', 'ANY');
               const characters = new charData.XToken('one');
   
               validator.write(elementDecl);
               validator.write(characters);
               validator.end();
   
               expectNoErrors(validator, done);
            });

         });

         describe('EMPTY', () => {

            it('reports an error if anything appears in an element declared to be EMPTY', (done) => {
               const elementDecl = new elementDeclaration.XToken('one', 'EMPTY', undefined);
               const elStart = new elementStart.XToken('one', []);
               const elTwo = new elementStart.XToken('one', []);
   
               validator.write(elementDecl);
               validator.write(elStart);
               validator.write(elTwo);
               validator.end();
   
               const expected = new ValidityError(ValidityError.ID.CONTENT_IN_EMPTY_ELEMENT, [ 'one' ]);
               expectStream(validator, expected, done);
            });
   
            it('reports no error if only an empty tag appears in an EMPTY element', (done) => {
               const elementDecl = new elementDeclaration.XToken('one', 'EMPTY', undefined);
               const elStart = new elementStart.EmptyToken('one', []);
   
               validator.write(elementDecl);
               validator.write(elStart);
               validator.end();
   
               gatherTokens(validator, (tokens) => {
                  expect(tokens.length).toEqual(2);
                  done();
               });
            });
   
            it('reports no error if only a start and end tag are used an EMPTY element', (done) => {
               const elementDecl = new elementDeclaration.XToken('one', 'EMPTY', undefined);
               const elStart = new elementStart.XToken('one', []);
               const elEnd = new elementEnd.XToken('one');
   
               validator.write(elementDecl);
               validator.write(elStart);
               validator.write(elEnd);
               validator.end();
   
               gatherTokens(validator, (tokens) => {
                  expect(tokens.length).toEqual(4);
                  done();
               });
            });
   
         });
   
         describe('MIXED', () => {

            it('reports an error if any element start appears in a PCDATA-only element', (done) => {
               const elementDecl = new elementDeclaration.XToken('one', 'CHILDREN', {
                  names: [{
                     name: '#PCDATA',
                     repeat: 'ONE'
                  }],
                  repeat: 'ONE',
                  listType: 'CHOICE'
               });
               const elStart = new elementStart.XToken('one', []);
               const child = new elementStart.XToken('sub', []);
   
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
                  }],
                  repeat: 'ONE',
                  listType: 'CHOICE'
               });
               const elStart = new elementStart.XToken('one', []);
               const elEnd = new elementEnd.XToken('one', []);
               const child = new elementStart.XToken('two', []);
               const childEnd = new elementEnd.XToken('two', []);
               const thirdStart = new elementStart.XToken('three', []);

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
                  }],
                  repeat: 'ONE',
                  listType: 'CHOICE'
               });

               const commentToken = new comment.CommentXToken('stuff');
               const elStart = new elementStart.XToken('one', []);

               validator.write(new EntityMetaData(undefined, 1.0, 1));
               validator.write(elementDecl);
               validator.write(elStart);
               validator.write(commentToken);
               validator.end();
   
               const expected = new ValidityError(ValidityError.ID.MIXED_XTRA_MARKUP, [ 'one' ]);
               expectStream(validator, expected, done);
            });

            it('reports an error if there is a processing instruction found in mixed content in an old version', (done) => {
               const elementDecl = new elementDeclaration.XToken('one', 'CHILDREN', {
                  names: [{
                     name: '#PCDATA',
                     repeat: 'ONE'
                  }],
                  repeat: 'ONE',
                  listType: 'CHOICE'
               });
               const pi = new ProcessingInstructionXToken('stuff', 'other');
               const elStart = new elementStart.XToken('one', []);

               validator.write(new EntityMetaData(undefined, 1.0, 1));
               validator.write(elementDecl);
               validator.write(elStart);
               validator.write(pi);
               validator.end();
   
               const expected = new ValidityError(ValidityError.ID.MIXED_XTRA_MARKUP, [ 'one' ]);
               expectStream(validator, expected, done);
            });

            it('reports no error if there is a comment found in mixed content in newer version', (done) => {
               const elementDecl = new elementDeclaration.XToken('one', 'CHILDREN', {
                  names: [{
                     name: '#PCDATA',
                     repeat: 'ONE'
                  }],
                  repeat: 'ONE',
                  listType: 'CHOICE'
               });
               const commentToken = new comment.CommentXToken('stuff');
               const elStart = new elementStart.XToken('one', []);

               validator.write(new EntityMetaData(undefined, 1.0, 3));
               validator.write(elementDecl);
               validator.write(elStart);
               validator.write(commentToken);
               validator.end();
   
               expectNoErrors(validator, done);
            });

            it('reports no error if there is a processing instruction found in mixed content in an newer version', (done) => {
               const elementDecl = new elementDeclaration.XToken('one', 'CHILDREN', {
                  names: [{
                     name: '#PCDATA',
                     repeat: 'ONE'
                  }],
                  repeat: 'ONE',
                  listType: 'CHOICE'
               });
               const pi = new ProcessingInstructionXToken('stuff', 'other');
               const elStart = new elementStart.XToken('one', []);

               validator.write(new EntityMetaData(undefined, 1.1, 1));
               validator.write(elementDecl);
               validator.write(elStart);
               validator.write(pi);
               validator.end();
   
               expectNoErrors(validator, done);
            });

            it('reports no error if all the character data types are found in mixed content', (done) => {
               const elementDecl = new elementDeclaration.XToken('one', 'CHILDREN', {
                  names: [{
                     name: '#PCDATA',
                     repeat: 'ONE'
                  }],
                  repeat: 'ONE',
                  listType: 'CHOICE'
               });

               validator.write(elementDecl);
               validator.write(new elementStart.XToken('one', []));
               validator.write(new charData.XToken('test charData'));
               validator.write(new cdata.XToken('test CDATA'));
               validator.write(new space.XToken(' '));
               validator.write(new elementEnd.XToken('one', []));
               validator.end();
   
               expectNoErrors(validator, done);
            });

            it('reports no error if entity start and end pseudo markers are found in the stream', (done) => {
               const elementDecl = new elementDeclaration.XToken('one', 'CHILDREN', {
                  names: [{
                     name: '#PCDATA',
                     repeat: 'ONE'
                  }],
                  repeat: 'ONE',
                  listType: 'CHOICE'
               });

               validator.write(elementDecl);
               validator.write(new elementStart.XToken('one', []));
               validator.write(new entityStart.XToken('testEntityStart'));
               validator.write(new entityEnd.XToken('testEntityEnd'));
               validator.write(new elementEnd.XToken('one', []));
               validator.end();
   
               expectNoErrors(validator, done);
            });

            it('reports an error other markup is found in mixed content', (done) => {
               const elementDecl = new elementDeclaration.XToken('one', 'CHILDREN', {
                  names: [{
                     name: '#PCDATA',
                     repeat: 'ONE'
                  }],
                  repeat: 'ONE',
                  listType: 'CHOICE'
               });

               validator.write(elementDecl);
               validator.write(new elementStart.XToken('one', []));
               validator.write(new entityReference.XToken('testEntiyReference', {}));
               validator.end();
   
               const expected = new ValidityError(ValidityError.ID.MIXED_XTRA_MARKUP, [ 'one' ]);
               expectStream(validator, expected, done);
            });

         });

         describe('CHILDREN', () => {
            const commentToken = new comment.CommentXToken('testComment');
            const piToken = new ProcessingInstructionXToken('test', 'pi');
            const cDataToken = new cdata.XToken('testCData');
            const nonWhiteChars = new charData.XToken('one', []);
            const whiteChars = new charData.XToken(' \t\n', []);

            const data: Array<[any, 1|1.1, 1|2|3|4|5|6, boolean]> = [
               [ commentToken, 1, 1, true ],
               [ commentToken, 1, 2, true ],
               [ commentToken, 1, 3, false ],
               [ commentToken, 1, 4, false ],
               [ commentToken, 1, 5, false ],
               [ commentToken, 1, 6, false ],
               [ commentToken, 1.1, 1, false],
               [ commentToken, 1.1, 2, false ],
               [ commentToken, 1.1, 3, false ],
               [ piToken, 1, 1, true ],
               [ piToken, 1, 2, true ],
               [ piToken, 1, 3, false ],
               [ piToken, 1, 4, false ],
               [ piToken, 1, 5, false ],
               [ piToken, 1, 6, false ],
               [ piToken, 1.1, 1, false ],
               [ piToken, 1.1, 2, false ],
               [ piToken, 1.1, 3, false ],
               [ cDataToken, 1, 5, true ],
               [ cDataToken, 1.1, 2, true ],
               [ nonWhiteChars, 1, 5, true ],
               [ nonWhiteChars, 1.1, 2, true ],
               [ whiteChars, 1, 5, false ],
               [ whiteChars, 1.1, 2, false ],
               [ new space.XToken('  ', {}), 1.0, 1, false ],
               [ new entityReference.XToken('x', {}), 1.0, 1, false ],
               [ new entityStart.XToken('y'), 1.0, 1, false ],
               [ new entityEnd.XToken('z'), 1.0, 1, false ],
            ];
            data.forEach(([token, version, rev, causesError]) => {
               let errorToken: ValidityError;

               if (causesError) {
                  if (token === commentToken) {
                     errorToken = new ValidityError(ValidityError.ID.CHILDREN_XTRA_COMMENT, [ 'one', version.toString(), rev.toString() ]);
                  } else if (token === piToken) {
                     errorToken = new ValidityError(ValidityError.ID.CHILDREN_XTRA_PI, [ 'one', version.toString(), rev.toString() ]);
                  } else if (token === cDataToken) {
                     errorToken = new ValidityError(ValidityError.ID.CHILDREN_XTRA_CONTENT, [ 'one', version.toString(), rev.toString() ]);
                  } else if (token === nonWhiteChars) {
                     errorToken = new ValidityError(ValidityError.ID.CHILDREN_XTRA_CONTENT, [ 'one', version.toString(), rev.toString() ]);
                  }
               }

               it(`${ causesError ? 'reports an error' : 'accepts'} if a ${token.type} token appears in an element in XML ${version}/${rev}`, (done) => {
                  const emd = new EntityMetaData(EntityKind.DOCUMENT, version, rev);
                  const elementDecl2 = new elementDeclaration.XToken('two', 'ANY');
                  const elementDecl1 = new elementDeclaration.XToken('one', 'CHILDREN', {
                     names: [{
                        name: 'two',
                        repeat: 'ONE',
                     }],
                     repeat: 'ONE',
                     listType: 'CHOICE',  
                  });
                  const startToken = new elementStart.XToken('one', []);
      
                  validator.write(emd);
                  validator.write(elementDecl2);
                  validator.write(elementDecl1);
                  validator.write(startToken);
                  validator.write(token);
                  validator.end();
      
                  if (causesError) {
                     expectStream(validator, errorToken, done);
                  } else {
                     expectNoErrors(validator, done);
                  }
               });
            });

            it('copes with an XToken with no namelist', (done) => {
               const elementDecl = new elementDeclaration.XToken('one', 'CHILDREN', undefined);
               const elStart = new elementStart.XToken('one', []);
               const child = new elementStart.XToken('sub', []);
   
               validator.write(elementDecl);
               validator.write(elStart);
               validator.write(child);
               validator.end();
   
               const expected = new ValidityError(ValidityError.ID.INVALID_ELEMENT_IN_CONTENT, [ 'one', 'sub' ]);
               expectStream(validator, expected, done);
            });

            it('reports an error if an end is encountered but the graph is not done', (done) => {
               const nameListGraph = spyOn(nameList, 'graphFromNameList');
               nameListGraph.and.returnValue({
                  startId: 0,
                  endId: 9,
                  states: {
                     0: {
                        id: 0,
                        trans: {
                           two: {
                              ref: 'x1',
                              stateId: 1
                           },
                           three: {
                              ref: 'x2',
                              stateId: 1
                           },
                        },
                        done: false,
                     },
                     1: {
                        id: 1,
                        trans: {
                        },
                        done: true,
                     },
                  }
               });
               const elementDecl1 = new elementDeclaration.XToken('one', 'CHILDREN', {
                  names: [],
                  repeat: 'ONE',
                  listType: 'CHOICE',
               });
               const elStart = new elementStart.XToken('one', []);
               const elEnd = new elementEnd.XToken('one');
   
               validator.write(elementDecl1);
               validator.write(elStart);
               validator.write(elEnd);
               validator.end();
   
               const expected = new ValidityError(ValidityError.ID.CHILDREN_UNEXPECTED_END, [ 'one', 'two, three' ]);
               expectStream(validator, expected, done);
            });

            it('reports no error if an end is encountered when done transitioning through the graph', (done) => {
               const nameListGraph = spyOn(nameList, 'graphFromNameList');
               nameListGraph.and.returnValue({
                  startId: 0,
                  endId: 9,
                  states: {
                     0: {
                        id: 0,
                        trans: {
                           two: {
                              ref: 'x1',
                              stateId: 1
                           },
                           three: {
                              ref: 'x2',
                              stateId: 1
                           },
                        },
                        done: false,
                     },
                     1: {
                        id: 1,
                        trans: {
                        },
                        done: true,
                     },
                  }
               });
               const elementDecl2 = new elementDeclaration.XToken('two', 'EMPTY');
               const elementDecl1 = new elementDeclaration.XToken('one', 'CHILDREN', {
                  names: [],
                  repeat: 'ONE',
                  listType: 'CHOICE',
               });
               const elStart = new elementStart.XToken('one', []);
               const elMiddle = new elementStart.EmptyToken('two', []);
               const elEnd = new elementEnd.XToken('one');
   
               validator.write(elementDecl2);
               validator.write(elementDecl1);
               validator.write(elStart);
               validator.write(elMiddle);
               validator.write(elEnd);
               validator.end();
   
               expectNoErrors(validator, done);
            });

            it('reports an error if one tries to make an illegal transition in the graph', (done) => {
               const nameListGraph = spyOn(nameList, 'graphFromNameList');
               nameListGraph.and.returnValue({
                  startId: 0,
                  endId: 9,
                  states: {
                     0: {
                        id: 0,
                        trans: {
                           two: {
                              ref: 'x1',
                              stateId: 1
                           },
                           three: {
                              ref: 'x2',
                              stateId: 1
                           },
                        },
                        done: false,
                     },
                     1: {
                        id: 1,
                        trans: {
                        },
                        done: true,
                     },
                  }
               });
               const elementDecl2 = new elementDeclaration.XToken('four', 'EMPTY', undefined);
               const elementDecl1 = new elementDeclaration.XToken('one', 'CHILDREN', {
                  names: [],
                  repeat: 'ONE',
                  listType: 'CHOICE',
               });
               const elStart = new elementStart.XToken('one', []);
               const elMiddle = new elementStart.EmptyToken('four', []);
               const elEnd = new elementEnd.XToken('one');
   
               validator.write(elementDecl2);
               validator.write(elementDecl1);
               validator.write(elStart);
               validator.write(elMiddle);
               validator.write(elEnd);
               validator.end();
   
               const expected = new ValidityError(ValidityError.ID.INVALID_ELEMENT_IN_CONTENT, [ 'one', 'four' ]);
               expectStream(validator, expected, done);
            });

         });
      });
   });

});
