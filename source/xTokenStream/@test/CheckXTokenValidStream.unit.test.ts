/* Copyright ® 2017-2019 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { Transform } from 'stream';

import * as basic from 'basic';
import { ConformanceVersion } from 'basic';
import { ValidityError, WellFormedError, ERROR_TYPE, XmlWarning } from 'error';
import { SToken } from 'sToken';
import { GeneralEntityDeclarationXToken, ParameterEntityDeclarationXToken, } from 'xToken';
import {
   SPACE_XTOKEN,

   CdataXToken,
   CharDataXToken,
   CommentXToken,
   DocTypeEndXToken,
   DocTypeStartXToken,
   ElementEmptyXToken,
   ElementEndXToken,
   ElementStartPToken,
   ElementStartXToken,
   SpaceXToken,
   ExternalSubsetStartToken,
   ExternalSubsetEndToken,
   GeneralEntityEndXToken,
   GeneralEntityStartXToken,
   InternalSubsetStartToken,
   InternalSubsetEndToken,
   ParameterEntityEndXToken,
   ParameterEntityStartXToken,     
   TextXToken,
} from 'token';
import { makeDocTypeEnd } from 'token-test';
import {
   AttListDeclarationXToken,
   CharRefXToken,
   CpRepeat,
   CpType,
   ElementDeclarationXToken,
   NotationDeclarationXToken,
   ParameterEntityReferenceXToken,
   GeneralEntityReferenceXToken,
   ProcessingInstructionXToken,
   XmlDeclarationXToken
} from 'xToken';


import CheckXTokenValidStream from '../CheckXTokenValidStream';


describe('CheckXTokenValidStream (unit)', () => {
   let validator: CheckXTokenValidStream;

   beforeEach(() => {
      validator = new CheckXTokenValidStream();
   });

   function gatherTokens(stream: Transform, cb: (tokens: any) => void) {
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
         let arrayExpected: Array<any> = [];

         if (!Array.isArray(expected)) {
            arrayExpected = [expected];
         }

         for (const expectedVal of arrayExpected) {
            (expect(tokens) as any).toHaveError(expectedVal); // typeHack
         }
         done();
      });
   }

   function expectNoErrorsOrWarnings(validator: CheckXTokenValidStream, done: () => void) {
      gatherTokens(validator, (tokens) => {
         (expect(tokens) as any).toBeErrorAndWarningFree(); // typeHack
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
         const dtStart = new DocTypeStartXToken('foo', undefined as any, false);
         const elStart = new ElementStartXToken('foo', []);

         validator.write(dtStart);
         validator.write(elStart);

         expect(validator.read()).toEqual(dtStart as any); // typeHack
         expect(validator.read()).toEqual(elStart as any); // typeHack
      });

      it('resumes passing through if end of stream reached', () => {
         const dtStart = new DocTypeStartXToken('foo', undefined as any, false);

         validator.write(dtStart);
         validator.end();

         expect(validator.read()).toEqual(dtStart as any); // typeHack
      });

      it('adds an error if the DOCTYPE name and the element start name do not match', () => {
         const dtStart = new DocTypeStartXToken('docTypeName', undefined as any, false);
         const elStart = new ElementStartXToken('elementName', []);

         validator.write(dtStart);
         validator.write(elStart);

         expect(validator.read()).toEqual(dtStart as any); // typeHack
         expect(validator.read()).toEqual(new ValidityError(ValidityError.ID.MISMATCH_ROOT_ELEMENT_TYPE,
            ['docTypeName', 'elementName']));
      });

      it('adds an error if the NOTATION name shows up more than once', (done) => {
         const nOne = new NotationDeclarationXToken('one');
         const nTwo = new NotationDeclarationXToken('one');

         validator.write(nOne);
         validator.write(nTwo);
         validator.end();

         const expected = new ValidityError(ValidityError.ID.NOTATION_NOT_UNIQUE, ['one']);
         expectStream(validator, expected, done);
      });

      it('adds no error if the NOTATION name shows up more than once and this is version 1.0/1', (done) => {
         const nOne = new NotationDeclarationXToken('one');
         const nTwo = new NotationDeclarationXToken('one');

         validator.write(new ConformanceVersion(1.0, 1));
         validator.write(nOne);
         validator.write(nTwo);
         validator.end();

         expectNoErrorsOrWarnings(validator, done);
      });

   });

   describe('write()', () => {

      describe('ElementStart tokens', () => {
         let attListDecl: AttListDeclarationXToken;

         beforeEach(() => {
            attListDecl = new AttListDeclarationXToken('one', [{
               name: 'first',
               type: 'CDATA',
               value: [],
               defaultType: 'yoiks',
            }]);
         });

         it('reports no error if the attribute is in the ATTLIST', (done) => {
            const elementDecl = new ElementDeclarationXToken('one', 'ANY', undefined);
            const startToken = new ElementStartXToken('one', [{
               name: 'first',
               value: []
            }]);

            validator.write(elementDecl);
            validator.write(attListDecl);
            validator.write(startToken);
            validator.end();

            expectNoErrorsOrWarnings(validator, done);
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
               ['one', 'notPresent']);
            expectStream(validator, expected, done);
         });

         it('allows for the start token to have no attributes', (done) => {
            const elementDecl = new ElementDeclarationXToken('one', 'ANY');
            const startToken = new ElementStartXToken('one', []);

            validator.write(elementDecl);
            validator.write(attListDecl);
            validator.write(startToken);
            validator.end();

            expectNoErrorsOrWarnings(validator, done);
         });

         it('allows for there not being an ATTLIST', (done) => {
            const startToken = new ElementStartXToken('one', [{
               name: 'notPresent',
               value: []
            }]);

            validator.write(startToken);
            validator.end();

            expectNoErrorsOrWarnings(validator, done);
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
               ['one', 'notPresent']);
            expectStream(validator, expected, done);
         });

         it('reports a warning if an empty element tag is used for an element not declared to be empty', (done) => {
            const elementDecl = new ElementDeclarationXToken('one', 'ANY', undefined);
            const emptyTag = new ElementEmptyXToken('one', []);

            validator.write(elementDecl);
            validator.write(emptyTag);
            validator.end();

            const expected = new XmlWarning(XmlWarning.ID.ELEMENT_EMPTY_WITH_NONEMPTY_DECL, ['one']);
            expectStream(validator, expected, done);
         });

         it('reports an error if a required attribute was not included on the attribute', (done) => {
            const elementDecl = new ElementDeclarationXToken('one', 'ANY', undefined);
            (attListDecl.attDefs as any).push({
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
               ['one', 'needed']);
            expectStream(validator, expected, done);
         });

         it('reports no error if a required attribute was specified', (done) => {
            const elementDecl = new ElementDeclarationXToken('one', 'ANY', undefined);
            attListDecl = new AttListDeclarationXToken(attListDecl.elementName, [...attListDecl.attDefs, 
            {
               name: 'needed',
               type: 'CDATA',
               value: [],
               defaultType: '#REQUIRED',
            }]);
            const startToken = new ElementStartXToken('one', [{
               name: 'needed',
               value: []
            }]);

            validator.write(elementDecl);
            validator.write(attListDecl);
            validator.write(startToken);
            validator.end();

            expectNoErrorsOrWarnings(validator, done);
         });

         it('reports an error if an attribute value has a reference to an entity that has no declaration (§4.1)', (done) => {
            const startToken = new ElementStartXToken('testEl', [{
               name: 'anAttr',
               value: [new GeneralEntityReferenceXToken('undeclared')],
            }]);

            validator.write(new XmlDeclarationXToken(1.0, undefined, true));
            validator.write(startToken);
            validator.end();

            const expected = new ValidityError(ValidityError.ID.ELEMENTSTART_REFERENCE_UNDEFINED,
               ['undeclared', 'anAttr', 'testEl']);
            expectStream(validator, expected, done);
         });

         describe('normalization', () => {

            it('replaces non-space white characters with spaces in CDATA', (done) => {
               const elDecl1 = new ElementDeclarationXToken('testEl', 'ANY', undefined);
               const attListDecl1 = new AttListDeclarationXToken('testEl', [{
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
               const elDecl1 = new ElementDeclarationXToken('testEl', 'ANY', undefined);
               const attListDecl1 = new AttListDeclarationXToken('testEl', [{
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
               validator.write(new ExternalSubsetStartToken());
               validator.write(new ElementDeclarationXToken('testEl', 'ANY', undefined));
               validator.write(new AttListDeclarationXToken('testEl', [{
                  name: 'idRefs',
                  type: 'IDREFS',
                  value: [],
                  defaultType: '#REQUIRED',
               }]));
               validator.write(new ExternalSubsetEndToken());
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
                  ['testEl', 'idRefs']);
               expectStream(validator, expected, done);
            });

            it('reports no error if standalone=no and external declaration for attribute, and attribute changes as a result', (done) => {
               validator.write(new XmlDeclarationXToken(1.0, undefined, false));
               validator.write(new ExternalSubsetStartToken());
               validator.write(new ElementDeclarationXToken('testEl', 'ANY', undefined));
               validator.write(new AttListDeclarationXToken('testEl', [{
                  name: 'idRefs',
                  type: 'IDREFS',
                  value: [],
                  defaultType: '#REQUIRED',
               }]));
               validator.write(new ExternalSubsetEndToken());
               validator.write(new ElementStartXToken('testEl', [{
                  name: 'idRefs',
                  value: [
                     new TextXToken('   one\ttwo'),
                     new TextXToken('\nthree '),
                     new TextXToken('four '),
                  ]
               }]));
               validator.end();

               expectNoErrorsOrWarnings(validator, done);
            });

            it('treats an unknown attribute as CDATA', (done) => {
               const elDecl1 = new ElementDeclarationXToken('testEl', 'ANY', undefined);
               const attListDecl1 = new AttListDeclarationXToken('testEl', [{
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
               const elDecl1 = new ElementDeclarationXToken('testEl', 'ANY', undefined);
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
               const elDecl1 = new ElementDeclarationXToken('testEl', 'ANY', undefined);
               const attListDecl1 = new AttListDeclarationXToken('testEl', [{
                  name: 'textAttr',
                  type: 'CDATA',
                  value: [new TextXToken('the default value')],
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
               const elDecl1 = new ElementDeclarationXToken('testEl', 'ANY', undefined);
               const attListDecl1 = new AttListDeclarationXToken('testEl', [{
                  name: 'textAttr',
                  type: 'CDATA',
                  value: [new TextXToken('the default value')],
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
               const elDecl1 = new ElementDeclarationXToken('testEl', 'ANY', undefined);
               const attListDecl1 = new AttListDeclarationXToken('testEl', [{
                  name: 'textAttr',
                  type: 'CDATA',
                  value: [new TextXToken('the default value')],
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
               const elDecl1 = new ElementDeclarationXToken('testEl', 'ANY', undefined);
               const attListDecl1 = new AttListDeclarationXToken('testEl', [{
                  name: 'textAttr',
                  type: 'CDATA',
                  value: [new TextXToken('the default value')],
                  defaultType: '',
               }]);
               const startToken1 = new ElementStartXToken('testEl', [{
                  name: 'textAttr',
                  value: [new TextXToken('original')]
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
               const elDecl1 = new ElementDeclarationXToken('testEl', 'ANY', undefined);
               const attListDecl1 = new AttListDeclarationXToken('testEl', [{
                  name: 'textAttr',
                  type: 'CDATA',
                  value: [new TextXToken('oneTwo')],
                  defaultType: '#FIXED',
               }]);
               const startToken1 = new ElementStartXToken('testEl', [{
                  name: 'textAttr',
                  value: [new TextXToken('oneT')]
               }]);

               validator.write(elDecl1);
               validator.write(attListDecl1);
               validator.write(startToken1);
               validator.end();

               const expected = new ValidityError(ValidityError.ID.ELEMENTSTART_FIXED_NOT_RIGHT,
                  ['testEl', 'textAttr', 'oneTwo', 'oneT']);
               expectStream(validator, expected, done);
            });

            it('reports no error if a #FIXED attribute matches the declared default', (done) => {
               const elDecl1 = new ElementDeclarationXToken('testEl', 'ANY', undefined);
               const attListDecl1 = new AttListDeclarationXToken('testEl', [{
                  name: 'textAttr',
                  type: 'CDATA',
                  value: [new TextXToken('oneTwo')],
                  defaultType: '#FIXED',
               }]);
               const startToken1 = new ElementStartXToken('testEl', [{
                  name: 'textAttr',
                  value: [new TextXToken('oneTwo')]
               }]);

               validator.write(elDecl1);
               validator.write(attListDecl1);
               validator.write(startToken1);
               validator.end();

               expectNoErrorsOrWarnings(validator, done);
            });

            it('reports no error if a #FIXED attribute is not specified on the start attribute', (done) => {
               const elDecl1 = new ElementDeclarationXToken('testEl', 'ANY', undefined);
               const attListDecl1 = new AttListDeclarationXToken('testEl', [{
                  name: 'textAttr',
                  type: 'CDATA',
                  value: [new TextXToken('oneTwo')],
                  defaultType: '#FIXED',
               }]);
               const startToken1 = new ElementStartXToken('testEl', []);

               validator.write(elDecl1);
               validator.write(attListDecl1);
               validator.write(startToken1);
               validator.end();

               expectNoErrorsOrWarnings(validator, done);
            });

            it('reports an error if an attribute default must be added, and the declration was external (§2.9)', (done) => {
               const elDecl1 = new ElementDeclarationXToken('testEl', 'ANY', undefined);
               const attListDecl1 = new AttListDeclarationXToken('testEl', [{
                  name: 'textAttr',
                  type: 'CDATA',
                  value: [new TextXToken('the default value')],
                  defaultType: '',
               }]);
               const startToken1 = new ElementStartXToken('testEl', []);

               validator.write(new XmlDeclarationXToken(1.0, undefined, true));
               validator.write(new ExternalSubsetStartToken());
               validator.write(elDecl1);
               validator.write(attListDecl1);
               validator.write(new ExternalSubsetEndToken());
               validator.write(startToken1);
               validator.end();

               const expected = new ValidityError(ValidityError.ID.ELEMENTSTART_DEFAULT_EXTERNAL_DECLARED,
                  ['testEl', 'textAttr']);
               expectStream(validator, expected, done);
            });

            it('reports no error if an attribute default must be added, and the declration was not external (§2.9)', (done) => {
               const elDecl1 = new ElementDeclarationXToken('testEl', 'ANY', undefined);
               const attListDecl1 = new AttListDeclarationXToken('testEl', [{
                  name: 'textAttr',
                  type: 'CDATA',
                  value: [new TextXToken('the default value')],
                  defaultType: '',
               }]);
               const startToken1 = new ElementStartXToken('testEl', []);

               validator.write(new XmlDeclarationXToken(1.0, undefined, true));
               validator.write(new InternalSubsetStartToken());
               validator.write(elDecl1);
               validator.write(attListDecl1);
               validator.write(new InternalSubsetEndToken());
               validator.write(startToken1);
               validator.end();

               expectNoErrorsOrWarnings(validator, done);
            });
         });

         describe('ID', () => {

            it('reports an error if an ID value is not a name', (done) => {
               const elDecl1 = new ElementDeclarationXToken('one', 'ANY', undefined);
               const attListDecl1 = new AttListDeclarationXToken('one', [{
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
                  ['$$BAD', 'one', 'idAttr']);
               expectStream(validator, expected, done);
            });

            it('it calls isName() with the entity meta data', (done) => {
               const elDecl1 = new ElementDeclarationXToken('one', 'ANY', undefined);
               const attListDecl1 = new AttListDeclarationXToken('one', [{
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

               validator.write(new ConformanceVersion(1.1, 2));
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
               const elDecl1 = new ElementDeclarationXToken('one', 'ANY', undefined);
               const attListDecl1 = new AttListDeclarationXToken('one', [{
                  name: 'idAttr',
                  type: 'ID',
                  value: [],
                  defaultType: '#REQUIRED',
               }]);
               const elDecl2 = new ElementDeclarationXToken('two', 'ANY', undefined);
               const attListDecl2 = new AttListDeclarationXToken('two', [{
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
                  ['test', 'two', 'id', 'one', 'idAttr']);
               expectStream(validator, expected, done);
            });

            it('reports an error if an ID value built from an entity reference is used twice', (done) => {
               const elDecl1 = new ElementDeclarationXToken('one', 'ANY', undefined);
               const attListDecl1 = new AttListDeclarationXToken('one', [{
                  name: 'idAttr',
                  type: 'ID',
                  value: [],
                  defaultType: '#REQUIRED',
               }]);
               const elDecl2 = new ElementDeclarationXToken('two', 'ANY', undefined);
               const attListDecl2 = new AttListDeclarationXToken('two', [{
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
                  ['test', 'two', 'id', 'one', 'idAttr']);
               expectStream(validator, expected, done);
            });
         });

         describe('IDREF attribute', () => {
            let elDecl: ElementDeclarationXToken;
            let endElName: any;
            let attListDecl: AttListDeclarationXToken;
            let startToken: ElementStartXToken;

            beforeEach(() => {
               elDecl = new ElementDeclarationXToken('testEl', 'ANY', undefined);
               attListDecl = new AttListDeclarationXToken('testEl', [{
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

               validator.write(new ConformanceVersion(1.1, 2));
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

               expectNoErrorsOrWarnings(validator, done);
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
                  ['$badName', 'testEl', 'idRefAttr']);
               expectStream(validator, expected, done);
            });

            it('reports an error if an IDREFS values are not all names', (done) => {
               attListDecl = new AttListDeclarationXToken('elName', [{
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
                  ['$badName, $anotherBadName', 'elName', 'idRefsAttr']);
               expectStream(validator, expected, done);
            });

            it('reports no error if an IDREF references an ID named before the IDREF is found', (done) => {
               attListDecl = new AttListDeclarationXToken('testEl', [{
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

               expectNoErrorsOrWarnings(validator, done);
            });

            it('reports no error if an IDREF references an ID named after the IDREF is found', (done) => {
               attListDecl = new AttListDeclarationXToken('testEl', [{
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

               expectNoErrorsOrWarnings(validator, done);
            });

            it('reports an error if an IDREF references an ID that is never found', (done) => {
               attListDecl = new AttListDeclarationXToken('testEl', [{
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
                  ['first', 'testEl', 'idRefAttr']);
               expectStream(validator, expected, done);
            });

            it('reports an error if an IDREFS references an ID that is never found', (done) => {
               const elDecl2 = new ElementDeclarationXToken('testEl2', 'ANY', undefined);
               const openSToken = SToken.fromString('<');
               const attListDecl2 = new AttListDeclarationXToken('testEl2', [{
                  name: 'idRefsAttr',
                  type: 'IDREFS',
                  value: [],
                  defaultType: '#REQUIRED',
               }]);
               const secondStartToken = new ElementStartXToken('testEl2', [{
                  name: 'idRefsAttr',
                  value: [
                     new TextXToken('goodName second third')
                  ]
               }], new ElementStartPToken({
                  open: openSToken,
               }));

               validator.write(elDecl);
               validator.write(elDecl2);
               validator.write(attListDecl);
               validator.write(attListDecl2);
               validator.write(secondStartToken);
               validator.write(startToken);
               validator.write(endElName);
               validator.write(new ElementEndXToken('testEl2'));
               validator.end();

               const expected = new ValidityError(ValidityError.ID.ELEMENTSTART_IDREF_NO_ID,
                  ['second', 'testEl2', 'idRefsAttr'], openSToken, openSToken);
               expectStream(validator, expected, done);
            });

         });

         describe('ENTITY attribute', () => {
            let elDecl: ElementDeclarationXToken;
            let attListDecl: AttListDeclarationXToken;
            let startToken: ElementStartXToken;

            beforeEach(() => {
               elDecl = new ElementDeclarationXToken('testElement', 'ANY', undefined);
               attListDecl = new AttListDeclarationXToken('testElement', [{
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
               validator.write(new NotationDeclarationXToken('nDataName'));
               validator.write(new GeneralEntityDeclarationXToken('goodName', [], undefined, 'nDataName'));
               validator.write(attListDecl);
               validator.write(startToken);
               validator.end();

               expectNoErrorsOrWarnings(validator, done);
            });

            it('it calls isName() with the entity meta data (whitebox)', (done) => {
               spyOn(basic, 'isName');

               validator.write(new ConformanceVersion(1.1, 2));
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
                  ['$badName', 'testElement', 'entityAttr']);
               expectStream(validator, expected, done);
            });

            it('reports an error if an ENTITIES values are not all names', (done) => {
               attListDecl = new AttListDeclarationXToken('testElement', [{
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
                  ['$badName, $anotherBadName', 'testElement', 'entitiesAttr']);
               expectStream(validator, expected, done);
            });

            it('reports an error if an ENTITY value names an unknown entity', (done) => {
               validator.write(elDecl);
               validator.write(attListDecl);
               validator.write(startToken);
               validator.end();

               const expected = new ValidityError(ValidityError.ID.ELEMENTSTART_ENTITY_NO_ENTITY,
                  ['goodName', 'testElement', 'entityAttr']);
               expectStream(validator, expected, done);
            });

            it('reports an error if an ENTITY value names a parsed entity', (done) => {
               validator.write(new GeneralEntityDeclarationXToken('goodName', [], undefined, undefined));
               validator.write(elDecl);
               validator.write(attListDecl);
               validator.write(startToken);
               validator.end();

               const expected = new ValidityError(ValidityError.ID.ELEMENTSTART_ENTITY_PARSED_ENTITY,
                  ['goodName', 'testElement', 'entityAttr']);
               expectStream(validator, expected, done);
            });

            it('reports an error if one or more ENTITIES names are unknown entities', (done) => {
               attListDecl = new AttListDeclarationXToken('testElement', [{
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
               validator.write(elDecl);
               validator.write(attListDecl);
               validator.write(startToken);
               validator.end();

               const expected = new ValidityError(ValidityError.ID.ELEMENTSTART_ENTITIES_NO_ENTITY,
                  ['one, two, three', 'testElement', 'entitiesAttr']);
               expectStream(validator, expected, done);
            });

            it('reports an error if an ENTITIES value names a parsed entity', (done) => {
               attListDecl = new AttListDeclarationXToken('testElement', [{
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

               validator.write(new GeneralEntityDeclarationXToken('one', [], undefined, undefined));
               validator.write(new GeneralEntityDeclarationXToken('two', [], undefined, undefined));
               validator.write(new GeneralEntityDeclarationXToken('three', [], undefined, undefined));
               validator.write(elDecl);
               validator.write(attListDecl);
               validator.write(startToken);
               validator.end();

               const expected = new ValidityError(ValidityError.ID.ELEMENTSTART_ENTITIES_PARSED_ENTITY,
                  ['one, two, three', 'testElement', 'entitiesAttr']);
               expectStream(validator, expected, done);
            });

         });

         describe('NMTOKEN attribute', () => {
            let elDecl: ElementDeclarationXToken;
            let attListDecl: AttListDeclarationXToken;
            let startToken: ElementStartXToken;

            beforeEach(() => {
               elDecl = new ElementDeclarationXToken('testElement', 'ANY', undefined);
               attListDecl = new AttListDeclarationXToken('testElement', [{
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

               validator.write(new ConformanceVersion(1.1, 2));
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

               expectNoErrorsOrWarnings(validator, done);
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
                  ['$badName', 'testElement', 'nmTokenAttr']);
               expectStream(validator, expected, done);
            });

            it('reports an error if an NMTOKENS attribute has values that are not all Nmtokens', (done) => {
               attListDecl = new AttListDeclarationXToken('testElement', [{
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
                  ['$badName, $anotherBadName', 'testElement', 'nmTokenAttr']);
               expectStream(validator, expected, done);
            });

         });

         describe('NOTATION attribute', () => {
            let n1: NotationDeclarationXToken;
            let n2: NotationDeclarationXToken;
            let elDecl: ElementDeclarationXToken;
            let attListDecl: AttListDeclarationXToken;
            let startToken: ElementStartXToken;

            beforeEach(() => {
               n1 = new NotationDeclarationXToken('first');
               n2 = new NotationDeclarationXToken('second');
               elDecl = new ElementDeclarationXToken('testElement', 'ANY', undefined);
               attListDecl = new AttListDeclarationXToken('testElement', [{
                  name: 'notationAttr',
                  type: 'NOTATION',
                  enumeration: ['first', 'second'],
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

               expectNoErrorsOrWarnings(validator, done);
            });

            it('reports an error when the enumeration is empty so any notation value is illegal', (done) => {
               attListDecl = new AttListDeclarationXToken(attListDecl.elementName, [{
                  name: 'notationAttr',
                  type: 'NOTATION',
                  value: [],
                  defaultType: '#REQUIRED',
               }]);

               validator.write(n1);
               validator.write(n2);
               validator.write(elDecl);
               validator.write(attListDecl);
               validator.write(startToken);
               validator.end();

               const expected = new ValidityError(ValidityError.ID.ELEMENTSTART_NOTATION_NOT_DECLARED,
                  ['first', 'testElement', 'notationAttr', '']);
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
                  ['third', 'testElement', 'notationAttr', 'first, second']);
               expectStream(validator, expected, done);
            });

         });

         describe('ENUMERATION attribute', () => {
            let elDecl: ElementDeclarationXToken;
            let attListDecl: AttListDeclarationXToken;
            let startToken: ElementStartXToken;

            beforeEach(() => {
               elDecl = new ElementDeclarationXToken('testElement', 'ANY', undefined);
               attListDecl = new AttListDeclarationXToken('testElement', [{
                  name: 'enumerationAttr',
                  type: 'ENUMERATION',
                  enumeration: ['first', 'second'],
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

               expectNoErrorsOrWarnings(validator, done);
            });

            it('reports no error when an the enumeration is empty', (done) => {
               attListDecl = new AttListDeclarationXToken(attListDecl.elementName, [{
                  name: 'enumerationAttr',
                  type: 'ENUMERATION',
                  value: [],
                  defaultType: '#REQUIRED',
               }]);

               validator.write(elDecl);
               validator.write(attListDecl);
               validator.write(startToken);
               validator.end();

               const expected = new ValidityError(ValidityError.ID.ELEMENTSTART_ENUMERATION_NOT_DECLARED,
                  ['first', 'testElement', 'enumerationAttr', '']);
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
                  ['third', 'testElement', 'enumerationAttr', 'first, second']);
               expectStream(validator, expected, done);
            });

         });

      });

      describe('EmptyElement tokens', () => {
         let attlist: AttListDeclarationXToken;
         let element;

         beforeEach(() => {
            attlist = new AttListDeclarationXToken('one', [{
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
               ['one', 'notPresent']);
            expectStream(validator, expected, done);
         });

         it('reports a warning if the ELEMENT declaration indicates that this element does not need to be EMPTY', (done) => {
            element = new ElementDeclarationXToken('one', 'ANY', undefined);
            const startToken = new ElementEmptyXToken('one', []);

            validator.write(element);
            validator.write(startToken);
            validator.end();

            const expected = new XmlWarning(XmlWarning.ID.ELEMENT_EMPTY_WITH_NONEMPTY_DECL, ['one']);
            expectStream(validator, expected, done);
         });

         it('reports a warning if a start tag is used for an element declared to be empty', (done) => {
            const elementDecl = new ElementDeclarationXToken('one', 'EMPTY', undefined);
            const elStart = new ElementStartXToken('one', []);

            validator.write(elementDecl);
            validator.write(elStart);
            validator.end();

            const expected = new XmlWarning(XmlWarning.ID.ELEMENT_WITH_EMPTY_DECL, ['one']);
            expectStream(validator, expected, done);
         });

      });

      describe('ATTLIST', () => {

         it('adds an error if the ATTLIST name shows up more than once', (done) => {
            const openSToken = SToken.fromString('<!');
            const aOne = new AttListDeclarationXToken('one', []);
            const aTwo = new AttListDeclarationXToken('one', []);

            validator.write(aOne);
            validator.write(aTwo);
            validator.end();

            const expected = new XmlWarning(XmlWarning.ID.ATTLISTDECL_ELEMENT_DUPLICATE, ['one']);
            expectStream(validator, expected, done);
         });

         it('does not blow up if the ATTLIST has no pToken', (done) => {
            const aOne = new AttListDeclarationXToken('one', []);
            const aTwo = new AttListDeclarationXToken('one', []);

            validator.write(aOne);
            validator.write(aTwo);
            validator.end();

            const expected = new XmlWarning(XmlWarning.ID.ATTLISTDECL_ELEMENT_DUPLICATE, ['one']);
            expectStream(validator, expected, done);
         });

         it('reports no warnings if the related ELEMENT declaration is already present', (done) => {
            const elDecl = new ElementDeclarationXToken('elementType', 'EMPTY', undefined);
            const attDecl = new AttListDeclarationXToken('elementType', []);

            validator.write(elDecl);
            validator.write(attDecl);
            validator.end();

            expectNoErrorsOrWarnings(validator, done);
         });

         it('reports a warning if the related ELEMENT declaration is not present', (done) => {
            const attListDecl = new AttListDeclarationXToken('elementType', []);

            validator.write(attListDecl);
            validator.end();

            const expected = new XmlWarning(XmlWarning.ID.ATTLISTDECL_NO_ELEMENTDECL,
               ['elementType',]);
            expectStream(validator, expected, done);
         });

         it('has no problems if the PToken is not provided', (done) => {
            const elDecl = new ElementDeclarationXToken('elementType', 'EMPTY', undefined);
            const attListDecl = new AttListDeclarationXToken('elementType', [{
               name: 'idAttr',
               type: 'ID',
               value: [],
               defaultType: '#IMPLIED',
            }]);

            validator.write(elDecl);
            validator.write(attListDecl);
            validator.end();

            expectNoErrorsOrWarnings(validator, done);
         });

         it('reports no errors if an ID attribute is well defined', (done) => {
            const elDecl = new ElementDeclarationXToken('elementType', 'EMPTY', undefined);
            const attListDecl = new AttListDeclarationXToken('elementType', [{
               name: 'idAttr',
               type: 'ID',
               value: [],
               defaultType: '#IMPLIED',
            }]);

            validator.write(elDecl);
            validator.write(attListDecl);
            validator.end();

            expectNoErrorsOrWarnings(validator, done);
         });

         it('reports an error if an attribute is of type ID but does not have value #IMPLIED or #REQUIRED', (done) => {
            const attListDecl = new AttListDeclarationXToken('elementType', [{
               name: 'idAttr',
               type: 'ID',
               value: [],
               defaultType: '',
            }]);

            validator.write(attListDecl);
            validator.end();

            const expected = new ValidityError(ValidityError.ID.ATTLISTDECL_ID_BAD_DEFAULT,
               ['elementType', 'idAttr', '']);
            expectStream(validator, expected, done);
         });

         it('reports an error if an ATTLIST for an element type has more than one attribute of type ID', (done) => {
            const endOfDocType = new DocTypeEndXToken();
            const attListDecl = new AttListDeclarationXToken('elementType', [{
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
               ['elementType', 'second']);
            expectStream(validator, expected, done);
         });

         describe('xml:space', () => {

            it('reports no error on an enumeration declaration with preserve and default as values ', (done) => {
               const elDecl = new ElementDeclarationXToken('elementType', 'EMPTY');
               const attListDecl = new AttListDeclarationXToken('elementType', [{
                  name: 'xml:space',
                  type: 'ENUMERATION',
                  enumeration: ['preserve', 'default'],
                  defaultType: '#REQUIRED',
                  value: [],
               }]);

               validator.write(elDecl);
               validator.write(attListDecl);
               validator.end();

               expectNoErrorsOrWarnings(validator, done);
            });

            it('reports no error on an enumeration declaration with just preserve', (done) => {
               const elDecl = new ElementDeclarationXToken('elementType', 'EMPTY');
               const attListDecl = new AttListDeclarationXToken('elementType', [{
                  name: 'xml:space',
                  type: 'ENUMERATION',
                  enumeration: ['preserve'],
                  defaultType: '',
                  value: [],
               }]);

               validator.write(elDecl);
               validator.write(attListDecl);
               validator.end();

               expectNoErrorsOrWarnings(validator, done);
            });

            it('reports an error the xml:space type is not an enumeration', (done) => {
               const elDecl = new ElementDeclarationXToken('elementType', 'EMPTY');
               const attListDecl = new AttListDeclarationXToken('elementType', [{
                  name: 'xml:space',
                  type: 'ID',
                  defaultType: '#REQUIRED',
                  value: [],
               }]);

               validator.write(elDecl);
               validator.write(attListDecl);
               validator.end();

               const expected = new ValidityError(ValidityError.ID.ATTLISTDECL_SPACE_BAD_TYPE,
                  ['elementType']);
               expectStream(validator, expected, done);
            });

            it('reports an error the xml:space type is an enumeration but the enumeration array is not present', (done) => {
               const elDecl = new ElementDeclarationXToken('elementType', 'EMPTY');
               const attListDecl = new AttListDeclarationXToken('elementType', [{
                  name: 'xml:space',
                  type: 'ENUMERATION',
                  defaultType: '#REQUIRED',
                  value: [],
               }]);

               validator.write(elDecl);
               validator.write(attListDecl);
               validator.end();

               const expected = new ValidityError(ValidityError.ID.ATTLISTDECL_SPACE_BAD_TYPE,
                  ['elementType']);
               expectStream(validator, expected, done);
            });

            it('reports an error the xml:space name is not lower case', (done) => {
               const elDecl = new ElementDeclarationXToken('elementType', 'EMPTY');
               const attListDecl = new AttListDeclarationXToken('elementType', [{
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
                  ['elementType', 'XML:SPACE']);
               expectStream(validator, expected, done);
            });

            it('reports an error the xml:space type has no enumerated values specified', (done) => {
               const elDecl = new ElementDeclarationXToken('elementType', 'EMPTY');
               const attListDecl = new AttListDeclarationXToken('elementType', [{
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
                  ['elementType']);
               expectStream(validator, expected, done);
            });

            it('reports an error the xml:space type has a value in the wrong case', (done) => {
               const elDecl = new ElementDeclarationXToken('elementType', 'EMPTY');
               const attListDecl = new AttListDeclarationXToken('elementType', [{
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
                  ['elementType', 'PRESERVE']);
               expectStream(validator, expected, done);
            });

            it('reports an error the xml:space type has an illegal value', (done) => {
               const elDecl = new ElementDeclarationXToken('elementType', 'EMPTY');
               const attListDecl = new AttListDeclarationXToken('elementType', [{
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
                  ['elementType', 'bogus']);
               expectStream(validator, expected, done);
            });

         });

         describe('ID', () => {

            it('calls isName() to validate name', (done) => {
               spyOn(basic, 'isName').and.returnValue(false);
               const elDecl = new ElementDeclarationXToken('elementType', 'EMPTY');
               const attListDecl = new AttListDeclarationXToken('elementType', [{
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
               const elDecl = new ElementDeclarationXToken('elementType', 'EMPTY');
               const attListDecl = new AttListDeclarationXToken('elementType', [{
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
                  ['elementType', 'idAttr', '$bad']);
               expectStream(validator, expected, done);
            });

         });

         describe('IDREF', () => {

            it('calls isName() to validate name', (done) => {
               spyOn(basic, 'isName').and.returnValue(false);
               const elDecl = new ElementDeclarationXToken('elementType', 'EMPTY');
               const attListDecl = new AttListDeclarationXToken('elementType', [{
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
               const elDecl = new ElementDeclarationXToken('elementType', 'EMPTY');
               const attListDecl = new AttListDeclarationXToken('elementType', [{
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
                  ['elementType', 'idRefAttr', '$bad']);
               expectStream(validator, expected, done);
            });

         });

         describe('IDREFS', () => {

            it('calls isName() to validate name', (done) => {
               spyOn(basic, 'isName').and.returnValue(false);
               const elDecl = new ElementDeclarationXToken('elementType', 'EMPTY');
               const attListDecl = new AttListDeclarationXToken('elementType', [{
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
               const elDecl = new ElementDeclarationXToken('elementType', 'EMPTY');
               const attListDecl = new AttListDeclarationXToken('elementType', [{
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
                  ['elementType', 'idRefsAttr', '$bad, $bad2']);
               expectStream(validator, expected, done);
            });

         });

         describe('ENTITY', () => {

            it('calls isName() to validate name', (done) => {
               spyOn(basic, 'isName').and.returnValue(false);
               const elDecl = new ElementDeclarationXToken('elementType', 'EMPTY');
               const attListDecl = new AttListDeclarationXToken('elementType', [{
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
               const elDecl = new ElementDeclarationXToken('elementType', 'EMPTY');
               const attListDecl = new AttListDeclarationXToken('elementType', [{
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
                  ['elementType', 'entityAttr', '$bad']);
               expectStream(validator, expected, done);
            });

         });

         describe('ENTITIES', () => {

            it('calls isName() to validate name', (done) => {
               spyOn(basic, 'isName').and.returnValue(false);
               const elDecl = new ElementDeclarationXToken('elementType', 'EMPTY');
               const attListDecl = new AttListDeclarationXToken('elementType', [{
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
               const elDecl = new ElementDeclarationXToken('elementType', 'EMPTY');
               const attListDecl = new AttListDeclarationXToken('elementType', [{
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
                  ['elementType', 'entitiesAttr', '$bad, $bad2']);
               expectStream(validator, expected, done);
            });

            it('reports no errors if the default value for an ENTITIES attribute are all good', (done) => {
               const elDecl = new ElementDeclarationXToken('elementType', 'EMPTY');
               const attListDecl = new AttListDeclarationXToken('elementType', [{
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

               expectNoErrorsOrWarnings(validator, done);
            });

         });


         describe('NMTOKEN', () => {

            it('calls util.isNmToken() to validate name', (done) => {
               spyOn(basic, 'isNmToken').and.returnValue(false);
               const elDecl = new ElementDeclarationXToken('elementType', 'EMPTY');
               const attListDecl = new AttListDeclarationXToken('elementType', [{
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
               const elDecl = new ElementDeclarationXToken('elementType', 'EMPTY');
               const attListDecl = new AttListDeclarationXToken('elementType', [{
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
                  ['elementType', 'nmTokenAttr', '$bad']);
               expectStream(validator, expected, done);
            });

         });

         describe('NMTOKENS', () => {

            it('calls util.isNmToken() to validate name', (done) => {
               spyOn(basic, 'isNmToken').and.returnValue(false);
               const elDecl = new ElementDeclarationXToken('elementType', 'EMPTY');
               const attListDecl = new AttListDeclarationXToken('elementType', [{
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
               const elDecl = new ElementDeclarationXToken('elementType', 'EMPTY');
               const attListDecl = new AttListDeclarationXToken('elementType', [{
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
                  ['elementType', 'nmTokensAttr', '$bad, $alsoBad']);
               expectStream(validator, expected, done);
            });

            it('reports no errors if the default value for an NMTOKENS attribute are all good', (done) => {
               const elDecl = new ElementDeclarationXToken('elementType', 'EMPTY');
               const attListDecl = new AttListDeclarationXToken('elementType', [{
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

               expectNoErrorsOrWarnings(validator, done);
            });

         });

         describe('NOTATION', () => {

            function setup(ver: ConformanceVersion) {
               const endOfDocType = new DocTypeEndXToken();
               const elDecl = new ElementDeclarationXToken('elementType', 'ANY', undefined);
               const attListDecl = new AttListDeclarationXToken('elementType', [{
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

               validator.write(ver);
               validator.write(elDecl);
               validator.write(attListDecl);
               validator.write(endOfDocType);
               validator.end();
            };

            function setupEmptyElement(ver: ConformanceVersion) {
               const endOfDocType = new DocTypeEndXToken();
               const elDecl = new ElementDeclarationXToken('elementType', 'EMPTY', undefined);
               const attListDecl = new AttListDeclarationXToken('elementType', [{
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

               validator.write(ver);
               validator.write(elDecl);
               validator.write(attListDecl);
               validator.write(endOfDocType);
               validator.end();
            };

            function setupDuplicateNotationValues(ver: ConformanceVersion) {
               const endOfDocType = new DocTypeEndXToken();
               const elDecl = new ElementDeclarationXToken('elementType', 'ANY', undefined);
               const notation1 = new NotationDeclarationXToken('first', undefined);
               const notation2 = new NotationDeclarationXToken('second', undefined);
               const notation3 = new NotationDeclarationXToken('third', undefined);
               const attListDecl = new AttListDeclarationXToken('elementType', [{
                  name: 'notationAttr',
                  type: 'NOTATION',
                  enumeration: ['first', 'second', 'first', 'third', 'third', 'first'],
                  value: [],
                  defaultType: '#IMPLIED',
               }]);

               validator.write(ver);
               validator.write(notation1);
               validator.write(notation2);
               validator.write(notation3);
               validator.write(elDecl);
               validator.write(attListDecl);
               validator.write(endOfDocType);
               validator.end();
            };

            it('reports an error if a notation value used in an ATTLIST has not been declared by end of DTD', (done) => {
               const elDecl = new ElementDeclarationXToken('elementType', 'EMPTY', undefined);
               const notation = new NotationDeclarationXToken('first', undefined);
               const attListDecl = new AttListDeclarationXToken('elementType', [{
                  name: 'notation1',
                  type: 'NOTATION',
                  enumeration: ['first', 'second'],
                  value: [],
                  defaultType: '#IMPLIED',
               }]);
               const docTypeEnd = new DocTypeEndXToken(makeDocTypeEnd());

               validator.write(notation);
               validator.write(elDecl);
               validator.write(attListDecl);
               validator.write(docTypeEnd);
               validator.end();

               const expected = new ValidityError(ValidityError.ID.ATTLISTDECL_BAD_NOTATION,
                  ['elementType', 'notation1', 'second']);
               expectStream(validator, expected, done);
            });

            it('reports no error if a 1.0/1 ATTLISTs NOTATION declaration has duplicate names', (done) => {
               setupDuplicateNotationValues(new ConformanceVersion(1.0, 1));

               expectNoErrorsOrWarnings(validator, done);
            });

            it('reports an error if a 1.0/3 ATTLISTs NOTATION declaration has duplicate names', (done) => {
               setupDuplicateNotationValues(new ConformanceVersion(1.0, 3));

               const expected = new ValidityError(ValidityError.ID.ATTLISTDECL_DUPLICATE_NOTATION,
                  ['elementType', 'notationAttr', 'first, third']);
               expectStream(validator, expected, done);
            });

            it('reports an error if a 1.1/* ATTLISTs NOTATION declaration has duplicate names', (done) => {
               setupDuplicateNotationValues(new ConformanceVersion(1.1, 1));

               const expected = new ValidityError(ValidityError.ID.ATTLISTDECL_DUPLICATE_NOTATION,
                  ['elementType', 'notationAttr', 'first, third']);
               expectStream(validator, expected, done);
            });

            it('reports no error if an 1.0/1 ATTLIST has more than one NOTATION attribute', (done) => {
               setup(new ConformanceVersion(1.0, 1));

               expectNoErrorsOrWarnings(validator, done);
            });

            it('reports an error if an 1.0/>1 ATTLIST has more than one NOTATION attribute', (done) => {
               setup(new ConformanceVersion(1.0, 2));

               const expected = new ValidityError(ValidityError.ID.ATTLISTDECL_EXTRA_NOTATION,
                  ['elementType', 'notation2']);
               expectStream(validator, expected, done);
            });

            it('reports an error if an 1.1/* ATTLIST has more than one NOTATION attribute', (done) => {
               setup(new ConformanceVersion(1.1, 2));

               const expected = new ValidityError(ValidityError.ID.ATTLISTDECL_EXTRA_NOTATION,
                  ['elementType', 'notation2']);
               expectStream(validator, expected, done);
            });

            it('reports no error if an 1.0/1 ATTLIST has more a NOTATION attribute on an EMPTY element type', (done) => {
               setupEmptyElement(new ConformanceVersion(1.0, 1));

               expectNoErrorsOrWarnings(validator, done);
            });

            it('reports an error if an 1.0/>1 ATTLIST has more a NOTATION attribute on an EMPTY element type', (done) => {
               setupEmptyElement(new ConformanceVersion(1.0, 2));

               const expected = new ValidityError(ValidityError.ID.ATTLISTDECL_EMPTY_NOTATION,
                  ['elementType', 'notation1']);
               expectStream(validator, expected, done);
            });

            it('reports an error if an 1.1/* ATTLIST has more a NOTATION attribute on an EMPTY element type', (done) => {
               setupEmptyElement(new ConformanceVersion(1.1, 2));

               const expected = new ValidityError(ValidityError.ID.ATTLISTDECL_EMPTY_NOTATION,
                  ['elementType', 'notation1']);
               expectStream(validator, expected, done);
            });

            it('reports an error if the default value for a NOTATION attribute does not match one of the defined values', (done) => {
               const elDecl = new ElementDeclarationXToken('elementType', 'EMPTY');
               const notation1 = new NotationDeclarationXToken('first');
               const notation2 = new NotationDeclarationXToken('second');
               const attListDecl = new AttListDeclarationXToken('elementType', [{
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
                  ['elementType', 'noteAttr', 'first, second', 'third']);
               expectStream(validator, expected, done);
            });

         });

         describe('ENUMERATION', () => {

            function setupDuplicateEnumerationValues(ver: ConformanceVersion) {
               const endOfDocType = new DocTypeEndXToken();
               const elDecl = new ElementDeclarationXToken('elementType', 'ANY', undefined);
               const attListDecl = new AttListDeclarationXToken('elementType', [{
                  name: 'enumerationAttr',
                  type: 'ENUMERATION',
                  enumeration: ['first', 'second', 'first', 'third', 'third', 'first'],
                  value: [],
                  defaultType: '#IMPLIED',
               }]);

               validator.write(ver);
               validator.write(elDecl);
               validator.write(attListDecl);
               validator.write(endOfDocType);
               validator.end();
            };

            it('reports no error if a 1.0/1 ATTLISTs ENUMERATION declaration has duplicate nmTokens', (done) => {
               setupDuplicateEnumerationValues(new ConformanceVersion(1.0, 1));

               expectNoErrorsOrWarnings(validator, done);
            });

            it('reports an error if a 1.0/3 ATTLISTs ENUMERATION declaration has duplicate nmTokens', (done) => {
               setupDuplicateEnumerationValues(new ConformanceVersion(1.0, 3));

               const expected = new ValidityError(ValidityError.ID.ATTLISTDECL_DUPLICATE_ENUMERATION,
                  ['elementType', 'enumerationAttr', 'first, third']);
               expectStream(validator, expected, done);
            });

            it('reports an error if a 1.1/* ATTLISTs ENUMERATION declaration has duplicate nmTokens', (done) => {
               setupDuplicateEnumerationValues(new ConformanceVersion(1.1, 1));

               const expected = new ValidityError(ValidityError.ID.ATTLISTDECL_DUPLICATE_ENUMERATION,
                  ['elementType', 'enumerationAttr', 'first, third']);
               expectStream(validator, expected, done);
            });

            it('reports no error if a 1.0/3 ATTLISTs ENUMERATION declaration has no duplicate nmTokens', (done) => {
               const endOfDocType = new DocTypeEndXToken();
               const elDecl = new ElementDeclarationXToken('elementType', 'ANY', undefined);
               const attListDecl = new AttListDeclarationXToken('elementType', [{
                  name: 'enumerationAttr',
                  type: 'ENUMERATION',
                  enumeration: ['first', 'second'],
                  value: [],
                  defaultType: '#IMPLIED',
               }]);

               validator.write(new ConformanceVersion(1.0, 3));
               validator.write(elDecl);
               validator.write(attListDecl);
               validator.write(endOfDocType);
               validator.end();

               expectNoErrorsOrWarnings(validator, done);
            });

            it('reports an error if the default value for a enumeration attribute does not match one of the defined values', (done) => {
               const elDecl = new ElementDeclarationXToken('elementType', 'EMPTY');
               const attListDecl = new AttListDeclarationXToken('elementType', [{
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
                  ['elementType', 'noteAttr', 'first, second', 'third']);
               expectStream(validator, expected, done);
            });

         });

         it('ignores attribute declarations after the first encountered', (done) => {
            const endOfDocType = new DocTypeEndXToken();
            const attListDecl1 = new AttListDeclarationXToken('elementType', [{
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
            const attListDecl2 = new AttListDeclarationXToken('elementType', [{
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
               ['elementType', 'anAttribute']);
            gatherTokens(validator, (tokens) => {
               (expect(tokens) as any).not.toHaveError(notExpected); // typeHack
               done();
            });
         });

         it('reports a warning if more than one attribute definition is provided for an attribute', (done) => {
            const endOfDocType = new DocTypeEndXToken();
            const attListDecl1 = new AttListDeclarationXToken('elementType', [{
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
            const attListDecl2 = new AttListDeclarationXToken('elementType', [{
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
               ['elementType', 'anAttribute']);
            expectStream(validator, expected, done);
         });

         it('reports an error if an attribute default has no declaration for a reference (§4.1)', (done) => {
            const elDecl1 = new ElementDeclarationXToken('testEl', 'ANY', undefined);
            const attListDecl1 = new AttListDeclarationXToken('testEl', [{
               name: 'textAttr',
               type: 'CDATA',
               value: [new GeneralEntityReferenceXToken('foo')],
               defaultType: '',
            }]);

            validator.write(new XmlDeclarationXToken(1.0, undefined, true));
            validator.write(new InternalSubsetStartToken());
            validator.write(elDecl1);
            validator.write(attListDecl1);
            validator.write(new InternalSubsetEndToken());
            validator.end();

            const expected = new ValidityError(ValidityError.ID.ATTLISTDECL_REFERENCE_UNDEFINED,
               ['foo', 'textAttr', 'testEl']);
            expectStream(validator, expected, done);
         });
      });

      describe('ENTITY', () => {

         it('reports a warning if multiple ENTITY declarations with the same name are given', (done) => {
            const peDecl1 = new ParameterEntityDeclarationXToken('one', []);
            const peDecl2 = new ParameterEntityDeclarationXToken('one', []);
            const expected = new XmlWarning(XmlWarning.ID.ENTITYDECL_DUPLICATE, ['one']);

            validator.write(peDecl1);
            validator.write(peDecl2);
            validator.end();

            expectStream(validator, expected, done);
         });

         it('reports a warning if multiple ENTITY declarations with the same name are given', (done) => {
            const geDecl1 = new GeneralEntityDeclarationXToken('one', []);
            const geDecl2 = new GeneralEntityDeclarationXToken('one', []);
            const expected = new XmlWarning(XmlWarning.ID.ENTITYDECL_DUPLICATE, ['one']);

            validator.write(geDecl1);
            validator.write(geDecl2);
            validator.end();

            expectStream(validator, expected, done);
         });

         it('reports an error when a notation is named, but was not declared', (done) => {
            const geDecl1 = new GeneralEntityDeclarationXToken('one', [], undefined, 'BadNDeclName');
            const expected = new ValidityError(ValidityError.ID.ENTITYDECL_UNDECLARED_NOTATION, ['one', 'BadNDeclName']);

            validator.write(geDecl1);
            validator.write(new DocTypeEndXToken());
            validator.end();

            expectStream(validator, expected, done);
         });

      });

      describe('ELEMENT', () => {

         it('reports no errors if multiple ELEMENT declarations are provided', (done) => {
            const elDecl1 = new ElementDeclarationXToken('one', 'EMPTY', undefined);
            const elDecl2 = new ElementDeclarationXToken('two', 'EMPTY', undefined);

            validator.write(elDecl1);
            validator.write(elDecl2);
            validator.end();

            expectNoErrorsOrWarnings(validator, done);
         });

         it('reports no errors if the element has no pToken', (done) => {
            const elDecl1 = new ElementDeclarationXToken('one', 'EMPTY', undefined);
            const elDecl2 = new ElementDeclarationXToken('two', 'EMPTY', undefined);

            validator.write(elDecl1);
            validator.write(elDecl2);
            validator.end();

            expectNoErrorsOrWarnings(validator, done);
         });

      });

      describe('entity reference', () => {

         it('reports an error if the referenced entity is externally declared and standlone=yes (§2.9)', (done) => {
            validator.write(new XmlDeclarationXToken(1.0, undefined, true));
            validator.write(new ExternalSubsetStartToken());
            validator.write(new GeneralEntityDeclarationXToken('extDeclEntity', []));
            validator.write(new ExternalSubsetEndToken());
            validator.write(new ElementStartXToken('testEl', []));
            validator.write(new GeneralEntityStartXToken('extDeclEntity'));
            validator.end();

            const expected = new ValidityError(ValidityError.ID.ENTITY_EXTERNAL_DECLARED,
               ['extDeclEntity']);
            expectStream(validator, expected, done);
         });

         it('reports no error if the referenced entity is internally declared and standlone=yes (§2.9)', (done) => {
            validator.write(new XmlDeclarationXToken(1.0, undefined, true));
            validator.write(new InternalSubsetStartToken());
            validator.write(new GeneralEntityDeclarationXToken('extDeclEntity', []));
            validator.write(new InternalSubsetEndToken());
            validator.write(new ElementStartXToken('testEl', []));
            validator.write(new GeneralEntityStartXToken('extDeclEntity'));
            validator.end();

            expectNoErrorsOrWarnings(validator, done);
         });

         it('reports no error if the referenced entity is internally declared after multiple param entity expansions and standlone=yes (§2.9)', (done) => {
            validator.write(new XmlDeclarationXToken(1.0, undefined, true));
            validator.write(new InternalSubsetStartToken());
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
            validator.write(new InternalSubsetEndToken());
            validator.write(new ElementStartXToken('testEl', []));
            validator.write(new GeneralEntityStartXToken('extDeclEntity'));
            validator.end();

            expectNoErrorsOrWarnings(validator, done);
         });

         it('reports an error if the referenced entity is externally declared in parameter entity expansion and standlone=yes (§2.9)', (done) => {
            validator.write(new XmlDeclarationXToken(1.0, undefined, true));
            validator.write(new InternalSubsetStartToken());
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
            validator.write(new InternalSubsetEndToken());
            validator.write(new ElementStartXToken('testEl', []));
            validator.write(new GeneralEntityStartXToken('extDeclEntity1'));
            validator.write(new GeneralEntityStartXToken('extDeclEntity2'));
            validator.end();

            const expected1 = new ValidityError(ValidityError.ID.ENTITY_EXTERNAL_DECLARED,
               ['extDeclEntity1']);
            const expected2 = new ValidityError(ValidityError.ID.ENTITY_EXTERNAL_DECLARED,
               ['extDeclEntity2']);
            expectStream(validator, [expected1, expected2], done);
         });

         it('is reported as an error if in an attribute and is externally declared and standlone=yes (§2.9)', (done) => {
            validator.write(new XmlDeclarationXToken(1.0, undefined, true));
            validator.write(new ExternalSubsetStartToken());
            validator.write(new GeneralEntityDeclarationXToken('extDeclEntity', []));
            validator.write(new ExternalSubsetEndToken());
            validator.write(new ElementStartXToken('testEl', [{
               name: 'testElAttr',
               value: [new GeneralEntityStartXToken('extDeclEntity')],
            }]))
            validator.end();

            const expected = new ValidityError(ValidityError.ID.ATTRIBUTE_ENTITY_EXTERNAL_DECLARED,
               ['extDeclEntity', 'testElAttr']);
            expectStream(validator, expected, done);
         });

         it('is not reported as an error if in an attribute and is externally declared and standlone=no (§2.9)', (done) => {
            validator.write(new XmlDeclarationXToken(1.0, undefined, false));
            validator.write(new ExternalSubsetStartToken());
            validator.write(new GeneralEntityDeclarationXToken('extDeclEntity', []));
            validator.write(new ExternalSubsetEndToken());
            validator.write(new ElementStartXToken('testEl', [{
               name: 'testElAttr',
               value: [new GeneralEntityStartXToken('extDeclEntity')],
            }]))
            validator.end();

            expectNoErrorsOrWarnings(validator, done);
         });

         it('is reported as an error if multiple in an attribute and all are externally declared and standlone=yes (§2.9)', (done) => {
            validator.write(new XmlDeclarationXToken(1.0, undefined, true));
            validator.write(new ExternalSubsetStartToken());
            validator.write(new GeneralEntityDeclarationXToken('extDeclEntity1', []));
            validator.write(new GeneralEntityDeclarationXToken('extDeclEntity2', []));
            validator.write(new ExternalSubsetEndToken());
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
               ['extDeclEntity1', 'testElAttr']);
            const expected2 = new ValidityError(ValidityError.ID.ATTRIBUTE_ENTITY_EXTERNAL_DECLARED,
               ['extDeclEntity2', 'testElAttr']);
            expectStream(validator, [expected1, expected2], done);
         });

         it('is reported as an error if it is top-level externally  embedded in another and standlone=yes (§2.9)', (done) => {
            validator.write(new XmlDeclarationXToken(1.0, undefined, true));
            validator.write(new ExternalSubsetStartToken());
            validator.write(new GeneralEntityDeclarationXToken('extDeclEntity1', []));
            validator.write(new GeneralEntityDeclarationXToken('extDeclEntity2', []));
            validator.write(new ExternalSubsetEndToken());
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
               ['extDeclEntity1', 'testElAttr']);
            expectStream(validator, expected1, done);
         });

         it('is reported as an error if it is top-level externally declared and standlone=yes (§2.9)', (done) => {
            validator.write(new XmlDeclarationXToken(1.0, undefined, true));
            validator.write(new ExternalSubsetStartToken());
            validator.write(new GeneralEntityDeclarationXToken('extParamEntity', []));
            validator.write(new ExternalSubsetEndToken());
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
               ['extParamEntity', 'testElAttr']);
            expectStream(validator, expected1, done);
         });

         it('is reported as an error it is an embedded externally declared and standlone=yes (§2.9)', (done) => {
            validator.write(new XmlDeclarationXToken(1.0, undefined, true));
            validator.write(new InternalSubsetStartToken());
            validator.write(new GeneralEntityDeclarationXToken('extDeclEntity1', []));
            validator.write(new InternalSubsetEndToken());
            validator.write(new ExternalSubsetStartToken());
            validator.write(new GeneralEntityDeclarationXToken('extDeclEntity2', []));
            validator.write(new ExternalSubsetEndToken());
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
               ['extDeclEntity2', 'testElAttr']);
            expectStream(validator, expected1, done);
         });

         it('is reported as an error if used as an ENTITY attribute value and standlone=yes (§2.9)', (done) => {
            validator.write(new XmlDeclarationXToken(1.0, undefined, true));
            validator.write(new ElementDeclarationXToken('testEl', 'ANY'));
            validator.write(new AttListDeclarationXToken('testEl', [{
               name: 'entityAttr',
               type: 'ENTITY',
               value: [],
               defaultType: '#REQUIRED',
            }]));
            validator.write(new ExternalSubsetStartToken());
            validator.write(new GeneralEntityDeclarationXToken('extDeclEntity', []));
            validator.write(new ExternalSubsetEndToken());
            validator.write(new ElementStartXToken('testEl', [{
               name: 'entityAttr',
               value: [
                  new TextXToken('extDeclEntity'),
               ],
            }]))
            validator.end();

            const expected1 = new ValidityError(ValidityError.ID.ATTRIBUTE_ENTITY_EXTERNAL_DECLARED,
               ['extDeclEntity', 'entityAttr']);
            expectStream(validator, expected1, done);
         });

         it('is reported as an error if externally declared and referenced from attr default and standlone=yes (§2.9)', (done) => {
            validator.write(new XmlDeclarationXToken(1.0, undefined, true));
            validator.write(new InternalSubsetStartToken());
            validator.write(new ParameterEntityStartXToken('someEntity'));
            validator.write(new GeneralEntityDeclarationXToken('extDeclEntity', []));
            validator.write(new ParameterEntityEndXToken('someEntity'));
            validator.write(new InternalSubsetStartToken());
            validator.write(new ElementDeclarationXToken('testEl', 'ANY'));
            validator.write(new AttListDeclarationXToken('testEl', [{
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
               ['extDeclEntity', 'cdataAttr']);
            expectStream(validator, expected1, done);
         });

         it('is reported as an error if parameter entity externally declared and referenced from attr default and standlone=yes (§2.9)', (done) => {
            validator.write(new XmlDeclarationXToken(1.0, undefined, true));
            validator.write(new InternalSubsetStartToken());
            validator.write(new ParameterEntityStartXToken('someEntity'));
            validator.write(new ParameterEntityDeclarationXToken('extDeclParamEntity', []));
            validator.write(new ParameterEntityEndXToken('someEntity'));
            validator.write(new GeneralEntityDeclarationXToken('intDeclEntity', []));
            validator.write(new ElementDeclarationXToken('testEl', 'ANY'));
            validator.write(new AttListDeclarationXToken('testEl', [{
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
            validator.write(new InternalSubsetStartToken());
            validator.end();

            const expected1 = new ValidityError(ValidityError.ID.ATTLISTDECL_PARAMENTITY_EXTERNAL_DECLARED,
               ['extDeclParamEntity', 'cdataAttr']);
            expectStream(validator, expected1, done);
         });

         it('is reported as an error if parameter entity externally declared and referenced from attr and standlone=yes (§2.9)', (done) => {
            validator.write(new XmlDeclarationXToken(1.0, undefined, true));
            validator.write(new ExternalSubsetStartToken()); // Really should be an expanded PERef
            validator.write(new ParameterEntityDeclarationXToken('extDeclParamEntity', []));
            validator.write(new ExternalSubsetEndToken());
            validator.write(new GeneralEntityDeclarationXToken('intDeclEntity', []));
            validator.write(new ElementDeclarationXToken('testEl', 'ANY'));
            validator.write(new ElementStartXToken('testEl', []));
            validator.write(new GeneralEntityStartXToken('intDeclEntity'));
            validator.write(new ParameterEntityStartXToken('extDeclParamEntity'));
            validator.write(new ParameterEntityEndXToken('extDeclParamEntity'));
            validator.write(new GeneralEntityEndXToken('intDeclEntity'));
            validator.end();

            const expected1 = new ValidityError(ValidityError.ID.PARAMENTITY_EXTERNAL_DECLARED,
               ['extDeclParamEntity']);
            expectStream(validator, expected1, done);
         });

         it('is reported as an error if externally declared and used as an ENTITY attribute default and standlone=yes (§2.9)', (done) => {
            validator.write(new XmlDeclarationXToken(1.0, undefined, true));
            validator.write(new ExternalSubsetStartToken()); // Really should be an expanded PERef
            validator.write(new GeneralEntityDeclarationXToken('extDeclEntity', []));
            validator.write(new ExternalSubsetEndToken());
            validator.write(new ElementDeclarationXToken('testEl', 'ANY'));
            validator.write(new AttListDeclarationXToken('testEl', [{
               name: 'entityAttr',
               type: 'ENTITY',
               value: [
                  new TextXToken('extDeclEntity'),
               ],
               defaultType: '#REQUIRED',
            }]));
            validator.end();

            const expected1 = new ValidityError(ValidityError.ID.ATTLISTDECL_ENTITY_EXTERNAL_DECLARED,
               ['extDeclEntity', 'entityAttr']);
            expectStream(validator, expected1, done);
         });

         it('is reported as an error if externally declared and used as an ENTITIES attribute default and standlone=yes (§2.9)', (done) => {
            validator.write(new XmlDeclarationXToken(1.0, undefined, true));
            validator.write(new ExternalSubsetStartToken()); // Really should be an expanded PERef
            validator.write(new GeneralEntityDeclarationXToken('extDeclEntity', []));
            validator.write(new ExternalSubsetEndToken());
            validator.write(new ElementDeclarationXToken('testEl', 'ANY'));
            validator.write(new AttListDeclarationXToken('testEl', [{
               name: 'entityAttr',
               type: 'ENTITIES',
               value: [
                  new TextXToken('extDeclEntity'),
               ],
               defaultType: '#REQUIRED',
            }]));
            validator.end();

            const expected1 = new ValidityError(ValidityError.ID.ATTLISTDECL_ENTITY_EXTERNAL_DECLARED,
               ['extDeclEntity', 'entityAttr']);
            expectStream(validator, expected1, done);
         });

         it('is reported as an error if it is a parameter entity reference to an external declaration (§2.9)', (done) => {
            validator.write(new XmlDeclarationXToken(1.0, undefined, true));
            validator.write(new ExternalSubsetStartToken()); // Really should be an expanded PERef
            validator.write(new ParameterEntityDeclarationXToken('extDeclEntity', []));
            validator.write(new ExternalSubsetEndToken());
            validator.write(new InternalSubsetStartToken());
            validator.write(new ParameterEntityStartXToken('extDeclEntity'));
            validator.write(new ParameterEntityEndXToken('extDeclEntity'));
            validator.write(new InternalSubsetEndToken());
            validator.end();

            const expected1 = new ValidityError(ValidityError.ID.PARAMENTITY_EXTERNAL_DECLARED,
               ['extDeclEntity']);
            expectStream(validator, expected1, done);
         });

         it('is not reported as an error if it is a parameter entity reference to an external declaration (§2.9)', (done) => {
            validator.write(new XmlDeclarationXToken(1.0, undefined, true));
            validator.write(new InternalSubsetStartToken());
            validator.write(new ParameterEntityDeclarationXToken('intDeclEntity', []));
            validator.write(new ParameterEntityStartXToken('intDeclEntity'));
            validator.write(new ParameterEntityEndXToken('intDeclEntity'));
            validator.write(new InternalSubsetEndToken());
            validator.end();

            expectNoErrorsOrWarnings(validator, done);
         });

         it('reports an error if a general entity reference is found, but there is no declaration for it (§4.1)', (done) => {
            validator.write(new XmlDeclarationXToken(1.0, undefined, true));
            validator.write(new GeneralEntityReferenceXToken('undeclared'));
            validator.end();

            const expected = new ValidityError(ValidityError.ID.GEREF_UNDEFINED,
               ['undeclared']);
            expectStream(validator, expected, done);
         });

         it('reports an error if a parameter entity reference is found, but there is no declaration for it (§4.1)', (done) => {
            validator.write(new XmlDeclarationXToken(1.0, undefined, true));
            validator.write(new ParameterEntityReferenceXToken('undeclared'));
            validator.end();

            const expected = new ValidityError(ValidityError.ID.PEREF_UNDEFINED,
               ['undeclared']);
            expectStream(validator, expected, done);
         });

      });

      describe('Error tokens', () => {

         it('ignores Errors when doing overall contextual checking', (done) => {
            const elDecl1 = new ElementDeclarationXToken('one', 'ANY', undefined);
            const startToken = new ElementStartXToken('one', [], new ElementStartPToken({ open: SToken.fromString('foo') }));

            validator.write(elDecl1);
            validator.write(startToken);
            validator.write(new WellFormedError(WellFormedError.ID.ELEMENTDECL_NO_NAME, ['x']));
            validator.end();

            gatherTokens(validator, (tokens) => {
               const errors = tokens.filter((token: any) => token.type === ERROR_TYPE);

               expect(errors.length).toBe(1);
               done();
            });
         });

      });

      describe('content', () => {

         describe('ANY content', () => {
            const commentToken = new CommentXToken('testComment');
            const piToken = new ProcessingInstructionXToken('test', 'pi');
            const cDataToken = new CdataXToken('testCData');
            const elementStartToken = new ElementStartXToken('one', []);

            const data: Array<[any, 1 | 1.1, 1 | 2 | 3 | 4 | 5 | 6, boolean]> = [
               [commentToken, 1, 1, false],
               [commentToken, 1, 2, false],
               [commentToken, 1, 3, false],
               [commentToken, 1, 4, false],
               [commentToken, 1, 5, false],
               [commentToken, 1, 6, false],
               [commentToken, 1.1, 1, false],
               [commentToken, 1.1, 2, false],
               [commentToken, 1.1, 3, false],
               [piToken, 1, 1, false],
               [piToken, 1, 2, false],
               [piToken, 1, 3, false],
               [piToken, 1, 4, false],
               [piToken, 1, 5, false],
               [piToken, 1, 6, false],
               [piToken, 1.1, 1, false],
               [piToken, 1.1, 2, false],
               [piToken, 1.1, 3, false],
               [cDataToken, 1, 1, false],
               [cDataToken, 1, 2, false],
               [cDataToken, 1, 3, false],
               [cDataToken, 1, 4, false],
               [cDataToken, 1, 5, false],
               [cDataToken, 1, 6, false],
               [cDataToken, 1.1, 1, false],
               [cDataToken, 1.1, 2, false],
               [cDataToken, 1.1, 3, false],
               [elementStartToken, 1, 1, false],
               [elementStartToken, 1, 2, false],
               [elementStartToken, 1, 3, false],
               [elementStartToken, 1, 4, false],
               [elementStartToken, 1, 5, false],
               [elementStartToken, 1, 6, false],
               [elementStartToken, 1.1, 1, false],
               [elementStartToken, 1.1, 2, false],
               [elementStartToken, 1.1, 3, false],
            ]
            data.forEach(([token, version, rev, causesError]) => {
               let errorToken: ValidityError;

               if (causesError) {
                  if (token === commentToken) {
                     errorToken = new ValidityError(ValidityError.ID.ANY_XTRA_COMMENT, ['one', version.toString(), rev.toString()]);
                  } else if (token === piToken) {
                     errorToken = new ValidityError(ValidityError.ID.ANY_XTRA_PI, ['one', version.toString(), rev.toString()]);
                  } else if (token === cDataToken) {
                     errorToken = new ValidityError(ValidityError.ID.ANY_XTRA_CDATA, ['one', version.toString(), rev.toString()]);
                  }
               }

               it(`${causesError ? 'reports an error' : 'accepts'} if a ${token.type} token appears in an ANY element in XML ${version}/${rev} (§3.0.0)`, (done) => {
                  const confVer = new ConformanceVersion(version, rev);
                  const elementDecl = new ElementDeclarationXToken('one', 'ANY');
                  const startToken = new ElementStartXToken('one', []);

                  validator.write(confVer);
                  validator.write(elementDecl);
                  validator.write(startToken);
                  validator.write(token);
                  validator.end();

                  if (causesError) {
                     expectStream(validator, errorToken, done);
                  } else {
                     expectNoErrorsOrWarnings(validator, done);
                  }
               });
            });

            it('reports an error if a completely unsupported bit of markup shows up (§3.0.0)', (done) => {
               const elementDecl = new ElementDeclarationXToken('one', 'ANY');
               const startToken = new ElementStartXToken('one', []);

               validator.write(elementDecl);
               validator.write(startToken);
               validator.write(elementDecl);
               validator.end();

               const errorToken = new ValidityError(ValidityError.ID.ANY_XTRA_MARKUP, ['one']);
               expectStream(validator, errorToken, done);
            });

            it('reports errors even when no ptoken is present', (done) => {
               const elementDecl = new ElementDeclarationXToken('one', 'ANY');
               const startToken = new ElementStartXToken('one', []);

               validator.write(elementDecl);
               validator.write(startToken);
               validator.write(elementDecl);
               validator.end();

               const errorToken = new ValidityError(ValidityError.ID.ANY_XTRA_MARKUP, ['one']);
               expectStream(validator, errorToken, done);
            });

            it('reports no errors when passing char data through it for 1.0/5 (§3.0.0)', (done) => {
               const elementDecl = new ElementDeclarationXToken('one', 'ANY');
               const startToken = new ElementStartXToken('one', []);
               const characters = new CharDataXToken('one');
               const charRef = new CharRefXToken('o');

               validator.write(elementDecl);
               validator.write(startToken);
               validator.write(characters);
               validator.write(charRef);
               validator.end();

               expectNoErrorsOrWarnings(validator, done);
            });

            it('reports an error when passing char data through it for 1.0/1 (§3.0.0)', (done) => {
               const confVer = new ConformanceVersion(1, 1);
               const elementDecl = new ElementDeclarationXToken('one', 'ANY');
               const startToken = new ElementStartXToken('one', []);
               const characters = new CharDataXToken('one');

               validator.write(confVer);
               validator.write(elementDecl);
               validator.write(startToken);
               validator.write(characters);
               validator.end();

               const errorToken = new ValidityError(ValidityError.ID.ANY_XTRA_MARKUP, ['one']);
               expectStream(validator, errorToken, done);
            });

         });

         describe('EMPTY content', () => {

            it('reports an error if an element appears in an element declared to be EMPTY (§3.0.0)', (done) => {
               const elementDecl = new ElementDeclarationXToken('one', 'EMPTY', undefined);
               const elStart = new ElementStartXToken('one', []);
               const elTwo = new ElementStartXToken('one', []);

               validator.write(elementDecl);
               validator.write(elStart);
               validator.write(elTwo);
               validator.end();

               const expected = new ValidityError(ValidityError.ID.CONTENT_IN_EMPTY_ELEMENT, ['one']);
               expectStream(validator, expected, done);
            });

            it('reports an error if a comment appears in an element declared to be EMPTY (§3.0.0)', (done) => {
               const elementDecl = new ElementDeclarationXToken('one', 'EMPTY', undefined);
               const elStart = new ElementStartXToken('one', []);
               const comment = new CommentXToken('one');

               validator.write(elementDecl);
               validator.write(elStart);
               validator.write(comment);
               validator.end();

               const expected = new ValidityError(ValidityError.ID.CONTENT_IN_EMPTY_ELEMENT, ['one']);
               expectStream(validator, expected, done);
            });

            it('reports an error if space appears in an element declared to be EMPTY (§3.0.0)', (done) => {
               const elementDecl = new ElementDeclarationXToken('one', 'EMPTY', undefined);
               const elStart = new ElementStartXToken('one', []);
               const space = new SpaceXToken('  ');

               validator.write(elementDecl);
               validator.write(elStart);
               validator.write(space);
               validator.end();

               const expected = new ValidityError(ValidityError.ID.CONTENT_IN_EMPTY_ELEMENT, ['one']);
               expectStream(validator, expected, done);
            });

            it('reports no error if an empty element is used for an EMPTY element', (done) => {
               const elementDecl = new ElementDeclarationXToken('one', 'EMPTY', undefined);
               const elStart = new ElementEmptyXToken('one', []);

               validator.write(elementDecl);
               validator.write(elStart);
               validator.end();

               expectNoErrorsOrWarnings(validator, done);
            });

            it('reports no error if only a start and end tag are used an EMPTY element (§3.0.0)', (done) => {
               const elementDecl = new ElementDeclarationXToken('one', 'EMPTY', undefined);
               const elStart = new ElementStartXToken('one', []);
               const elEnd = new ElementEndXToken('one');

               validator.write(elementDecl);
               validator.write(elStart);
               validator.write(elEnd);
               validator.end();

               expectNoErrors(validator, done);
            });

            it('reports a warning if a start tag is used for an element declared to be empty', (done) => {
               const elementDecl = new ElementDeclarationXToken('one', 'EMPTY', undefined);
               const elStart = new ElementStartXToken('one', []);

               validator.write(elementDecl);
               validator.write(elStart);
               validator.end();

               const expected = new XmlWarning(XmlWarning.ID.ELEMENT_WITH_EMPTY_DECL, ['one']);
               expectStream(validator, expected, done);
            });

         });

         describe('MIXED content', () => {

            it('reports no error if there is a comment found in mixed content  in 1.0/1 (§3.0.0)', (done) => {
               const elementDecl = new ElementDeclarationXToken('one', 'CHILDREN', {
                  particles: [{
                     name: '#PCDATA',
                     repeat: CpRepeat.ONE
                  }],
                  repeat: CpRepeat.ONE,
                  listType: CpType.CHOICE
               });

               const commentToken = new CommentXToken('stuff');
               const elStart = new ElementStartXToken('one', []);

               validator.write(new ConformanceVersion(1.0, 1));
               validator.write(elementDecl);
               validator.write(elStart);
               validator.write(commentToken);
               validator.end();

               const expected = new ValidityError(ValidityError.ID.MIXED_XTRA_MARKUP, ['one']);
               expectStream(validator, expected, done);
            });

            it('reports an error if there is a processing instruction found in mixed content  in 1.0/1 (§3.0.0)', (done) => {
               const elementDecl = new ElementDeclarationXToken('one', 'CHILDREN', {
                  particles: [{
                     name: '#PCDATA',
                     repeat: CpRepeat.ONE
                  }],
                  repeat: CpRepeat.ONE,
                  listType: CpType.CHOICE
               });
               const pi = new ProcessingInstructionXToken('stuff', 'other');
               const elStart = new ElementStartXToken('one', []);

               validator.write(new ConformanceVersion(1.0, 1));
               validator.write(elementDecl);
               validator.write(elStart);
               validator.write(pi);
               validator.end();

               const expected = new ValidityError(ValidityError.ID.MIXED_XTRA_MARKUP, ['one']);
               expectStream(validator, expected, done);
            });

            it('reports no error if there is a comment found in mixed content in 1.0/3 (§3.0.0)', (done) => {
               const elementDecl = new ElementDeclarationXToken('one', 'CHILDREN', {
                  particles: [{
                     name: '#PCDATA',
                     repeat: CpRepeat.ONE
                  }],
                  repeat: CpRepeat.ONE,
                  listType: CpType.CHOICE
               });
               const commentToken = new CommentXToken('stuff');
               const elStart = new ElementStartXToken('one', []);

               validator.write(new ConformanceVersion(1.0, 3));
               validator.write(elementDecl);
               validator.write(elStart);
               validator.write(commentToken);
               validator.end();

               expectNoErrorsOrWarnings(validator, done);
            });

            it('reports no error if there is a processing instruction found in mixed content in 1.1/1 (§3.0.0)', (done) => {
               const elementDecl = new ElementDeclarationXToken('one', 'CHILDREN', {
                  particles: [{
                     name: '#PCDATA',
                     repeat: CpRepeat.ONE
                  }],
                  repeat: CpRepeat.ONE,
                  listType: CpType.CHOICE
               });
               const pi = new ProcessingInstructionXToken('stuff', 'other');
               const elStart = new ElementStartXToken('one', []);

               validator.write(new ConformanceVersion(1.1, 1));
               validator.write(elementDecl);
               validator.write(elStart);
               validator.write(pi);
               validator.end();

               expectNoErrorsOrWarnings(validator, done);
            });

            it('reports no error if element, chardata, and charRef are found in mixed content in 1.0/1 (§3.0.0)', (done) => {
               const elementDecl = new ElementDeclarationXToken('one', 'CHILDREN', {
                  particles: [{
                     name: '#PCDATA',
                     repeat: CpRepeat.ONE
                  }],
                  repeat: CpRepeat.ONE,
                  listType: CpType.CHOICE
               });

               validator.write(new ConformanceVersion(1.0, 1));
               validator.write(elementDecl);
               validator.write(new ElementStartXToken('one', []));
               validator.write(new CharDataXToken('test charData'));
               validator.write(new CharRefXToken('x'));
               validator.write(new CharDataXToken(' '));
               validator.write(new ElementEndXToken('one'));
               validator.end();

               expectNoErrorsOrWarnings(validator, done);
            });

            it('reports no error if a CDATA section found in 1.0/1 (§3.0.0)', (done) => {
               const elementDecl = new ElementDeclarationXToken('one', 'CHILDREN', {
                  particles: [{
                     name: '#PCDATA',
                     repeat: CpRepeat.ONE
                  }],
                  repeat: CpRepeat.ONE,
                  listType: CpType.CHOICE
               });

               validator.write(new ConformanceVersion(1.0, 1));
               validator.write(elementDecl);
               validator.write(new ElementStartXToken('one', []));
               validator.write(new CdataXToken('test charData'));
               validator.write(new ElementEndXToken('one'));
               validator.end();

               expectNoErrors(validator, done);
            });

            it('reports no error if a CDATA section found in 1.0/5 (§3.0.0)', (done) => {
               const elementDecl = new ElementDeclarationXToken('one', 'CHILDREN', {
                  particles: [{
                     name: '#PCDATA',
                     repeat: CpRepeat.ONE
                  }],
                  repeat: CpRepeat.ONE,
                  listType: CpType.CHOICE
               });

               validator.write(new ConformanceVersion(1.0, 5));
               validator.write(elementDecl);
               validator.write(new ElementStartXToken('one', []));
               validator.write(new CdataXToken('test charData'));
               validator.write(new ElementEndXToken('one'));
               validator.end();

               expectNoErrorsOrWarnings(validator, done);
            });

            it('reports no error if element, chardata, charRef, and CData are found in mixed content in 1.0/5 (§3.0.0)', (done) => {
               const elementDecl = new ElementDeclarationXToken('one', 'CHILDREN', {
                  particles: [{
                     name: '#PCDATA',
                     repeat: CpRepeat.ONE
                  }],
                  repeat: CpRepeat.ONE,
                  listType: CpType.CHOICE
               });

               validator.write(new ConformanceVersion(1.0, 5));
               validator.write(elementDecl);
               validator.write(new ElementStartXToken('one', []));
               validator.write(new CharDataXToken('test charData'));
               validator.write(new CharRefXToken('x'));
               validator.write(new CdataXToken('test CDATA'));
               validator.write(new CharDataXToken(' '));
               validator.write(new ElementEndXToken('one'));
               validator.end();

               expectNoErrorsOrWarnings(validator, done);
            });

            it('reports no error if entity start and end markers are found in 1.0/5 (§3.0.0)', (done) => {
               const elementDecl = new ElementDeclarationXToken('one', 'CHILDREN', {
                  particles: [{
                     name: '#PCDATA',
                     repeat: CpRepeat.ONE
                  }],
                  repeat: CpRepeat.ONE,
                  listType: CpType.CHOICE
               });

               validator.write(elementDecl);
               validator.write(new ElementStartXToken('one', []));
               validator.write(new GeneralEntityStartXToken('testEntityStart'));
               validator.write(new GeneralEntityEndXToken('testEntityEnd'));
               validator.write(new ElementEndXToken('one'));
               validator.end();

               expectNoErrorsOrWarnings(validator, done);
            });

            it('reports an error other markup is found in mixed content (§3.0.0)', (done) => {
               const elementDecl = new ElementDeclarationXToken('one', 'CHILDREN', {
                  particles: [{
                     name: '#PCDATA',
                     repeat: CpRepeat.ONE
                  }],
                  repeat: CpRepeat.ONE,
                  listType: CpType.CHOICE
               });

               validator.write(elementDecl);
               validator.write(new ElementStartXToken('one', []));
               validator.write(new ElementDeclarationXToken('two', 'ANY'));
               validator.end();

               const expected = new ValidityError(ValidityError.ID.MIXED_XTRA_MARKUP, ['one']);
               expectStream(validator, expected, done);
            });

         });

         describe('ELEMENT content', () => {
            const commentToken = new CommentXToken('testComment');
            const piToken = new ProcessingInstructionXToken('test', 'pi');
            const cDataToken = new CdataXToken('testCData');
            const nonWhiteChars = new CharDataXToken('one');
            const whiteChars = new CharDataXToken(' \t\n');

            const data: Array<[any, 1 | 1.1, 1 | 2 | 3 | 4 | 5 | 6, boolean]> = [
               [commentToken, 1, 1, true],
               [commentToken, 1, 2, true],
               [commentToken, 1, 3, false],
               [commentToken, 1, 4, false],
               [commentToken, 1, 5, false],
               [commentToken, 1, 6, false],
               [commentToken, 1.1, 1, false],
               [commentToken, 1.1, 2, false],
               [commentToken, 1.1, 3, false],
               [piToken, 1, 1, true],
               [piToken, 1, 2, true],
               [piToken, 1, 3, false],
               [piToken, 1, 4, false],
               [piToken, 1, 5, false],
               [piToken, 1, 6, false],
               [piToken, 1.1, 1, false],
               [piToken, 1.1, 2, false],
               [piToken, 1.1, 3, false],
               [cDataToken, 1, 5, true],
               [cDataToken, 1.1, 2, true],
               [nonWhiteChars, 1, 5, true],
               [nonWhiteChars, 1.1, 2, true],
               [whiteChars, 1, 5, false],
               [whiteChars, 1.1, 2, false],
               [new SpaceXToken('  '), 1.0, 2, false],
               [new GeneralEntityReferenceXToken('x'), 1.0, 1, true],
               // [ new GeneralEntityReferenceXToken('x'), 1.0, 3, false ],  Because of §4.1
               [new GeneralEntityStartXToken('y'), 1.0, 1, true],
               [new GeneralEntityStartXToken('y'), 1.0, 3, false],
               [new GeneralEntityEndXToken('z'), 1.0, 1, true],
               [new GeneralEntityEndXToken('z'), 1.0, 3, false],
            ];
            data.forEach(([token, version, rev, causesError]) => {
               let errorToken: ValidityError;

               if (causesError) {
                  if (token === commentToken) {
                     errorToken = new ValidityError(ValidityError.ID.CHILDREN_XTRA_COMMENT, ['one', version.toString(), rev.toString()]);
                  } else if (token === piToken) {
                     errorToken = new ValidityError(ValidityError.ID.CHILDREN_XTRA_PI, ['one', version.toString(), rev.toString()]);
                  } else {
                     errorToken = new ValidityError(ValidityError.ID.CHILDREN_XTRA_CONTENT, ['one', version.toString(), rev.toString()]);
                  }
               }

               it(`${causesError ? 'reports an error' : 'accepts'} if a ${token.type} token appears in an element in XML ${version}/${rev} (§3.0.0)`, (done) => {
                  const confVer = new ConformanceVersion(version, rev);
                  const elementDecl2 = new ElementDeclarationXToken('two', 'ANY');
                  const elementDecl1 = new ElementDeclarationXToken('one', 'CHILDREN', {
                     particles: [{
                        name: 'two',
                        repeat: CpRepeat.ONE,
                     }],
                     repeat: CpRepeat.ONE,
                     listType: CpType.CHOICE,
                  });
                  const startToken = new ElementStartXToken('one', []);

                  validator.write(confVer);
                  validator.write(elementDecl2);
                  validator.write(elementDecl1);
                  validator.write(startToken);
                  validator.write(token);
                  validator.end();

                  if (causesError) {
                     expectStream(validator, errorToken, done);
                  } else {
                     expectNoErrorsOrWarnings(validator, done);
                  }
               });
            });

            it('reports an error if there is S before the first child in version 1.0/1 (§3.0.0)', (done) => {
               const elementDecl = new ElementDeclarationXToken('one', 'CHILDREN', {
                  particles: [{
                     name: 'child',
                     repeat: CpRepeat.ONE
                  }],
                  repeat: CpRepeat.ONE,
                  listType: CpType.CHOICE
               });

               validator.write(new ConformanceVersion(1.0, 1));
               validator.write(elementDecl);
               validator.write(new ElementStartXToken('one', []));
               validator.write(new SpaceXToken(' '));
               validator.write(new ElementStartXToken('child', []));
               validator.write(new ElementEndXToken('child'));
               validator.write(new ElementEndXToken('one'));
               validator.end();

               const expected = new ValidityError(ValidityError.ID.CHILDREN_XTRA_SPACE, []);
               expectStream(validator, expected, done);
            });

            it('reports an error if there is S before the last child in version 1.0/1 (§3.0.0)', (done) => {
               const elementDecl = new ElementDeclarationXToken('one', 'CHILDREN', {
                  particles: [{
                     name: 'child',
                     repeat: CpRepeat.ONE
                  }],
                  repeat: CpRepeat.ONE,
                  listType: CpType.CHOICE
               });

               validator.write(new ConformanceVersion(1.0, 1));
               validator.write(elementDecl);
               validator.write(new ElementStartXToken('one', []));
               validator.write(new ElementStartXToken('child', []));
               validator.write(new ElementEndXToken('child'));
               validator.write(new SpaceXToken(' '));
               validator.write(new ElementEndXToken('one'));
               validator.end();

               const expected = new ValidityError(ValidityError.ID.CHILDREN_XTRA_SPACE, []);
               expectStream(validator, expected, done);
            });

            it('reports an error if there is S before the first child in version 1.0/2 (§3.0.0)', (done) => {
               const elementDecl = new ElementDeclarationXToken('one', 'CHILDREN', {
                  particles: [{
                     name: 'child',
                     repeat: CpRepeat.ONE
                  }],
                  repeat: CpRepeat.ONE,
                  listType: CpType.CHOICE
               });

               validator.write(new ConformanceVersion(1.0, 2));
               validator.write(elementDecl);
               validator.write(new ElementStartXToken('one', []));
               validator.write(new SpaceXToken(' '));
               validator.write(new ElementStartXToken('child', []));
               validator.write(new ElementEndXToken('child'));
               validator.write(new ElementEndXToken('one'));
               validator.end();

               expectNoErrors(validator, done);
            });

            it('reports no error if there is S before the last child in version 1.0/2 (§3.0.0)', (done) => {
               const elementDecl = new ElementDeclarationXToken('one', 'CHILDREN', {
                  particles: [{
                     name: 'child',
                     repeat: CpRepeat.ONE
                  }],
                  repeat: CpRepeat.ONE,
                  listType: CpType.CHOICE
               });

               validator.write(new ConformanceVersion(1.0, 2));
               validator.write(elementDecl);
               validator.write(new ElementStartXToken('one', []));
               validator.write(new ElementStartXToken('child', []));
               validator.write(new ElementEndXToken('child'));
               validator.write(new SpaceXToken(' '));
               validator.write(new ElementEndXToken('one'));
               validator.end();

               expectNoErrors(validator, done);
            });

            it('reports no errors if a comment is found between children in 1.0/4 (§3.0.0)', (done) => {
               const elementDecl = new ElementDeclarationXToken('one', 'CHILDREN', {
                  particles: [{
                     name: 'child',
                     repeat: CpRepeat.ONE
                  }],
                  repeat: CpRepeat.ZEROPLUS,
                  listType: CpType.CHOICE
               });

               validator.write(new ConformanceVersion(1.0, 4));
               validator.write(new ElementDeclarationXToken('child', 'ANY'));
               validator.write(elementDecl);
               validator.write(new ElementStartXToken('one', []));
               validator.write(new CommentXToken('zowie'));
               validator.write(new ElementEndXToken('one'));
               validator.end();

               expectNoErrors(validator, done);
            });

            it('reports an error if a comment is found in an expanded entity in 1.0/4 (§3.0.0)', (done) => {
               const elementDecl = new ElementDeclarationXToken('one', 'CHILDREN', {
                  particles: [{
                     name: 'child',
                     repeat: CpRepeat.ONE
                  }],
                  repeat: CpRepeat.ZEROPLUS,
                  listType: CpType.CHOICE
               });

               validator.write(new ConformanceVersion(1.0, 4));
               validator.write(new ElementDeclarationXToken('child', 'ANY'));
               validator.write(elementDecl);
               validator.write(new ElementStartXToken('one', []));
               validator.write(new GeneralEntityStartXToken('ge'));
               validator.write(new CommentXToken('zowie'));
               validator.write(new GeneralEntityEndXToken('ge'));
               validator.write(new ElementEndXToken('one'));
               validator.end();

               const expected = new ValidityError(ValidityError.ID.CHILDREN_XTRA_COMMENT, ['one', '1', '4']);
               expectStream(validator, expected, done);
            });

            it('reports no error if a comment is found in an expanded entity in 1.0/5 (§3.0.0)', (done) => {
               const elementDecl = new ElementDeclarationXToken('one', 'CHILDREN', {
                  particles: [{
                     name: 'child',
                     repeat: CpRepeat.ONE
                  }],
                  repeat: CpRepeat.ZEROPLUS,
                  listType: CpType.CHOICE
               });

               validator.write(new ConformanceVersion(1.0, 5));
               validator.write(new ElementDeclarationXToken('child', 'ANY'));
               validator.write(elementDecl);
               validator.write(new ElementStartXToken('one', []));
               validator.write(new GeneralEntityStartXToken('ge'));
               validator.write(new CommentXToken('zowie'));
               validator.write(new GeneralEntityEndXToken('ge'));
               validator.write(new ElementEndXToken('one'));
               validator.end();

               expectNoErrors(validator, done);
            });

            it('reports no errors if a PI is found between children in 1.0/4 (§3.0.0)', (done) => {
               const elementDecl = new ElementDeclarationXToken('one', 'CHILDREN', {
                  particles: [{
                     name: 'child',
                     repeat: CpRepeat.ONE
                  }],
                  repeat: CpRepeat.ZEROPLUS,
                  listType: CpType.CHOICE
               });

               validator.write(new ConformanceVersion(1.0, 4));
               validator.write(new ElementDeclarationXToken('child', 'ANY'));
               validator.write(elementDecl);
               validator.write(new ElementStartXToken('one', []));
               validator.write(new ProcessingInstructionXToken('zowie', 'data'));
               validator.write(new ElementEndXToken('one'));
               validator.end();

               expectNoErrors(validator, done);
            });

            it('reports an error if a PI is found in an expanded entity in 1.0/4 (§3.0.0)', (done) => {
               const elementDecl = new ElementDeclarationXToken('one', 'CHILDREN', {
                  particles: [{
                     name: 'child',
                     repeat: CpRepeat.ONE
                  }],
                  repeat: CpRepeat.ZEROPLUS,
                  listType: CpType.CHOICE
               });

               validator.write(new ConformanceVersion(1.0, 4));
               validator.write(new ElementDeclarationXToken('child', 'ANY'));
               validator.write(elementDecl);
               validator.write(new ElementStartXToken('one', []));
               validator.write(new GeneralEntityStartXToken('ge'));
               validator.write(new ProcessingInstructionXToken('zowie', 'data'));
               validator.write(new GeneralEntityEndXToken('ge'));
               validator.write(new ElementEndXToken('one'));
               validator.end();

               const expected = new ValidityError(ValidityError.ID.CHILDREN_XTRA_PI, ['one', '1', '4']);
               expectStream(validator, expected, done);
            });

            it('reports no error if a PI is found in an expanded entity in 1.0/5 (§3.0.0)', (done) => {
               const elementDecl = new ElementDeclarationXToken('one', 'CHILDREN', {
                  particles: [{
                     name: 'child',
                     repeat: CpRepeat.ONE
                  }],
                  repeat: CpRepeat.ZEROPLUS,
                  listType: CpType.CHOICE
               });

               validator.write(new ConformanceVersion(1.0, 5));
               validator.write(new ElementDeclarationXToken('child', 'ANY'));
               validator.write(elementDecl);
               validator.write(new ElementStartXToken('one', []));
               validator.write(new GeneralEntityStartXToken('ge'));
               validator.write(new ProcessingInstructionXToken('zowie', 'data'));
               validator.write(new GeneralEntityEndXToken('ge'));
               validator.write(new ElementEndXToken('one'));
               validator.end();

               expectNoErrors(validator, done);
            });

            it('converts chardata that is just whitespace into space tokens', (done) => {
               const elementDecl = new ElementDeclarationXToken('one', 'CHILDREN', {
                  particles: [{
                     name: 'child',
                     repeat: CpRepeat.ONE
                  }],
                  repeat: CpRepeat.ONE,
                  listType: CpType.CHOICE
               });

               validator.write(elementDecl);
               validator.write(new ElementStartXToken('one', []));
               validator.write(new CharDataXToken(' '));
               validator.write(new ElementStartXToken('child', []));
               validator.end();

               gatherTokens(validator, (tokens) => {
                  expect(tokens[2].type).toEqual(SPACE_XTOKEN);
                  done();
               });
            });

            it('reports an error if an element with element content is externally declared and standalone=yes (§2.9)', (done) => {
               validator.write(new XmlDeclarationXToken(1.0, undefined, true));
               validator.write(new ExternalSubsetStartToken());
               validator.write(new ElementDeclarationXToken('extDeclaredElement', 'CHILDREN', {
                  particles: [{
                     name: 'child',
                     repeat: CpRepeat.ONE,
                  }],
                  listType: CpType.CHOICE,
                  repeat: CpRepeat.ONE,
               }));
               validator.write(new ExternalSubsetEndToken());
               validator.write(new ElementStartXToken('extDeclaredElement', []));
               validator.write(new SpaceXToken('  '));
               validator.write(new ElementEndXToken('extDeclaredElement'));
               validator.end();

               const expected = new ValidityError(ValidityError.ID.CHILDREN_SPACE_EXTERNAL_DECLARED,
                  ['extDeclaredElement']);
               expectStream(validator, expected, done);
            });

         });
      });
   });

});
