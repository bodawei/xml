/* Copyright ® 2017-2019 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import stream from 'readable-stream';

import { EntityMetaData, EntityKind } from 'basic';
import * as basic from 'basic';
import { ValidityError, WellFormedError, ERROR_TYPE, XmlWarning } from 'error';
import { SToken } from 'sToken';
import nameList, { XNameList } from '../../token/contentspec/nameList';
import {
   attListDeclaration,
   docTypeEnd,
   docTypeStart,
   elementDeclaration,
   ProcessingInstructionXToken,

   SPACE_XTOKEN,

   CdataXToken,
   CharDataXToken,
   CommentXToken,
   ElementEmptyXToken,
   ElementEndPToken,
   ElementEndXToken,
   ElementStartPToken,
   ElementStartXToken,
   SpaceXToken,
   ExternalSubsetStartXToken,
   ExternalSubsetEndXToken,
   GeneralEntityEndXToken,
   GeneralEntityStartXToken,
   InternalSubsetStartXToken,
   InternalSubsetEndXToken,
   ParameterEntityEndXToken,
   ParameterEntityStartXToken,
   NotationDeclarationXToken,
   XmlDeclarationXToken,
   GeneralEntityDeclarationXToken,
   ParameterEntityDeclarationXToken,
   GeneralEntityReferenceXToken,
   GeneralEntityReferencePToken,
} from 'token';
import { AttListXToken, AttListPToken } from '../../token/attListDeclaration';
import { ElementDeclaration, ElementDeclarationPToken } from '../../token/elementDeclaration';

import CheckXTokenValidStream from '../CheckXTokenValidStream';
import { TextXToken, TextPToken } from 'source/token/text';
import { UnassignedType } from 'source/token/common/unassigned';

function toHaveError(util: any) {
   return {
      compare: (actual: any, expected: any) => {
         let pass = false;
         let message;

         actual.forEach((token: any) => {
            if (token instanceof XmlWarning || token instanceof ValidityError || token instanceof WellFormedError) {
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
         let error: XmlWarning | ValidityError | void;
         let message: string;

         actual.forEach((token: any) => {
            if (token instanceof XmlWarning || token instanceof ValidityError || token instanceof WellFormedError) {
               error = token;
            }
         });

         if (!error!) {
            message = `Expected to find one or more XmlErrors.`;
         } else {
            message = `Expected to find no XmlErrors, but found ${(error! as any).message}.`; // typeHack
         }

         return {
            pass: !error!,
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
         let arrayExpected = [];

         if (!Array.isArray(expected)) {
            arrayExpected = [ expected ];
         }

         for (const expectedVal of arrayExpected) {
            (expect(tokens) as any).toHaveError(expectedVal); // typeHack
         }
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
         const xmlDecl = new XmlDeclarationXToken(1.0);
         validator.write(xmlDecl);

         expect(validator.read()).toEqual(xmlDecl as any); // typeHack
      });

      it('resumes passing through when encountering an elementStart after docTypeStart', () => {
         const dtStart = new docTypeStart.XToken('foo', undefined as any, false);
         const elStart = new ElementStartXToken('foo', []);

         validator.write(dtStart);
         validator.write(elStart);

         expect(validator.read()).toEqual(dtStart as any); // typeHack
         expect(validator.read()).toEqual(elStart as any); // typeHack
      });

      it('resumes passing through if end of stream reached', () => {
         const dtStart = new docTypeStart.XToken('foo', undefined as any, false);

         validator.write(dtStart);
         validator.end();

         expect(validator.read()).toEqual(dtStart as any); // typeHack
      });

      it('adds an error if the DOCTYPE name and the element start name do not match', () => {
         const dtStart = new docTypeStart.XToken('docTypeName', undefined as any, false);
         const elStart = new ElementStartXToken('elementName', []);

         validator.write(dtStart);
         validator.write(elStart);

         expect(validator.read()).toEqual(dtStart as any); // typeHack
         expect(validator.read()).toEqual(new ValidityError(ValidityError.ID.MISMATCH_ROOT_ELEMENT_TYPE,
            [ 'docTypeName', 'elementName' ]));
      });

      it('adds an error if the NOTATION name shows up more than once', (done) => {
         const nOne = new NotationDeclarationXToken('one');
         const nTwo = new NotationDeclarationXToken('one');

         validator.write(nOne);
         validator.write(nTwo);
         validator.end();

         const expected = new ValidityError(ValidityError.ID.NOTATION_NOT_UNIQUE, [ 'one' ]);
         expectStream(validator, expected, done);
      });

      it('adds no error if the NOTATION name shows up more than once and this is version 1.0/1', (done) => {
         const nOne = new NotationDeclarationXToken('one');
         const nTwo = new NotationDeclarationXToken('one');

         validator.write(new EntityMetaData(undefined, 1.0, 1));
         validator.write(nOne);
         validator.write(nTwo);
         validator.end();

         expectNoErrors(validator, done);
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
            const startToken = new ElementStartXToken('one', [{
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
            const startToken = new ElementStartXToken('one', [{
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
            const startToken = new ElementStartXToken('one', []);

            validator.write(elementDecl);
            validator.write(attListDecl);
            validator.write(startToken);
            validator.end();

            expectNoErrors(validator, done);
         });

         it('allows for there not being an ATTLIST', (done) => {
            const startToken = new ElementStartXToken('one', [{
               name: 'notPresent',
               value: []
            }]);

            validator.write(startToken);
            validator.end();

            expectNoErrors(validator, done);
         });

         it('allows for an empty pToken', (done) => {
            const startToken = new ElementStartXToken('one', [{
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
            const emptyTag = new ElementEmptyXToken('one', []);

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
            const startToken = new ElementStartXToken('one', [{
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
            const startToken = new ElementStartXToken('one', [{
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

            it('replaces non-space white characters with spaces in CDATA', (done) => {
               const elDecl1 = new elementDeclaration.XToken('testEl', 'ANY', undefined);
               const attListDecl1 = new attListDeclaration.XToken('testEl', [{
                  name: 'textAttr',
                  type: 'CDATA',
                  value: [],
                  defaultType: '#REQUIRED',
               }]);
               const startToken1 = new ElementStartXToken('testEl', [{
                  name: 'textAttr',
                  value: [
                     new TextXToken('  this\tis\nfun. \t\n but a\rcan not actually happen  ')
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
               const startToken1 = new ElementStartXToken('testEl', [{
                  name: 'idRefs',
                  value: [
                     new TextXToken('   one\ttwo'),
                     new TextXToken('\nthree '),
                     new TextXToken('four ')
                  ]
               }]);

               validator.write(elDecl1);
               validator.write(attListDecl1);
               validator.write(startToken1);
               validator.end();

               gatherTokens(validator, (tokens) => {
                  expect(tokens[2].attributes[0].value)
                     .toEqual([
                        new TextXToken('one two'),
                        new TextXToken(' three '),
                        new TextXToken('four'),
                     ]);
                     done();
               });
            });

            it('reports an error if standalone=yes and external declaration for attribute, and attribute changes as a result', (done) => {
               validator.write(new XmlDeclarationXToken(1.0, undefined, true));
               validator.write(new ExternalSubsetStartXToken());
               validator.write(new elementDeclaration.XToken('testEl', 'ANY', undefined));
               validator.write(new attListDeclaration.XToken('testEl', [{
                  name: 'idRefs',
                  type: 'IDREFS',
                  value: [],
                  defaultType: '#REQUIRED',
               }]));
               validator.write(new ExternalSubsetEndXToken());
               validator.write(new ElementStartXToken('testEl', [{
                  name: 'idRefs',
                  value: [
                     new TextXToken('   one\ttwo'),
                     new TextXToken('\nthree '),
                     new TextXToken('four ')
                  ]
               }]));
               validator.end();


               const expected = new ValidityError(ValidityError.ID.ATTLISTDECL_TYPE_EXTERNAL_DECLARED,
                  [ 'testEl', 'idRefs' ]);
               expectStream(validator, expected, done);
            });

            it('reports no error if standalone=no and external declaration for attribute, and attribute changes as a result', (done) => {
               validator.write(new XmlDeclarationXToken(1.0, undefined, false));
               validator.write(new ExternalSubsetStartXToken());
               validator.write(new elementDeclaration.XToken('testEl', 'ANY', undefined));
               validator.write(new attListDeclaration.XToken('testEl', [{
                  name: 'idRefs',
                  type: 'IDREFS',
                  value: [],
                  defaultType: '#REQUIRED',
               }]));
               validator.write(new ExternalSubsetEndXToken());
               validator.write(new ElementStartXToken('testEl', [{
                  name: 'idRefs',
                  value: [
                     new TextXToken('   one\ttwo'),
                     new TextXToken('\nthree '),
                     new TextXToken('four '),
                  ]
               }]));
               validator.end();

               expectNoErrors(validator, done);
            });

            it('treats an unknown attribute as CDATA', (done) => {
               const elDecl1 = new elementDeclaration.XToken('testEl', 'ANY', undefined);
               const attListDecl1 = new attListDeclaration.XToken('testEl', [{
                  name: 'idRefs',
                  type: 'IDREFS',
                  value: [],
                  defaultType: '#IMPLIED',
               }]);
               const startToken1 = new ElementStartXToken('testEl', [{
                  name: 'undefinedAttribute',
                  value: [
                     new TextXToken('   one\ttwo \nthree four')
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
               const startToken1 = new ElementStartXToken('testEl', [{
                  name: 'undefinedAttribute',
                  value: [
                     new TextXToken('   one\ttwo \nthree four')
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
                  value: [ new TextXToken('the default value') ],
                  defaultType: '',
               }]);
               const startToken1 = new ElementStartXToken('testEl', []);

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
                  value: [ new TextXToken('the default value') ],
                  defaultType: '',
               }]);
               const startToken1 = new ElementStartXToken('testEl', [{
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
                  value: [ new TextXToken('the default value') ],
                  defaultType: '',
               }]);
               const startToken1 = new ElementStartXToken('testEl', [{
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
                  value: [ new TextXToken('the default value') ],
                  defaultType: '',
               }]);
               const startToken1 = new ElementStartXToken('testEl', [{
                  name: 'textAttr',
                  value: [ new TextXToken('original') ]
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
                  value: [ new TextXToken('oneTwo') ],
                  defaultType: '#FIXED',
               }]);
               const startToken1 = new ElementStartXToken('testEl', [{
                  name: 'textAttr',
                  value: [ new TextXToken('oneT') ]
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
                  value: [ new TextXToken('oneTwo') ],
                  defaultType: '#FIXED',
               }]);
               const startToken1 = new ElementStartXToken('testEl', [{
                  name: 'textAttr',
                  value: [ new TextXToken('oneTwo') ]
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
                  value: [ new TextXToken('oneTwo') ],
                  defaultType: '#FIXED',
               }]);
               const startToken1 = new ElementStartXToken('testEl', []);

               validator.write(elDecl1);
               validator.write(attListDecl1);
               validator.write(startToken1);
               validator.end();

               expectNoErrors(validator, done);
            });

            it('reports an error if an attribute default must be added, and the declration was external (§2.9)', (done) => {
               const elDecl1 = new elementDeclaration.XToken('testEl', 'ANY', undefined);
               const attListDecl1 = new attListDeclaration.XToken('testEl', [{
                  name: 'textAttr',
                  type: 'CDATA',
                  value: [ new TextXToken('the default value') ],
                  defaultType: '',
               }]);
               const startToken1 = new ElementStartXToken('testEl', []);

               validator.write(new XmlDeclarationXToken(1.0, undefined, true));
               validator.write(new ExternalSubsetStartXToken());
               validator.write(elDecl1);
               validator.write(attListDecl1);
               validator.write(new ExternalSubsetEndXToken());
               validator.write(startToken1);
               validator.end();

               const expected = new ValidityError(ValidityError.ID.ELEMENTSTART_DEFAULT_EXTERNAL_DECLARED,
                  [ 'testEl', 'textAttr' ]);
               expectStream(validator, expected, done);
            });

            it('reports no error if an attribute default must be added, and the declration was not external (§2.9)', (done) => {
               const elDecl1 = new elementDeclaration.XToken('testEl', 'ANY', undefined);
               const attListDecl1 = new attListDeclaration.XToken('testEl', [{
                  name: 'textAttr',
                  type: 'CDATA',
                  value: [ new TextXToken('the default value') ],
                  defaultType: '',
               }]);
               const startToken1 = new ElementStartXToken('testEl', []);

               validator.write(new XmlDeclarationXToken(1.0, undefined, true));
               validator.write(new InternalSubsetStartXToken());
               validator.write(elDecl1);
               validator.write(attListDecl1);
               validator.write(new InternalSubsetEndXToken());
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
               const startToken1 = new ElementStartXToken('one', [{
                  name: 'idAttr',
                  value: [
                     new TextXToken('$$BAD')
                  ]
               }]);
               spyOn(basic, 'isName').and.returnValue(false);

               validator.write(elDecl1);
               validator.write(attListDecl1);
               validator.write(startToken1);
               validator.end();

               const expected = new ValidityError(ValidityError.ID.ELEMENTSTART_ID_NAME_INVALID,
                  [ '$$BAD', 'one', 'idAttr' ]);
               expectStream(validator, expected, done);
            });

            it('it calls isName() with the entity meta data', (done) => {
               const elDecl1 = new elementDeclaration.XToken('one', 'ANY', undefined);
               const attListDecl1 = new attListDeclaration.XToken('one', [{
                  name: 'idAttr',
                  type: 'ID',
                  value: [],
                  defaultType: '#REQUIRED',
               }]);
               const startToken1 = new ElementStartXToken('one', [{
                  name: 'idAttr',
                  value: [
                     new TextXToken('$$BAD')
                  ]
               }]);
               spyOn(basic, 'isName');

               validator.write(new EntityMetaData(undefined, 1.1, 2));
               validator.write(elDecl1);
               validator.write(attListDecl1);
               validator.write(startToken1);
               validator.end();

               gatherTokens(validator, () => {
                  expect(basic.isName).toHaveBeenCalledWith('$$BAD', 1.1, 2);
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
               const startToken1 = new ElementStartXToken('one', [{
                  name: 'idAttr',
                  value: [
                     new TextXToken('test')
                  ]
               }]);
               const startToken2 = new ElementStartXToken('two', [{
                  name: 'id',
                  value: [
                     new TextXToken('test')
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
               const startToken1 = new ElementStartXToken('one', [{
                  name: 'idAttr',
                  value: [
                     new TextXToken('test')
                  ]
               }]);
               const startToken2 = new ElementStartXToken('two', [{
                  name: 'id',
                  value: [
                     new GeneralEntityStartXToken('ref'),
                     new TextXToken('test'),
                     new GeneralEntityEndXToken('ref'),
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
            let startToken: ElementStartXToken;

            beforeEach(() => {
               elDecl = new elementDeclaration.XToken('testEl', 'ANY', undefined);
               attListDecl = new attListDeclaration.XToken('testEl', [{
                  name: 'idRefAttr',
                  type: 'IDREF',
                  value: [],
                  defaultType: '#REQUIRED',
               }]);
               startToken = new ElementStartXToken('testEl', [{
                  name: 'idRefAttr',
                  value: [
                     new TextXToken('goodName')
                  ]
               }]);
               endElName = new ElementEndXToken('testEl');
            });

            it('it calls isName() with the entity meta data (whitebox)', (done) => {
               spyOn(basic, 'isName');

               validator.write(new EntityMetaData(undefined, 1.1, 2));
               validator.write(elDecl);
               validator.write(attListDecl);
               validator.write(startToken);
               validator.end();

               gatherTokens(validator, () => {
                  expect(basic.isName).toHaveBeenCalledWith('goodName', 1.1, 2);
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
               startToken = new ElementStartXToken('testEl', [{
                  name: 'idRefAttr',
                  value: [
                     new TextXToken('$badName')
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
               startToken = new ElementStartXToken('elName', [{
                  name: 'idRefsAttr',
                  value: [
                     new TextXToken('goodName $badName         $anotherBadName')
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
               const secondStartToken = new ElementStartXToken('testEl', [{
                  name: 'idAttr',
                  value: [
                     new TextXToken('goodName')
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
               const secondStartToken = new ElementStartXToken('testEl', [{
                  name: 'idAttr',
                  value: [
                     new TextXToken('goodName')
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
               const secondStartToken = new ElementStartXToken('testEl', [{
                  name: 'idRefAttr',
                  value: [
                     new TextXToken('first')
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
               const secondStartToken = new ElementStartXToken('testEl', [{
                  name: 'idRefsAttr',
                  value: [
                     new TextXToken('goodName second third')
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
            let startToken: ElementStartXToken;

            beforeEach(() => {
               fakeEntityManager.getEntityToken = () => {
                  return new GeneralEntityDeclarationXToken('goodName', [], undefined, 'notation');
               };

               elDecl = new elementDeclaration.XToken('testElement', 'ANY', undefined);
               attListDecl = new attListDeclaration.XToken('testElement', [{
                  name: 'entityAttr',
                  type: 'ENTITY',
                  value: [],
                  defaultType: '#REQUIRED',
               }]);
               startToken = new ElementStartXToken('testElement', [{
                  name: 'entityAttr',
                  value: [
                     new TextXToken('goodName')
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

            it('it calls isName() with the entity meta data (whitebox)', (done) => {
               spyOn(basic, 'isName');

               validator.write(new EntityMetaData(undefined, 1.1, 2));
               validator.write(elDecl);
               validator.write(attListDecl);
               validator.write(startToken);
               validator.end();

               gatherTokens(validator, () => {
                  expect(basic.isName).toHaveBeenCalledWith('goodName', 1.1, 2);
                  done();
               });
            });

            it('reports an error if an ENTITY value is not a name', (done) => {
               startToken = new ElementStartXToken('testElement', [{
                  name: 'entityAttr',
                  value: [
                     new TextXToken('$badName')
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
               startToken = new ElementStartXToken('testElement', [{
                  name: 'entitiesAttr',
                  value: [
                     new TextXToken('goodName $badName      $anotherBadName')
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
                  return new GeneralEntityDeclarationXToken('goodName', [], undefined, undefined);
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
               startToken = new ElementStartXToken('testElement', [{
                  name: 'entitiesAttr',
                  value: [
                     new TextXToken('one two   three')
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
                  return new GeneralEntityDeclarationXToken('goodName', [], undefined, undefined);
               };
               attListDecl = new attListDeclaration.XToken('testElement', [{
                  name: 'entitiesAttr',
                  type: 'ENTITIES',
                  value: [],
                  defaultType: '#REQUIRED',
               }]);
               startToken = new ElementStartXToken('testElement', [{
                  name: 'entitiesAttr',
                  value: [
                     new TextXToken('one two   three')
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
            let startToken: ElementStartXToken;

            beforeEach(() => {
               elDecl = new elementDeclaration.XToken('testElement', 'ANY', undefined);
               attListDecl = new attListDeclaration.XToken('testElement', [{
                  name: 'nmTokenAttr',
                  type: 'NMTOKEN',
                  value: [],
                  defaultType: '#REQUIRED',
               }]);
               startToken = new ElementStartXToken('testElement', [{
                  name: 'nmTokenAttr',
                  value: [
                     new TextXToken('goodName')
                  ]
               }]);
            });

            it('it calls util.isNmToken() with the entity meta data (whitebox)', (done) => {
               spyOn(basic, 'isNmToken');

               validator.write(new EntityMetaData(undefined, 1.1, 2));
               validator.write(elDecl);
               validator.write(attListDecl);
               validator.write(startToken);
               validator.end();

               gatherTokens(validator, () => {
                  expect(basic.isNmToken).toHaveBeenCalledWith('goodName', 1.1, 2);
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
               startToken = new ElementStartXToken('testElement', [{
                  name: 'nmTokenAttr',
                  value: [
                     new TextXToken('$badName')
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
               startToken = new ElementStartXToken('testElement', [{
                  name: 'nmTokenAttr',
                  value: [
                     new TextXToken('goodName $badName         $anotherBadName')
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
            let n1: NotationDeclarationXToken;
            let n2: NotationDeclarationXToken;
            let elDecl: ElementDeclaration;
            let attListDecl: AttListXToken;
            let startToken: ElementStartXToken;

            beforeEach(() => {
               n1 = new NotationDeclarationXToken('first');
               n2 = new NotationDeclarationXToken('second');
               elDecl = new elementDeclaration.XToken('testElement', 'ANY', undefined);
               attListDecl = new attListDeclaration.XToken('testElement', [{
                  name: 'notationAttr',
                  type: 'NOTATION',
                  enumeration: [ 'first', 'second' ],
                  value: [],
                  defaultType: '#REQUIRED',
               }]);
               startToken = new ElementStartXToken('testElement', [{
                  name: 'notationAttr',
                  value: [
                     new TextXToken('first')
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
               startToken = new ElementStartXToken('testElement', [{
                  name: 'notationAttr',
                  value: [
                     new TextXToken('third')
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
            let startToken: ElementStartXToken;

            beforeEach(() => {
               elDecl = new elementDeclaration.XToken('testElement', 'ANY', undefined);
               attListDecl = new attListDeclaration.XToken('testElement', [{
                  name: 'enumerationAttr',
                  type: 'ENUMERATION',
                  enumeration: [ 'first', 'second' ],
                  value: [],
                  defaultType: '#REQUIRED',
               }]);
               startToken = new ElementStartXToken('testElement', [{
                  name: 'enumerationAttr',
                  value: [
                     new TextXToken('first')
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
               startToken = new ElementStartXToken('testElement', [{
                  name: 'enumerationAttr',
                  value: [
                     new TextXToken('third')
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
            const startToken = new ElementEmptyXToken('one', [{
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
            const startToken = new ElementEmptyXToken('one', []);

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

            it('calls isName() to validate name', (done) => {
               spyOn(basic, 'isName').and.returnValue(false);
               const elDecl = new elementDeclaration.XToken('elementType', 'EMPTY');
               const attListDecl = new attListDeclaration.XToken('elementType', [{
                  name: 'idAttr',
                  type: 'ID',
                  defaultType: '#REQUIRED',
                  value: [
                     new TextXToken('$bad'),
                  ],
               }]);

               validator.write(elDecl);
               validator.write(attListDecl);
               validator.end();

               gatherTokens(validator, () => {
                  expect(basic.isName).toHaveBeenCalledWith('$bad', 1, 5);
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
                     new TextXToken('$bad'),
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

            it('calls isName() to validate name', (done) => {
               spyOn(basic, 'isName').and.returnValue(false);
               const elDecl = new elementDeclaration.XToken('elementType', 'EMPTY');
               const attListDecl = new attListDeclaration.XToken('elementType', [{
                  name: 'idRefAttr',
                  type: 'IDREF',
                  defaultType: '#REQUIRED',
                  value: [
                     new TextXToken('$bad'),
                  ],
               }]);

               validator.write(elDecl);
               validator.write(attListDecl);
               validator.end();

               gatherTokens(validator, () => {
                  expect(basic.isName).toHaveBeenCalledWith('$bad', 1, 5);
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
                     new TextXToken('$bad'),
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

            it('calls isName() to validate name', (done) => {
               spyOn(basic, 'isName').and.returnValue(false);
               const elDecl = new elementDeclaration.XToken('elementType', 'EMPTY');
               const attListDecl = new attListDeclaration.XToken('elementType', [{
                  name: 'idRefsAttr',
                  type: 'IDREFS',
                  defaultType: '#REQUIRED',
                  value: [
                     new TextXToken('$bad good $bad2'),
                  ],
               }]);

               validator.write(elDecl);
               validator.write(attListDecl);
               validator.end();

               gatherTokens(validator, () => {
                  expect(basic.isName).toHaveBeenCalledWith('$bad', 1, 5);
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
                     new TextXToken('$bad good $bad2'),
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

            it('calls isName() to validate name', (done) => {
               spyOn(basic, 'isName').and.returnValue(false);
               const elDecl = new elementDeclaration.XToken('elementType', 'EMPTY');
               const attListDecl = new attListDeclaration.XToken('elementType', [{
                  name: 'entityAttr',
                  type: 'ENTITY',
                  defaultType: '#REQUIRED',
                  value: [
                     new TextXToken('$bad'),
                  ],
               }]);

               validator.write(elDecl);
               validator.write(attListDecl);
               validator.end();

               gatherTokens(validator, () => {
                  expect(basic.isName).toHaveBeenCalledWith('$bad', 1, 5);
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
                     new TextXToken('$bad'),
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

            it('calls isName() to validate name', (done) => {
               spyOn(basic, 'isName').and.returnValue(false);
               const elDecl = new elementDeclaration.XToken('elementType', 'EMPTY');
               const attListDecl = new attListDeclaration.XToken('elementType', [{
                  name: 'entitiesAttr',
                  type: 'ENTITIES',
                  defaultType: '#REQUIRED',
                  value: [
                     new TextXToken('$bad good $bad2'),
                  ],
               }]);

               validator.write(elDecl);
               validator.write(attListDecl);
               validator.end();

               gatherTokens(validator, () => {
                  expect(basic.isName).toHaveBeenCalledWith('$bad', 1, 5);
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
                     new TextXToken('$bad good $bad2'),
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
                     new TextXToken('all awesome good'),
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
               spyOn(basic, 'isNmToken').and.returnValue(false);
               const elDecl = new elementDeclaration.XToken('elementType', 'EMPTY');
               const attListDecl = new attListDeclaration.XToken('elementType', [{
                  name: 'nmTokenAttr',
                  type: 'NMTOKEN',
                  defaultType: '#REQUIRED',
                  value: [
                     new TextXToken('$bad'),
                  ],
               }]);

               validator.write(elDecl);
               validator.write(attListDecl);
               validator.end();

               gatherTokens(validator, () => {
                  expect(basic.isNmToken).toHaveBeenCalledWith('$bad', 1, 5);
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
                     new TextXToken('$bad'),
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
               spyOn(basic, 'isNmToken').and.returnValue(false);
               const elDecl = new elementDeclaration.XToken('elementType', 'EMPTY');
               const attListDecl = new attListDeclaration.XToken('elementType', [{
                  name: 'nmTokenAttr',
                  type: 'NMTOKENS',
                  defaultType: '#REQUIRED',
                  value: [
                     new TextXToken('$bad good $alsoBad'),
                  ],
               }]);

               validator.write(elDecl);
               validator.write(attListDecl);
               validator.end();

               gatherTokens(validator, () => {
                  expect(basic.isNmToken).toHaveBeenCalledWith('$bad', 1, 5);
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
                     new TextXToken('$bad good $alsoBad'),
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
                     new TextXToken('all awesome good'),
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
               const notation1 = new NotationDeclarationXToken('first', undefined);
               const notation2 = new NotationDeclarationXToken('second', undefined);
               const notation3 = new NotationDeclarationXToken('third', undefined);
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
               const notation = new NotationDeclarationXToken('first', undefined);
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
               const notation1 = new NotationDeclarationXToken('first');
               const notation2 = new NotationDeclarationXToken('second');
               const attListDecl = new attListDeclaration.XToken('elementType', [{
                  name: 'noteAttr',
                  type: 'NOTATION',
                  enumeration: ['first', 'second'],
                  value: [
                     new TextXToken('third'),
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
                     new TextXToken('third'),
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

      describe('ENTITY', () => {

         it('reports a warning if multiple ENTITY declarations with the same name are given', (done) => {
            const peDecl1 = new ParameterEntityDeclarationXToken('one', []);
            const peDecl2 = new ParameterEntityDeclarationXToken('one', []);
            const expected = new XmlWarning(XmlWarning.ID.ENTITYDECL_DUPLICATE, [ 'one' ]);

            validator.write(peDecl1);
            validator.write(peDecl2);
            validator.end();

            expectStream(validator, expected, done);
         });

         it('reports a warning if multiple ENTITY declarations with the same name are given', (done) => {
            const geDecl1 = new GeneralEntityDeclarationXToken('one', []);
            const geDecl2 = new GeneralEntityDeclarationXToken('one', []);
            const expected = new XmlWarning(XmlWarning.ID.ENTITYDECL_DUPLICATE, [ 'one' ]);

            validator.write(geDecl1);
            validator.write(geDecl2);
            validator.end();

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

         describe('element content', () => {
            it('reprots an error if an element has a non-deterministic content model', (done) => {
               const elDeclA = new elementDeclaration.XToken('a', 'EMPTY', undefined);
               const elDeclB = new elementDeclaration.XToken('b', 'EMPTY', undefined);
               const elDeclC = new elementDeclaration.XToken('c', 'EMPTY', undefined);
               const elDecl = new elementDeclaration.XToken('one', 'CHILDREN', {
                  names: [{
                     names: [{
                        name: 'b',
                        repeat: 'ONE',
                     }, {
                        name: 'a',
                        repeat: 'ONE',
                     }],
                     listType: 'SEQUENCE',
                     repeat: 'ONE',
                  }, {
                     names: [{
                        name: 'b',
                        repeat: 'ONE',
                     }, {
                        name: 'c',
                        repeat: 'ONE',
                     }],
                     listType: 'SEQUENCE',
                     repeat: 'ONE',
                  }],
                  listType: 'CHOICE',
                  repeat: 'ONE',
               });
               const expected = new WellFormedError(WellFormedError.ID.ELEMENTDECL_CONTENT_MODEL_NONDETERMINISTC,
                  [ 'b (/1/1,/2/1)' ], undefined);

               validator.write(elDeclA);
               validator.write(elDeclB);
               validator.write(elDeclC);
               validator.write(elDecl);
               validator.end();

               expectStream(validator, expected, done);
            });
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

         describe('parameter entity validation', () => {

            beforeEach(() => {
               spyOn(elementDeclaration, 'assignUnassigned');
            });

            it('reports no warnings with a syntactically ok expansion', (done) => {
               const pToken = new ElementDeclarationPToken({
                  open: SToken.fromString('<!'),
                  name: SToken.fromString('test'),
                  children: {
                     open: SToken.fromString('('),
                     names: [],
                  },
                  unassigned: [{
                     type: UnassignedType.ENTITY_START,
                     token: new ElementStartPToken({ open: SToken.fromString('<'), name: SToken.fromString('testPE') }),
                  }, {
                     type: 'word',
                     token: new TextPToken({ text: SToken.fromString('x') }),
                  }, {
                     type: 'space',
                     token: new TextPToken({ text: SToken.fromString(' ') }),
                  }, {
                     type: UnassignedType.ENTITY_END,
                     token: new ElementEndPToken({ open: SToken.fromString('<'), name: SToken.fromString('testPE') }),
                  }],
               });
               const declToken = elementDeclaration.pTokenToXToken(pToken);

               validator.write(declToken);
               validator.end();

               expectNoErrors(validator, done);
            });

            it('reports a warning if the parameter entity expansion is empty', (done) => {
               const pToken = new ElementDeclarationPToken({
                  open: SToken.fromString('<!'),
                  name: SToken.fromString('test'),
                  children: {
                     open: SToken.fromString('('),
                     names: [],
                  },
                  unassigned: [{
                     type: UnassignedType.ENTITY_START,
                     token: new GeneralEntityReferencePToken({ open: SToken.fromString('&'), name: SToken.fromString('testPE') }),
                  }, {
                     type: UnassignedType.ENTITY_END,
                     token: new GeneralEntityReferencePToken({ open: SToken.fromString('&'), name: SToken.fromString('testPE') }),
                  }],
               });
               const declToken = elementDeclaration.pTokenToXToken(pToken);
               const expected = new XmlWarning(XmlWarning.ID.ELEMENTDECL_PEREF_EMPTY,
                  [ 'test', 'testPE' ], (pToken as any).unassigned[0].token.open, pToken.open); // typeHack

               validator.write(declToken);
               validator.end();

               expectStream(validator, expected, done);
            });

            it('reports a warning if the parameter entity expansion is only white space', (done) => {
               const pToken = new ElementDeclarationPToken({
                  open: SToken.fromString('<!'),
                  name: SToken.fromString('test'),
                  children: {
                     open: SToken.fromString('('),
                     names: [],
                  },
                  unassigned: [{
                     type: UnassignedType.ENTITY_START,
                     token: new GeneralEntityReferencePToken({ open: SToken.fromString('&'), name: SToken.fromString('testPE') }),
                  }, {
                     type: 'space',
                     token: new TextPToken({ text: SToken.fromString(' ') }),
                  }, {
                     type: UnassignedType.ENTITY_END,
                     token: new GeneralEntityReferencePToken({ open: SToken.fromString('&'), name: SToken.fromString('testPE') }),
                  }],
               });
               const declToken = elementDeclaration.pTokenToXToken(pToken);
               const expected = new XmlWarning(XmlWarning.ID.ELEMENTDECL_PEREF_EMPTY,
                  [ 'test', 'testPE' ], (pToken as any).unassigned[0].token.open, pToken.open);

               validator.write(declToken);
               validator.end();

               expectStream(validator, expected, done);
            });

            it('reports no error when there is a literal and whitespace in the unassigned', (done) => {
               const pToken = new ElementDeclarationPToken({
                  open: SToken.fromString('<!'),
                  name: SToken.fromString('test'),
                  children: {
                     open: SToken.fromString('('),
                     names: [],
                  },
                  unassigned: [{
                     type: UnassignedType.ENTITY_START,
                     token: new GeneralEntityReferencePToken({ open: SToken.fromString('&'), name: SToken.fromString('testPE') }),
                  }, {
                     type: 'literal',
                     token: {},
                  }, {
                     type: 'space',
                     token: new TextPToken({ text: SToken.fromString(' ') }),
                  }, {
                     type: UnassignedType.ENTITY_END,
                     token: new GeneralEntityReferencePToken({ open: SToken.fromString('&'), name: SToken.fromString('testPE') }),
                  }],
               });
               const declToken = elementDeclaration.pTokenToXToken(pToken);

               validator.write(declToken);
               validator.end();

               expectNoErrors(validator, done);
            });

            it('reports a warning if the parameter entity expansion ends with a |', (done) => {
               const pToken = new ElementDeclarationPToken({
                  open: SToken.fromString('<!'),
                  name: SToken.fromString('test'),
                  children: {
                     open: SToken.fromString('('),
                     names: [],
                  },
                  unassigned: [{
                     type: UnassignedType.ENTITY_START,
                     token: new GeneralEntityReferencePToken({ open: SToken.fromString('&'), name: SToken.fromString('testPE') }),
                  }, {
                     type: 'word',
                     token: new TextPToken({ text: SToken.fromString('|') }),
                  }, {
                     type: 'space',
                     token: new TextPToken({ text: SToken.fromString(' ') }),
                  }, {
                     type: UnassignedType.ENTITY_END,
                     token: new GeneralEntityReferencePToken({ open: SToken.fromString('&'), name: SToken.fromString('testPE') }),
                  }],
               });
               const expected = new XmlWarning(XmlWarning.ID.ELEMENTDECL_PEREF_TRAILING_CONNECTOR,
                  [ 'test', 'testPE' ], (pToken as any).unassigned[0].token.open, pToken.open);

               validator.write(elementDeclaration.pTokenToXToken(pToken));
               validator.end();

               expectStream(validator, expected, done);
            });

            it('reports a warning if the parameter entity expansion ends with a ,', (done) => {
               const pToken = new ElementDeclarationPToken({
                  open: SToken.fromString('<!'),
                  name: SToken.fromString('test'),
                  children: {
                     open: SToken.fromString('('),
                     names: [],
                  },
                  unassigned: [{
                     type: UnassignedType.ENTITY_START,
                     token: new GeneralEntityReferencePToken({ open: SToken.fromString('&'), name: SToken.fromString('testPE') }),
                  }, {
                     type: 'word',
                     token: new TextPToken({ text: SToken.fromString(',') }),
                  }, {
                     type: 'space',
                     token: new TextPToken({ text: SToken.fromString(' ') }),
                  }, {
                     type: UnassignedType.ENTITY_END,
                     token: new GeneralEntityReferencePToken({ open: SToken.fromString('&'), name: SToken.fromString('testPE') }),
                  }],
               });
               const expected = new XmlWarning(XmlWarning.ID.ELEMENTDECL_PEREF_TRAILING_CONNECTOR,
                  [ 'test', 'testPE' ], (pToken as any).unassigned[0].token.open, pToken.open);

               validator.write(elementDeclaration.pTokenToXToken(pToken));
               validator.end();

               expectStream(validator, expected, done);
            });

            it('reports a validation error if parentheses are not balanced in the top entity', (done) => {
               const pToken = new ElementDeclarationPToken({
                  open: SToken.fromString('<!'),
                  name: SToken.fromString('test'),
                  children: {
                     open: SToken.fromString('('),
                     names: [],
                  },
                  unassigned: [{
                     type: UnassignedType.ENTITY_START,
                     token: new GeneralEntityReferencePToken({ open: SToken.fromString('&'), name: SToken.fromString('testPE') }),
                  }, {
                     type: 'word',
                     token: new TextPToken({ text: SToken.fromString('(') }),
                  }, {
                     type: 'space',
                     token: new TextPToken({ text: SToken.fromString(' ') }),
                  }, {
                     type: UnassignedType.ENTITY_END,
                     token: new GeneralEntityReferencePToken({ open: SToken.fromString('&'), name: SToken.fromString('testPE') }),
                  }],
               });
               const expected = new ValidityError(ValidityError.ID.ELEMENTDECL_PEREF_PARENS_UNBALANCED,
                  [ 'test', 'testPE' ], (pToken as any).unassigned[0].token.open, pToken.open);  //typeHack

               validator.write(elementDeclaration.pTokenToXToken(pToken));
               validator.end();

               expectStream(validator, expected, done);
            });

            it('reports no validation nerror when parentheses are balanced at the top entity level', (done) => {
               const pToken = new ElementDeclarationPToken({
                  open: SToken.fromString('<!'),
                  name: SToken.fromString('test'),
                  children: {
                     open: SToken.fromString('('),
                     names: [],
                  },
                  unassigned: [{
                     type: UnassignedType.ENTITY_START,
                     token: new GeneralEntityReferencePToken({ open: SToken.fromString('&'), name: SToken.fromString('testPE') }),
                  }, {
                     type: UnassignedType.ENTITY_START,
                     token: new GeneralEntityReferencePToken({ open: SToken.fromString('&'), name: SToken.fromString('testPE') }),
                  }, {
                     type: 'word',
                     token: new TextPToken({ text: SToken.fromString('(') }),
                  }, {
                     type: 'space',
                     token: new TextPToken({ text: SToken.fromString(' ') }),
                  }, {
                     type: UnassignedType.ENTITY_END,
                     token: new GeneralEntityReferencePToken({ open: SToken.fromString('&'), name: SToken.fromString('testPE') }),
                  }, {
                     // Note that the parenthesis is closed in another entity
                     type: 'word',
                     token: new TextPToken({ text: SToken.fromString(')') }),
                  }, {
                     type: 'space',
                     token: new TextPToken({ text: SToken.fromString(' ') }),
                  }, {
                     type: UnassignedType.ENTITY_END,
                     token: new GeneralEntityReferencePToken({ open: SToken.fromString('&'), name: SToken.fromString('testPE') }),
                  }],
               });

               validator.write(elementDeclaration.pTokenToXToken(pToken));
               validator.end();

               expectNoErrors(validator, done);
            });

         });

      });

      describe('entity reference', () => {

         it('reports an error if the referenced entity is externally declared and standlone=yes (§2.9)', (done) => {
            validator.write(new XmlDeclarationXToken(1.0, undefined, true));
            validator.write(new ExternalSubsetStartXToken());
            validator.write(new GeneralEntityDeclarationXToken('extDeclEntity', []));
            validator.write(new ExternalSubsetEndXToken());
            validator.write(new ElementStartXToken('testEl', []));
            validator.write(new GeneralEntityStartXToken('extDeclEntity'));
            validator.end();

            const expected = new ValidityError(ValidityError.ID.ENTITY_EXTERNAL_DECLARED,
               [ 'extDeclEntity' ]);
            expectStream(validator, expected, done);
         });

         it('reports no error if the referenced entity is internally declared and standlone=yes (§2.9)', (done) => {
            validator.write(new XmlDeclarationXToken(1.0, undefined, true));
            validator.write(new InternalSubsetStartXToken());
            validator.write(new GeneralEntityDeclarationXToken('extDeclEntity', []));
            validator.write(new InternalSubsetEndXToken());
            validator.write(new ElementStartXToken('testEl', []));
            validator.write(new GeneralEntityStartXToken('extDeclEntity'));
            validator.end();

            expectNoErrors(validator, done);
         });

         it('reports no error if the referenced entity is internally declared after multiple param entity expansions and standlone=yes (§2.9)', (done) => {
            validator.write(new XmlDeclarationXToken(1.0, undefined, true));
            validator.write(new InternalSubsetStartXToken());
            validator.write(new ParameterEntityStartXToken('someEntity'));
            validator.write(new GeneralEntityDeclarationXToken('extDeclEntity1', []));
            validator.write(new ParameterEntityEndXToken('someEntity'));
            validator.write(new ParameterEntityStartXToken('someEntity2'));
            validator.write(new ParameterEntityStartXToken('someEntity3'));
            validator.write(new GeneralEntityStartXToken('someEntity4'));
            validator.write(new GeneralEntityDeclarationXToken('extDeclEntity2', []));
            validator.write(new GeneralEntityEndXToken('someEntity4'));
            validator.write(new ParameterEntityEndXToken('someEntity3'));
            validator.write(new ParameterEntityEndXToken('someEntity2'));
            validator.write(new GeneralEntityDeclarationXToken('intDeclEntity', []));
            validator.write(new InternalSubsetEndXToken());
            validator.write(new ElementStartXToken('testEl', []));
            validator.write(new GeneralEntityStartXToken('extDeclEntity'));
            validator.end();

            expectNoErrors(validator, done);
         });

         it('reports an error if the referenced entity is externally declared in parameter entity expansion and standlone=yes (§2.9)', (done) => {
            validator.write(new XmlDeclarationXToken(1.0, undefined, true));
            validator.write(new InternalSubsetStartXToken());
            validator.write(new ParameterEntityStartXToken('someEntity'));
            validator.write(new GeneralEntityDeclarationXToken('extDeclEntity1', []));
            validator.write(new ParameterEntityEndXToken('someEntity'));
            validator.write(new ParameterEntityStartXToken('someEntity2'));
            validator.write(new ParameterEntityStartXToken('someEntity3'));
            validator.write(new GeneralEntityStartXToken('someEntity4'));
            validator.write(new GeneralEntityDeclarationXToken('extDeclEntity2', []));
            validator.write(new GeneralEntityEndXToken('someEntity4'));
            validator.write(new ParameterEntityEndXToken('someEntity3'));
            validator.write(new ParameterEntityEndXToken('someEntity2'));
            validator.write(new InternalSubsetEndXToken());
            validator.write(new ElementStartXToken('testEl', []));
            validator.write(new GeneralEntityStartXToken('extDeclEntity1'));
            validator.write(new GeneralEntityStartXToken('extDeclEntity2'));
            validator.end();

            const expected1 = new ValidityError(ValidityError.ID.ENTITY_EXTERNAL_DECLARED,
               [ 'extDeclEntity1' ]);
            const expected2 = new ValidityError(ValidityError.ID.ENTITY_EXTERNAL_DECLARED,
               [ 'extDeclEntity2' ]);
            expectStream(validator, [ expected1, expected2 ], done);
         });

         it('is reported as an error if in an attribute and is externally declared and standlone=yes (§2.9)', (done) => {
            validator.write(new XmlDeclarationXToken(1.0, undefined, true));
            validator.write(new ExternalSubsetStartXToken());
            validator.write(new GeneralEntityDeclarationXToken('extDeclEntity', []));
            validator.write(new ExternalSubsetEndXToken());
            validator.write(new ElementStartXToken('testEl', [{
               name: 'testElAttr',
               value: [ new GeneralEntityStartXToken('extDeclEntity') ],
            }]))
            validator.end();

            const expected = new ValidityError(ValidityError.ID.ATTRIBUTE_ENTITY_EXTERNAL_DECLARED,
               [ 'extDeclEntity', 'testElAttr' ]);
            expectStream(validator, expected, done);
         });

         it('is not reported as an error if in an attribute and is externally declared and standlone=no (§2.9)', (done) => {
            validator.write(new XmlDeclarationXToken(1.0, undefined, false));
            validator.write(new ExternalSubsetStartXToken());
            validator.write(new GeneralEntityDeclarationXToken('extDeclEntity', []));
            validator.write(new ExternalSubsetEndXToken());
            validator.write(new ElementStartXToken('testEl', [{
               name: 'testElAttr',
               value: [ new GeneralEntityStartXToken('extDeclEntity') ],
            }]))
            validator.end();

            expectNoErrors(validator, done);
         });

         it('is reported as an error if multiple in an attribute and all are externally declared and standlone=yes (§2.9)', (done) => {
            validator.write(new XmlDeclarationXToken(1.0, undefined, true));
            validator.write(new ExternalSubsetStartXToken());
            validator.write(new GeneralEntityDeclarationXToken('extDeclEntity1', []));
            validator.write(new GeneralEntityDeclarationXToken('extDeclEntity2', []));
            validator.write(new ExternalSubsetEndXToken());
            validator.write(new ElementStartXToken('testEl', [{
               name: 'testElAttr',
               value: [
                  new GeneralEntityStartXToken('extDeclEntity1'),
                  new GeneralEntityEndXToken('extDeclEntity1'),
                  new GeneralEntityStartXToken('extDeclEntity2'),
                  new GeneralEntityEndXToken('extDeclEntity2'),
               ],
            }]))
            validator.end();

            const expected1 = new ValidityError(ValidityError.ID.ATTRIBUTE_ENTITY_EXTERNAL_DECLARED,
               [ 'extDeclEntity1', 'testElAttr' ]);
            const expected2 = new ValidityError(ValidityError.ID.ATTRIBUTE_ENTITY_EXTERNAL_DECLARED,
               [ 'extDeclEntity2', 'testElAttr' ]);
            expectStream(validator, [expected1, expected2], done);
         });

         it('is reported as an error if it is top-level externally  embedded in another and standlone=yes (§2.9)', (done) => {
            validator.write(new XmlDeclarationXToken(1.0, undefined, true));
            validator.write(new ExternalSubsetStartXToken());
            validator.write(new GeneralEntityDeclarationXToken('extDeclEntity1', []));
            validator.write(new GeneralEntityDeclarationXToken('extDeclEntity2', []));
            validator.write(new ExternalSubsetEndXToken());
            validator.write(new ElementStartXToken('testEl', [{
               name: 'testElAttr',
               value: [
                  new GeneralEntityStartXToken('extDeclEntity1'),
                  new GeneralEntityStartXToken('extDeclEntity2'),
                  new GeneralEntityEndXToken('extDeclEntity2'),
                  new GeneralEntityEndXToken('extDeclEntity1'),
               ],
            }]))
            validator.end();

            const expected1 = new ValidityError(ValidityError.ID.ATTRIBUTE_ENTITY_EXTERNAL_DECLARED,
               [ 'extDeclEntity1', 'testElAttr' ]);
            expectStream(validator, expected1, done);
         });

         it('is reported as an error if it is top-level externally declared and standlone=yes (§2.9)', (done) => {
               validator.write(new XmlDeclarationXToken(1.0, undefined, true));
            validator.write(new ExternalSubsetStartXToken());
            validator.write(new GeneralEntityDeclarationXToken('extParamEntity', []));
            validator.write(new ExternalSubsetEndXToken());
            validator.write(new GeneralEntityDeclarationXToken('intGenEntity', []));
            validator.write(new ElementStartXToken('testEl', [{
               name: 'testElAttr',
               value: [
                  new GeneralEntityStartXToken('intGenEntity'),
                  new ParameterEntityStartXToken('extParamEntity'),
                  new ParameterEntityEndXToken('extParamEntity'),
                  new GeneralEntityEndXToken('intGenEntity'),
               ],
            }]))
            validator.end();

            const expected1 = new ValidityError(ValidityError.ID.ATTRIBUTE_PARAMENTITY_EXTERNAL_DECLARED,
               [ 'extParamEntity', 'testElAttr' ]);
            expectStream(validator, expected1, done);
         });

         it('is reported as an error it is an embedded externally declared and standlone=yes (§2.9)', (done) => {
               validator.write(new XmlDeclarationXToken(1.0, undefined, true));
            validator.write(new InternalSubsetStartXToken());
            validator.write(new GeneralEntityDeclarationXToken('extDeclEntity1', []));
            validator.write(new InternalSubsetEndXToken());
            validator.write(new ExternalSubsetStartXToken());
            validator.write(new GeneralEntityDeclarationXToken('extDeclEntity2', []));
            validator.write(new ExternalSubsetEndXToken());
            validator.write(new ElementStartXToken('testEl', [{
               name: 'testElAttr',
               value: [
                  new GeneralEntityStartXToken('extDeclEntity1'),
                  new GeneralEntityStartXToken('extDeclEntity2'),
                  new GeneralEntityEndXToken('extDeclEntity2'),
                  new GeneralEntityEndXToken('extDeclEntity1'),
               ],
            }]))
            validator.end();

            const expected1 = new ValidityError(ValidityError.ID.ATTRIBUTE_ENTITY_EXTERNAL_DECLARED,
               [ 'extDeclEntity2', 'testElAttr' ]);
            expectStream(validator, expected1, done);
         });

         it('is reported as an error if used as an ENTITY attribute value and standlone=yes (§2.9)', (done) => {
               validator.write(new XmlDeclarationXToken(1.0, undefined, true));
            validator.write(new ElementDeclaration('testEl', 'ANY'));
            validator.write(new attListDeclaration.XToken('testEl', [{
               name: 'entityAttr',
               type: 'ENTITY',
               value: [],
               defaultType: '#REQUIRED',
            }]));
            validator.write(new ExternalSubsetStartXToken());
            validator.write(new GeneralEntityDeclarationXToken('extDeclEntity', []));
            validator.write(new ExternalSubsetEndXToken());
            validator.write(new ElementStartXToken('testEl', [{
               name: 'entityAttr',
               value: [
                  new TextXToken('extDeclEntity'),
               ],
            }]))
            validator.end();

            const expected1 = new ValidityError(ValidityError.ID.ATTRIBUTE_ENTITY_EXTERNAL_DECLARED,
               [ 'extDeclEntity', 'entityAttr' ]);
            expectStream(validator, expected1, done);
         });

         it('is reported as an error if externally declared and referenced from attr default and standlone=yes (§2.9)', (done) => {
               validator.write(new XmlDeclarationXToken(1.0, undefined, true));
            validator.write(new InternalSubsetStartXToken());
            validator.write(new ParameterEntityStartXToken('someEntity'));
            validator.write(new GeneralEntityDeclarationXToken('extDeclEntity', []));
            validator.write(new ParameterEntityEndXToken('someEntity'));
            validator.write(new InternalSubsetStartXToken());
            validator.write(new ElementDeclaration('testEl', 'ANY'));
            validator.write(new attListDeclaration.XToken('testEl', [{
               name: 'cdataAttr',
               type: 'CDATA',
               value: [
                  new GeneralEntityStartXToken('extDeclEntity'),
                  new GeneralEntityEndXToken('extDeclEntity'),
               ],
               defaultType: '#REQUIRED',
            }]));
            validator.end();

            const expected1 = new ValidityError(ValidityError.ID.ATTLISTDECL_ENTITY_EXTERNAL_DECLARED,
               [ 'extDeclEntity', 'cdataAttr' ]);
            expectStream(validator, expected1, done);
         });

         it('is reported as an error if parameter entity externally declared and referenced from attr default and standlone=yes (§2.9)', (done) => {
               validator.write(new XmlDeclarationXToken(1.0, undefined, true));
            validator.write(new InternalSubsetStartXToken());
            validator.write(new ParameterEntityStartXToken('someEntity'));
            validator.write(new ParameterEntityDeclarationXToken('extDeclParamEntity', []));
            validator.write(new ParameterEntityEndXToken('someEntity'));
            validator.write(new GeneralEntityDeclarationXToken('intDeclEntity', []));
            validator.write(new ElementDeclaration('testEl', 'ANY'));
            validator.write(new attListDeclaration.XToken('testEl', [{
               name: 'cdataAttr',
               type: 'CDATA',
               value: [
                  new GeneralEntityStartXToken('intDeclEntity'),
                  new ParameterEntityStartXToken('extDeclParamEntity'),
                  new ParameterEntityEndXToken('extDeclParamEntity'),
                  new GeneralEntityEndXToken('intDeclEntity'),
               ],
               defaultType: '#REQUIRED',
            }]));
            validator.write(new InternalSubsetStartXToken());
            validator.end();

            const expected1 = new ValidityError(ValidityError.ID.ATTLISTDECL_PARAMENTITY_EXTERNAL_DECLARED,
               [ 'extDeclParamEntity', 'cdataAttr' ]);
            expectStream(validator, expected1, done);
         });

         it('is reported as an error if parameter entity externally declared and referenced from attr and standlone=yes (§2.9)', (done) => {
               validator.write(new XmlDeclarationXToken(1.0, undefined, true));
            validator.write(new ExternalSubsetStartXToken()); // Really should be an expanded PERef
            validator.write(new ParameterEntityDeclarationXToken('extDeclParamEntity', []));
            validator.write(new ExternalSubsetEndXToken());
            validator.write(new GeneralEntityDeclarationXToken('intDeclEntity', []));
            validator.write(new ElementDeclaration('testEl', 'ANY'));
            validator.write(new ElementStartXToken('testEl', []));
            validator.write(new GeneralEntityStartXToken('intDeclEntity'));
            validator.write(new ParameterEntityStartXToken('extDeclParamEntity'));
            validator.write(new ParameterEntityEndXToken('extDeclParamEntity'));
            validator.write(new GeneralEntityEndXToken('intDeclEntity'));
            validator.end();

            const expected1 = new ValidityError(ValidityError.ID.PARAMENTITY_EXTERNAL_DECLARED,
               [ 'extDeclParamEntity' ]);
            expectStream(validator, expected1, done);
         });

         it('is reported as an error if externally declared and used as an ENTITY attribute default and standlone=yes (§2.9)', (done) => {
               validator.write(new XmlDeclarationXToken(1.0, undefined, true));
            validator.write(new ExternalSubsetStartXToken()); // Really should be an expanded PERef
            validator.write(new GeneralEntityDeclarationXToken('extDeclEntity', []));
            validator.write(new ExternalSubsetEndXToken());
            validator.write(new ElementDeclaration('testEl', 'ANY'));
            validator.write(new attListDeclaration.XToken('testEl', [{
               name: 'entityAttr',
               type: 'ENTITY',
               value: [
                  new TextXToken('extDeclEntity'),
               ],
               defaultType: '#REQUIRED',
            }]));
            validator.end();

            const expected1 = new ValidityError(ValidityError.ID.ATTLISTDECL_ENTITY_EXTERNAL_DECLARED,
               [ 'extDeclEntity', 'entityAttr' ]);
            expectStream(validator, expected1, done);
         });

         it('is reported as an error if externally declared and used as an ENTITIES attribute default and standlone=yes (§2.9)', (done) => {
               validator.write(new XmlDeclarationXToken(1.0, undefined, true));
            validator.write(new ExternalSubsetStartXToken()); // Really should be an expanded PERef
            validator.write(new GeneralEntityDeclarationXToken('extDeclEntity', []));
            validator.write(new ExternalSubsetEndXToken());
            validator.write(new ElementDeclaration('testEl', 'ANY'));
            validator.write(new attListDeclaration.XToken('testEl', [{
               name: 'entityAttr',
               type: 'ENTITIES',
               value: [
                  new TextXToken('extDeclEntity'),
               ],
               defaultType: '#REQUIRED',
            }]));
            validator.end();

            const expected1 = new ValidityError(ValidityError.ID.ATTLISTDECL_ENTITY_EXTERNAL_DECLARED,
               [ 'extDeclEntity', 'entityAttr' ]);
            expectStream(validator, expected1, done);
         });

         it('is reported as an error if it is a parameter entity reference to an external declaration (§2.9)', (done) => {
               validator.write(new XmlDeclarationXToken(1.0, undefined, true));
            validator.write(new ExternalSubsetStartXToken()); // Really should be an expanded PERef
            validator.write(new ParameterEntityDeclarationXToken('extDeclEntity', []));
            validator.write(new ExternalSubsetEndXToken());
            validator.write(new InternalSubsetStartXToken());
            validator.write(new ParameterEntityStartXToken('extDeclEntity'));
            validator.write(new ParameterEntityEndXToken('extDeclEntity'));
            validator.write(new InternalSubsetEndXToken());
            validator.end();

            const expected1 = new ValidityError(ValidityError.ID.PARAMENTITY_EXTERNAL_DECLARED,
               [ 'extDeclEntity' ]);
            expectStream(validator, expected1, done);
         });

         it('is not reported as an error if it is a parameter entity reference to an external declaration (§2.9)', (done) => {
               validator.write(new XmlDeclarationXToken(1.0, undefined, true));
            validator.write(new InternalSubsetStartXToken());
            validator.write(new ParameterEntityDeclarationXToken('intDeclEntity', []));
            validator.write(new ParameterEntityStartXToken('intDeclEntity'));
            validator.write(new ParameterEntityEndXToken('intDeclEntity'));
            validator.write(new InternalSubsetEndXToken());
            validator.end();

            expectNoErrors(validator, done);
         });
      });

      describe('Error tokens', () => {

         it('ignores Errors when doing overall contextual checking', (done) => {
            const elDecl1 = new elementDeclaration.XToken('one', 'ANY', undefined);
            const startToken = new ElementStartXToken('one', [], new ElementStartPToken({ open: SToken.fromString('foo')}));

            validator.write(elDecl1);
            validator.write(startToken);
            validator.write(new WellFormedError(WellFormedError.ID.ELEMENTDECL_NO_NAME, [ 'x' ]));
            validator.end();

            gatherTokens(validator, (tokens) => {
               const errors = tokens.filter((token: any) => token.type === ERROR_TYPE);

               expect(errors.length).toBe(1);
               done();
            });
         });

      });

      describe('content', () => {
         describe('ANY', () => {
            const commentToken = new CommentXToken('testComment');
            const piToken = new ProcessingInstructionXToken('test', 'pi');
            const cDataToken = new CdataXToken('testCData');
            const elementStartToken = new ElementStartXToken('one', []);

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
                  const startToken = new ElementStartXToken('one', []);

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
               const startToken = new ElementStartXToken('one', []);
               const undeclaredToken = new ElementStartXToken('two', []);

               validator.write(elementDecl);
               validator.write(startToken);
               validator.write(undeclaredToken);
               validator.end();

               const errorToken = new ValidityError(ValidityError.ID.ANY_UNDECLARED_ELEMENT, [ 'one', 'two' ]);

               expectStream(validator, errorToken, done);
            });

            it('reports an error if a completely unsupported bit of markup shows up', (done) => {
               const elementDecl = new elementDeclaration.XToken('one', 'ANY');
               const startToken = new ElementStartXToken('one', []);

               validator.write(elementDecl);
               validator.write(startToken);
               validator.write(elementDecl);
               validator.end();

               const errorToken = new ValidityError(ValidityError.ID.ANY_XTRA_MARKUP, [ 'one' ]);

               expectStream(validator, errorToken, done);
            });

            it('reports errors even when no ptoken is present', (done) => {
               const elementDecl = new elementDeclaration.XToken('one', 'ANY');
               const startToken = new ElementStartXToken('one', []);

               validator.write(elementDecl);
               validator.write(startToken);
               validator.write(elementDecl);
               validator.end();

               const errorToken = new ValidityError(ValidityError.ID.ANY_XTRA_MARKUP, [ 'one' ]);

               expectStream(validator, errorToken, done);
            });

            it('reports no errors when passing char data through it', (done) => {
               const elementDecl = new elementDeclaration.XToken('one', 'ANY');
               const characters = new CharDataXToken('one');

               validator.write(elementDecl);
               validator.write(characters);
               validator.end();

               expectNoErrors(validator, done);
            });

            it('reports an error when passing char data through it for 1.0/1 (§3.0.0)', (done) => {
               const emd = new EntityMetaData(EntityKind.DOCUMENT, 1, 1);
               const elementDecl = new elementDeclaration.XToken('one', 'ANY');
               const startToken = new ElementStartXToken('one', []);
               const characters = new CharDataXToken('one');

               validator.write(emd);
               validator.write(elementDecl);
               validator.write(startToken);
               validator.write(characters);
               validator.end();

               const errorToken = new ValidityError(ValidityError.ID.ANY_XTRA_MARKUP, [ 'one' ]);
               expectStream(validator, errorToken, done);
            });

         });

         describe('EMPTY', () => {

            it('reports an error if anything appears in an element declared to be EMPTY', (done) => {
               const elementDecl = new elementDeclaration.XToken('one', 'EMPTY', undefined);
               const elStart = new ElementStartXToken('one', []);
               const elTwo = new ElementStartXToken('one', []);

               validator.write(elementDecl);
               validator.write(elStart);
               validator.write(elTwo);
               validator.end();

               const expected = new ValidityError(ValidityError.ID.CONTENT_IN_EMPTY_ELEMENT, [ 'one' ]);
               expectStream(validator, expected, done);
            });

            it('reports an error if a comment appears in an element declared to be EMPTY (§3.0.0)', (done) => {
               const elementDecl = new elementDeclaration.XToken('one', 'EMPTY', undefined);
               const elStart = new ElementStartXToken('one', []);
               const comment = new CommentXToken('one');

               validator.write(elementDecl);
               validator.write(elStart);
               validator.write(comment);
               validator.end();

               const expected = new ValidityError(ValidityError.ID.CONTENT_IN_EMPTY_ELEMENT, [ 'one' ]);
               expectStream(validator, expected, done);
            });

            it('reports an error if space appears in an element declared to be EMPTY in 1.0/5 (§3.0.0)', (done) => {
               const elementDecl = new elementDeclaration.XToken('one', 'EMPTY', undefined);
               const elStart = new ElementStartXToken('one', []);
               const space = new SpaceXToken('  ');

               validator.write(elementDecl);
               validator.write(elStart);
               validator.write(space);
               validator.end();

               const expected = new ValidityError(ValidityError.ID.CONTENT_IN_EMPTY_ELEMENT, [ 'one' ]);
               expectStream(validator, expected, done);
            });

            it('reports no error if space appears in an element declared to be EMPTY in 1.0/1 (§3.0.0)', (done) => {
               const emd = new EntityMetaData(EntityKind.DOCUMENT, 1, 1);
               const elementDecl = new elementDeclaration.XToken('one', 'EMPTY', undefined);
               const elStart = new ElementStartXToken('one', []);
               const space = new SpaceXToken('  ');

               validator.write(emd);
               validator.write(elementDecl);
               validator.write(elStart);
               validator.write(space);
               validator.end();

               gatherTokens(validator, (tokens) => {
                  expect(tokens.length).toEqual(5);
                  expect(tokens[2].id).toEqual(XmlWarning.ID.ELEMENT_WITH_EMPTY_DECL);
                  done();
               });
            });

            it('reports no error if only an empty tag appears in an EMPTY element', (done) => {
               const elementDecl = new elementDeclaration.XToken('one', 'EMPTY', undefined);
               const elStart = new ElementEmptyXToken('one', []);

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
               const elStart = new ElementStartXToken('one', []);
               const elEnd = new ElementEndXToken('one');

               validator.write(elementDecl);
               validator.write(elStart);
               validator.write(elEnd);
               validator.end();

               gatherTokens(validator, (tokens) => {
                  expect(tokens.length).toEqual(4);
                  done();
               });
            });

            it('reports a warning if a start tag is used for an element declared to be empty', (done) => {
               const elementDecl = new elementDeclaration.XToken('one', 'EMPTY', undefined);
               const elStart = new ElementStartXToken('one', []);

               validator.write(elementDecl);
               validator.write(elStart);
               validator.end();

               const expected = new XmlWarning(XmlWarning.ID.ELEMENT_WITH_EMPTY_DECL, [ 'one' ]);
               expectStream(validator, expected, done);
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
               const elStart = new ElementStartXToken('one', []);
               const child = new ElementStartXToken('sub', []);

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
               const elStart = new ElementStartXToken('one', []);
               const elEnd = new ElementEndXToken('one');
               const child = new ElementStartXToken('two', []);
               const childEnd = new ElementEndXToken('two');
               const thirdStart = new ElementStartXToken('three', []);

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

               const commentToken = new CommentXToken('stuff');
               const elStart = new ElementStartXToken('one', []);

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
               const elStart = new ElementStartXToken('one', []);

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
               const commentToken = new CommentXToken('stuff');
               const elStart = new ElementStartXToken('one', []);

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
               const elStart = new ElementStartXToken('one', []);

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
               validator.write(new ElementStartXToken('one', []));
               validator.write(new CharDataXToken('test charData'));
               validator.write(new CdataXToken('test CDATA'));
               validator.write(new CharDataXToken(' '));
               validator.write(new ElementEndXToken('one'));
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
               validator.write(new ElementStartXToken('one', []));
               validator.write(new GeneralEntityStartXToken('testEntityStart'));
               validator.write(new GeneralEntityEndXToken('testEntityEnd'));
               validator.write(new ElementEndXToken('one'));
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
               validator.write(new ElementStartXToken('one', []));
               validator.write(new GeneralEntityReferenceXToken('testEntiyReference'));
               validator.end();

               const expected = new ValidityError(ValidityError.ID.MIXED_XTRA_MARKUP, [ 'one' ]);
               expectStream(validator, expected, done);
            });

         });

         describe('CHILDREN', () => {
            const commentToken = new CommentXToken('testComment');
            const piToken = new ProcessingInstructionXToken('test', 'pi');
            const cDataToken = new CdataXToken('testCData');
            const nonWhiteChars = new CharDataXToken('one');
            const whiteChars = new CharDataXToken(' \t\n');

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
               [ new SpaceXToken('  '), 1.0, 1, false ],
               [ new GeneralEntityReferenceXToken('x'), 1.0, 1, false ],
               [ new GeneralEntityStartXToken('y'), 1.0, 1, false ],
               [ new GeneralEntityEndXToken('z'), 1.0, 1, false ],
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
                  const startToken = new ElementStartXToken('one', []);

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

            it('converts chardata that is just whitespace into space tokens', (done) => {
               const elementDecl = new elementDeclaration.XToken('one', 'CHILDREN', {
                  names: [{
                     name: 'child',
                     repeat: 'ONE'
                  }],
                  repeat: 'ONE',
                  listType: 'CHOICE'
               });

               validator.write(elementDecl);
               validator.write(new ElementStartXToken('one', []));
               validator.write(new CharDataXToken(' '));
               validator.write(new ElementStartXToken('child', []));
               validator.end();

               gatherTokens(validator, (tokens) => {
                  expect(tokens[3].type).toEqual(SPACE_XTOKEN);
                  done();
               });
            });

            it('copes with an XToken with no namelist', (done) => {
               const elementDecl = new elementDeclaration.XToken('one', 'CHILDREN', undefined);
               const elStart = new ElementStartXToken('one', []);
               const child = new ElementStartXToken('sub', []);

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
               const elStart = new ElementStartXToken('one', []);
               const elEnd = new ElementEndXToken('one');

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
               const elStart = new ElementStartXToken('one', []);
               const elMiddle = new ElementEmptyXToken('two', []);
               const elEnd = new ElementEndXToken('one');

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
               const elStart = new ElementStartXToken('one', []);
               const elMiddle = new ElementEmptyXToken('four', []);
               const elEnd = new ElementEndXToken('one');

               validator.write(elementDecl2);
               validator.write(elementDecl1);
               validator.write(elStart);
               validator.write(elMiddle);
               validator.write(elEnd);
               validator.end();

               const expected = new ValidityError(ValidityError.ID.INVALID_ELEMENT_IN_CONTENT, [ 'one', 'four' ]);
               expectStream(validator, expected, done);
            });

            it('reports an error if an element with element content is externally declared and standalone=yes (§2.9)', (done) => {
               validator.write(new XmlDeclarationXToken(1.0, undefined, true));
               validator.write(new ExternalSubsetStartXToken());
               validator.write(new ElementDeclaration('extDeclaredElement', 'CHILDREN', {
                  names: [{
                     name: 'child',
                     repeat: 'ONE',
                  }],
                  listType: 'CHOICE',
                  repeat: 'ONE',
               }));
               validator.write(new ExternalSubsetEndXToken());
               validator.write(new ElementStartXToken('extDeclaredElement', []));
               validator.write(new SpaceXToken('  '));
               validator.write(new ElementEndXToken('extDeclaredElement'));
               validator.end();

               const expected = new ValidityError(ValidityError.ID.CHILDREN_SPACE_EXTERNAL_DECLARED,
                  [ 'extDeclaredElement' ]);
               expectStream(validator, expected, done);
            });

            it('reports only one error if an element with element content has many spaces in it and is externally declared and standalone=yes (§2.9)', (done) => {
               validator.write(new XmlDeclarationXToken(1.0, undefined, true));
               validator.write(new ExternalSubsetStartXToken());
               validator.write(new ElementDeclaration('extDeclaredElement', 'CHILDREN', {
                  names: [{
                     name: 'child',
                     repeat: 'ONE',
                  }],
                  listType: 'CHOICE',
                  repeat: 'ONE',
               }));
               validator.write(new ExternalSubsetEndXToken());
               validator.write(new ElementStartXToken('extDeclaredElement', []));
               validator.write(new SpaceXToken('  '));
               validator.write(new SpaceXToken('  '));
               validator.write(new SpaceXToken('  '));
               validator.write(new ElementEndXToken('extDeclaredElement'));
               validator.end();

               const expected = new ValidityError(ValidityError.ID.CHILDREN_SPACE_EXTERNAL_DECLARED,
                  [ 'extDeclaredElement' ]);
               gatherTokens(validator, (tokens) => {
                  let count = 0;

                  for (const token of tokens) {
                     if (token.id === ValidityError.ID.CHILDREN_SPACE_EXTERNAL_DECLARED) {
                        count++;
                     }
                  }

                  expect(count).toEqual(1);
                  done();
               });
            });
         });
      });
   });

});
