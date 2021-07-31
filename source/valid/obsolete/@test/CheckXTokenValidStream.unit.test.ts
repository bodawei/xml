/* Copyright ® 2017-2019 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { gatherStreamResults } from 'basic-test';
import { ConformanceVersion, ERROR_TYPE, warning, WarningToken } from 'basic';
import { WellFormedError } from 'wellformedness';
import { SToken } from 'sToken';
import { ValidityError } from 'valid';
import {
   AttDefinitionType,
   AttDefaultType,
   AttListDeclarationXToken,
   CdataXToken,
   CharDataXToken,
   CharRefXToken,
   CommentXToken,
   ContentSpecType,
   CpRepeat,
   CpType,
   DocTypeEndXToken,
   DocTypeStartXToken,
   ElementEndXToken,
   ElementDeclarationXToken,
   ElementEmptyXToken,
   ElementStartXToken,
   NotationDeclarationXToken,
   GeneralEntityDeclarationXToken,
   GeneralEntityEndXToken,
   GeneralEntityStartXToken,
   ParameterEntityDeclarationXToken,
   ParameterEntityReferenceXToken,
   GeneralEntityReferenceXToken,
   ProcessingInstructionXToken,
   XmlDeclarationXToken,
   TextXToken,
} from 'xToken';

import { InternalSubsetStartToken, InternalSubsetEndToken } from 'token';

import CheckXTokenValidStream from '../CheckXTokenValidStream';

describe('CheckXTokenValidStream (unit)', () => {
   let validator: CheckXTokenValidStream;

   beforeEach(() => {
      validator = new CheckXTokenValidStream();
   });

   function expectStream(validator: CheckXTokenValidStream, expected: any, done: () => void) {
      gatherStreamResults<any>(validator, (tokens) => {
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
      gatherStreamResults<any>(validator, (tokens) => {
         (expect(tokens) as any).toBeErrorAndWarningFree(); // typeHack
         done();
      });
   }

   function expectNoErrors(validator: CheckXTokenValidStream, done: () => void) {
      gatherStreamResults<any>(validator, (tokens) => {
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
         const dtStart = new DocTypeStartXToken('foo', undefined as any);
         const elStart = new ElementStartXToken('foo', []);

         validator.write(dtStart);
         validator.write(elStart);

         expect(validator.read()).toEqual(dtStart as any); // typeHack
         expect(validator.read()).toEqual(elStart as any); // typeHack
      });

      it('resumes passing through if end of stream reached', () => {
         const dtStart = new DocTypeStartXToken('foo', undefined as any);

         validator.write(dtStart);
         validator.end();

         expect(validator.read()).toEqual(dtStart as any); // typeHack
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
            attListDecl = new AttListDeclarationXToken('one', [
               {
                  name: 'first',
                  type: AttDefinitionType.CDATA,
                  enumeration: undefined,
                  value: [],
                  defaultType: undefined,
               },
            ]);
         });

         it('reports no error if the attribute is in the ATTLIST', (done) => {
            const elementDecl = new ElementDeclarationXToken('one', ContentSpecType.ANY, undefined);
            const startToken = new ElementStartXToken('one', [
               {
                  name: 'first',
                  value: [],
               },
            ]);

            validator.write(elementDecl);
            validator.write(attListDecl);
            validator.write(startToken);
            validator.end();

            expectNoErrorsOrWarnings(validator, done);
         });

         it('allows for the start token to have no attributes', (done) => {
            const elementDecl = new ElementDeclarationXToken('one', ContentSpecType.ANY);
            const startToken = new ElementStartXToken('one', []);

            validator.write(elementDecl);
            validator.write(attListDecl);
            validator.write(startToken);
            validator.end();

            expectNoErrorsOrWarnings(validator, done);
         });

         it('allows for there not being an ATTLIST', (done) => {
            const startToken = new ElementStartXToken('one', [
               {
                  name: 'notPresent',
                  value: [],
               },
            ]);

            validator.write(startToken);
            validator.end();

            expectNoErrorsOrWarnings(validator, done);
         });

         it('reports a warning if an empty element tag is used for an element not declared to be empty', (done) => {
            const elementDecl = new ElementDeclarationXToken('one', ContentSpecType.ANY, undefined);
            const emptyTag = new ElementEmptyXToken('one', []);

            validator.write(elementDecl);
            validator.write(emptyTag);
            validator.end();

            const expected = new WarningToken(warning.id.ELEMENT_EMPTY_WITH_NONEMPTY_DECL, ['one']);
            expectStream(validator, expected, done);
         });

         it('reports no error if a required attribute was specified', (done) => {
            const elementDecl = new ElementDeclarationXToken('one', ContentSpecType.ANY, undefined);
            attListDecl = new AttListDeclarationXToken(attListDecl.elementName, [
               ...attListDecl.attDefs,
               {
                  name: 'needed',
                  type: AttDefinitionType.CDATA,
                  enumeration: undefined,
                  value: [],
                  defaultType: AttDefaultType.REQUIRED,
               },
            ]);
            const startToken = new ElementStartXToken('one', [
               {
                  name: 'needed',
                  value: [],
               },
            ]);

            validator.write(elementDecl);
            validator.write(attListDecl);
            validator.write(startToken);
            validator.end();

            expectNoErrorsOrWarnings(validator, done);
         });

         it('reports an error if an attribute value has a reference to an entity that has no declaration (§4.1)', (done) => {
            const startToken = new ElementStartXToken('testEl', [
               {
                  name: 'anAttr',
                  value: [new GeneralEntityReferenceXToken('undeclared')],
               },
            ]);

            validator.write(new XmlDeclarationXToken(1.0, undefined, true));
            validator.write(startToken);
            validator.end();

            const expected = new ValidityError(ValidityError.ID.ELEMENTSTART_REFERENCE_UNDEFINED, [
               'undeclared',
               'anAttr',
               'testEl',
            ]);
            expectStream(validator, expected, done);
         });

         describe('normalization', () => {
            it('replaces non-space white characters with spaces in CDATA', (done) => {
               const elDecl1 = new ElementDeclarationXToken(
                  'testEl',
                  ContentSpecType.ANY,
                  undefined,
               );
               const attListDecl1 = new AttListDeclarationXToken('testEl', [
                  {
                     name: 'textAttr',
                     type: AttDefinitionType.CDATA,
                     enumeration: undefined,
                     value: [],
                     defaultType: AttDefaultType.REQUIRED,
                  },
               ]);
               const startToken1 = new ElementStartXToken('testEl', [
                  {
                     name: 'textAttr',
                     value: [
                        new TextXToken('  this\tis\nfun. \t\n but a\rcan not actually happen  '),
                     ],
                  },
               ]);

               validator.write(elDecl1);
               validator.write(attListDecl1);
               validator.write(startToken1);
               validator.end();

               gatherStreamResults<any>(validator, (tokens) => {
                  expect(tokens[2].attributes[0].value[0].text).toEqual(
                     '  this is fun.    but a can not actually happen  ',
                  );
                  done();
               });
            });

            it('replaces non-space white characters with spaces in a non-CDATA attribute', (done) => {
               const elDecl1 = new ElementDeclarationXToken(
                  'testEl',
                  ContentSpecType.ANY,
                  undefined,
               );
               const attListDecl1 = new AttListDeclarationXToken('testEl', [
                  {
                     name: 'idRefs',
                     type: AttDefinitionType.IDREFS,
                     enumeration: undefined,
                     value: [],
                     defaultType: AttDefaultType.REQUIRED,
                  },
               ]);
               const startToken1 = new ElementStartXToken('testEl', [
                  {
                     name: 'idRefs',
                     value: [
                        new TextXToken('   one\ttwo'),
                        new TextXToken('\nthree '),
                        new TextXToken('four '),
                     ],
                  },
               ]);

               validator.write(elDecl1);
               validator.write(attListDecl1);
               validator.write(startToken1);
               validator.end();

               gatherStreamResults<any>(validator, (tokens) => {
                  expect(tokens[2].attributes[0].value).toEqual([
                     new TextXToken('one two'),
                     new TextXToken(' three '),
                     new TextXToken('four'),
                  ]);
                  done();
               });
            });

            it('treats an attribute on an element without an ATTLIST as CDATA', (done) => {
               const elDecl1 = new ElementDeclarationXToken(
                  'testEl',
                  ContentSpecType.ANY,
                  undefined,
               );
               const startToken1 = new ElementStartXToken('testEl', [
                  {
                     name: 'undefinedAttribute',
                     value: [new TextXToken('   one\ttwo \nthree four')],
                  },
               ]);

               validator.write(elDecl1);
               validator.write(startToken1);
               validator.end();

               gatherStreamResults<any>(validator, (tokens) => {
                  expect(tokens[1].attributes[0].value[0].text).toEqual('   one two  three four');
                  done();
               });
            });
         });
      });

      describe('EmptyElement tokens', () => {
         let attlist: AttListDeclarationXToken;
         let element;

         beforeEach(() => {
            attlist = new AttListDeclarationXToken('one', [
               {
                  name: 'first',
                  type: AttDefinitionType.CDATA,
                  enumeration: undefined,
                  value: [],
                  defaultType: undefined,
               },
            ]);
         });

         it('reports a warning if the ELEMENT declaration indicates that this element does not need to be EMPTY', (done) => {
            element = new ElementDeclarationXToken('one', ContentSpecType.ANY, undefined);
            const startToken = new ElementEmptyXToken('one', []);

            validator.write(element);
            validator.write(startToken);
            validator.end();

            const expected = new WarningToken(warning.id.ELEMENT_EMPTY_WITH_NONEMPTY_DECL, ['one']);
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

            const expected = new WarningToken(warning.id.ATTLISTDECL_ELEMENT_XTRA_DECLARATION, [
               'one',
            ]);
            expectStream(validator, expected, done);
         });

         it('does not blow up if the ATTLIST has no pToken', (done) => {
            const aOne = new AttListDeclarationXToken('one', []);
            const aTwo = new AttListDeclarationXToken('one', []);

            validator.write(aOne);
            validator.write(aTwo);
            validator.end();

            const expected = new WarningToken(warning.id.ATTLISTDECL_ELEMENT_XTRA_DECLARATION, [
               'one',
            ]);
            expectStream(validator, expected, done);
         });

         it('reports no warnings if the related ELEMENT declaration is already present', (done) => {
            const elDecl = new ElementDeclarationXToken(
               'elementType',
               ContentSpecType.EMPTY,
               undefined,
            );
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

            const expected = new WarningToken(warning.id.ATTLISTDECL_NO_ELEMENTDECL, [
               'elementType',
            ]);
            expectStream(validator, expected, done);
         });

         it('has no problems if the PToken is not provided', (done) => {
            const elDecl = new ElementDeclarationXToken(
               'elementType',
               ContentSpecType.EMPTY,
               undefined,
            );
            const attListDecl = new AttListDeclarationXToken('elementType', [
               {
                  name: 'idAttr',
                  type: AttDefinitionType.ID,
                  enumeration: undefined,
                  value: [],
                  defaultType: AttDefaultType.IMPLIED,
               },
            ]);

            validator.write(elDecl);
            validator.write(attListDecl);
            validator.end();

            expectNoErrorsOrWarnings(validator, done);
         });

         it('reports no errors if an ID attribute is well defined', (done) => {
            const elDecl = new ElementDeclarationXToken(
               'elementType',
               ContentSpecType.EMPTY,
               undefined,
            );
            const attListDecl = new AttListDeclarationXToken('elementType', [
               {
                  name: 'idAttr',
                  type: AttDefinitionType.ID,
                  enumeration: undefined,
                  value: [],
                  defaultType: AttDefaultType.IMPLIED,
               },
            ]);

            validator.write(elDecl);
            validator.write(attListDecl);
            validator.end();

            expectNoErrorsOrWarnings(validator, done);
         });

         describe('xml:space', () => {
            it('reports no error on an enumeration declaration with preserve and default as values ', (done) => {
               const elDecl = new ElementDeclarationXToken('elementType', ContentSpecType.EMPTY);
               const attListDecl = new AttListDeclarationXToken('elementType', [
                  {
                     name: 'xml:space',
                     type: AttDefinitionType.ENUMERATION,
                     enumeration: ['preserve', 'default'],
                     defaultType: AttDefaultType.REQUIRED,
                     value: [],
                  },
               ]);

               validator.write(elDecl);
               validator.write(attListDecl);
               validator.end();

               expectNoErrorsOrWarnings(validator, done);
            });

            it('reports no error on an enumeration declaration with just preserve', (done) => {
               const elDecl = new ElementDeclarationXToken('elementType', ContentSpecType.EMPTY);
               const attListDecl = new AttListDeclarationXToken('elementType', [
                  {
                     name: 'xml:space',
                     type: AttDefinitionType.ENUMERATION,
                     enumeration: ['preserve'],
                     defaultType: undefined,
                     value: [],
                  },
               ]);

               validator.write(elDecl);
               validator.write(attListDecl);
               validator.end();

               expectNoErrorsOrWarnings(validator, done);
            });

            it('reports an error the xml:space type is not an enumeration', (done) => {
               const elDecl = new ElementDeclarationXToken('elementType', ContentSpecType.EMPTY);
               const attListDecl = new AttListDeclarationXToken('elementType', [
                  {
                     name: 'xml:space',
                     type: AttDefinitionType.ID,
                     defaultType: AttDefaultType.REQUIRED,
                     enumeration: undefined,
                     value: [],
                  },
               ]);

               validator.write(elDecl);
               validator.write(attListDecl);
               validator.end();

               const expected = new ValidityError(ValidityError.ID.ATTLISTDECL_SPACE_BAD_TYPE, [
                  'elementType',
               ]);
               expectStream(validator, expected, done);
            });

            it('reports an error the xml:space type is an enumeration but the enumeration array is not present', (done) => {
               const elDecl = new ElementDeclarationXToken('elementType', ContentSpecType.EMPTY);
               const attListDecl = new AttListDeclarationXToken('elementType', [
                  {
                     name: 'xml:space',
                     type: AttDefinitionType.ENUMERATION,
                     defaultType: AttDefaultType.REQUIRED,
                     enumeration: undefined,
                     value: [],
                  },
               ]);

               validator.write(elDecl);
               validator.write(attListDecl);
               validator.end();

               const expected = new ValidityError(ValidityError.ID.ATTLISTDECL_SPACE_BAD_TYPE, [
                  'elementType',
               ]);
               expectStream(validator, expected, done);
            });

            it('reports an error the xml:space name is not lower case', (done) => {
               const elDecl = new ElementDeclarationXToken('elementType', ContentSpecType.EMPTY);
               const attListDecl = new AttListDeclarationXToken('elementType', [
                  {
                     name: 'XML:SPACE',
                     type: AttDefinitionType.ENUMERATION,
                     enumeration: ['default'],
                     defaultType: AttDefaultType.REQUIRED,
                     value: [],
                  },
               ]);

               validator.write(elDecl);
               validator.write(attListDecl);
               validator.end();

               const expected = new ValidityError(ValidityError.ID.ATTLISTDECL_SPACE_BAD_CASE, [
                  'elementType',
                  'XML:SPACE',
               ]);
               expectStream(validator, expected, done);
            });

            it('reports an error the xml:space type has no enumerated values specified', (done) => {
               const elDecl = new ElementDeclarationXToken('elementType', ContentSpecType.EMPTY);
               const attListDecl = new AttListDeclarationXToken('elementType', [
                  {
                     name: 'xml:space',
                     type: AttDefinitionType.ENUMERATION,
                     enumeration: [],
                     defaultType: AttDefaultType.IMPLIED,
                     value: [],
                  },
               ]);

               validator.write(elDecl);
               validator.write(attListDecl);
               validator.end();

               const expected = new ValidityError(
                  ValidityError.ID.ATTLISTDECL_SPACE_MISSING_ENUMRATION,
                  ['elementType'],
               );
               expectStream(validator, expected, done);
            });

            it('reports an error the xml:space type has a value in the wrong case', (done) => {
               const elDecl = new ElementDeclarationXToken('elementType', ContentSpecType.EMPTY);
               const attListDecl = new AttListDeclarationXToken('elementType', [
                  {
                     name: 'xml:space',
                     type: AttDefinitionType.ENUMERATION,
                     enumeration: ['PRESERVE', 'default'],
                     defaultType: AttDefaultType.IMPLIED,
                     value: [],
                  },
               ]);

               validator.write(elDecl);
               validator.write(attListDecl);
               validator.end();

               const expected = new ValidityError(
                  ValidityError.ID.ATTLISTDECL_SPACE_BAD_ENUMRATION,
                  ['elementType', 'PRESERVE'],
               );
               expectStream(validator, expected, done);
            });

            it('reports an error the xml:space type has an illegal value', (done) => {
               const elDecl = new ElementDeclarationXToken('elementType', ContentSpecType.EMPTY);
               const attListDecl = new AttListDeclarationXToken('elementType', [
                  {
                     name: 'xml:space',
                     type: AttDefinitionType.ENUMERATION,
                     enumeration: ['bogus', 'default'],
                     defaultType: AttDefaultType.IMPLIED,
                     value: [],
                  },
               ]);

               validator.write(elDecl);
               validator.write(attListDecl);
               validator.end();

               const expected = new ValidityError(
                  ValidityError.ID.ATTLISTDECL_SPACE_BAD_ENUMRATION,
                  ['elementType', 'bogus'],
               );
               expectStream(validator, expected, done);
            });
         });

         describe('NOTATION', () => {
            function setup(ver: ConformanceVersion) {
               const endOfDocType = new DocTypeEndXToken();
               const elDecl = new ElementDeclarationXToken(
                  'elementType',
                  ContentSpecType.ANY,
                  undefined,
               );
               const attListDecl = new AttListDeclarationXToken('elementType', [
                  {
                     name: 'notation1',
                     type: AttDefinitionType.NOTATION,
                     enumeration: [],
                     value: [],
                     defaultType: AttDefaultType.IMPLIED,
                  },
                  {
                     name: 'ref',
                     type: AttDefinitionType.IDREF,
                     value: [],
                     enumeration: undefined,
                     defaultType: AttDefaultType.REQUIRED,
                  },
                  {
                     name: 'notation2',
                     type: AttDefinitionType.NOTATION,
                     enumeration: [],
                     value: [],
                     defaultType: AttDefaultType.REQUIRED,
                  },
               ]);

               validator.write(ver);
               validator.write(elDecl);
               validator.write(attListDecl);
               validator.write(endOfDocType);
               validator.end();
            }

            function setupEmptyElement(ver: ConformanceVersion) {
               const endOfDocType = new DocTypeEndXToken();
               const elDecl = new ElementDeclarationXToken(
                  'elementType',
                  ContentSpecType.EMPTY,
                  undefined,
               );
               const attListDecl = new AttListDeclarationXToken('elementType', [
                  {
                     name: 'notation1',
                     type: AttDefinitionType.NOTATION,
                     enumeration: [],
                     value: [],
                     defaultType: AttDefaultType.IMPLIED,
                  },
                  {
                     name: 'ref',
                     type: AttDefinitionType.IDREF,
                     defaultType: AttDefaultType.REQUIRED,
                     enumeration: undefined,
                     value: [],
                  },
               ]);

               validator.write(ver);
               validator.write(elDecl);
               validator.write(attListDecl);
               validator.write(endOfDocType);
               validator.end();
            }

            function setupDuplicateNotationValues(ver: ConformanceVersion) {
               const endOfDocType = new DocTypeEndXToken();
               const elDecl = new ElementDeclarationXToken(
                  'elementType',
                  ContentSpecType.ANY,
                  undefined,
               );
               const notation1 = new NotationDeclarationXToken('first', undefined);
               const notation2 = new NotationDeclarationXToken('second', undefined);
               const notation3 = new NotationDeclarationXToken('third', undefined);
               const attListDecl = new AttListDeclarationXToken('elementType', [
                  {
                     name: 'notationAttr',
                     type: AttDefinitionType.NOTATION,
                     enumeration: ['first', 'second', 'first', 'third', 'third', 'first'],
                     value: [],
                     defaultType: AttDefaultType.IMPLIED,
                  },
               ]);

               validator.write(ver);
               validator.write(notation1);
               validator.write(notation2);
               validator.write(notation3);
               validator.write(elDecl);
               validator.write(attListDecl);
               validator.write(endOfDocType);
               validator.end();
            }

            it('reports no error if a 1.0/1 ATTLISTs NOTATION declaration has duplicate names', (done) => {
               setupDuplicateNotationValues(new ConformanceVersion(1.0, 1));

               expectNoErrorsOrWarnings(validator, done);
            });

            it('reports no error if an 1.0/1 ATTLIST has more than one NOTATION attribute', (done) => {
               setup(new ConformanceVersion(1.0, 1));

               expectNoErrorsOrWarnings(validator, done);
            });
         });

         describe('ENUMERATION', () => {
            function setupDuplicateEnumerationValues(ver: ConformanceVersion) {
               const endOfDocType = new DocTypeEndXToken();
               const elDecl = new ElementDeclarationXToken(
                  'elementType',
                  ContentSpecType.ANY,
                  undefined,
               );
               const attListDecl = new AttListDeclarationXToken('elementType', [
                  {
                     name: 'enumerationAttr',
                     type: AttDefinitionType.ENUMERATION,
                     enumeration: ['first', 'second', 'first', 'third', 'third', 'first'],
                     value: [],
                     defaultType: AttDefaultType.IMPLIED,
                  },
               ]);

               validator.write(ver);
               validator.write(elDecl);
               validator.write(attListDecl);
               validator.write(endOfDocType);
               validator.end();
            }

            it('reports no error if a 1.0/1 ATTLISTs ENUMERATION declaration has duplicate nmTokens', (done) => {
               setupDuplicateEnumerationValues(new ConformanceVersion(1.0, 1));

               expectNoErrorsOrWarnings(validator, done);
            });

            it('reports no error if a 1.0/3 ATTLISTs ENUMERATION declaration has no duplicate nmTokens', (done) => {
               const endOfDocType = new DocTypeEndXToken();
               const elDecl = new ElementDeclarationXToken(
                  'elementType',
                  ContentSpecType.ANY,
                  undefined,
               );
               const attListDecl = new AttListDeclarationXToken('elementType', [
                  {
                     name: 'enumerationAttr',
                     type: AttDefinitionType.ENUMERATION,
                     enumeration: ['first', 'second'],
                     value: [],
                     defaultType: AttDefaultType.IMPLIED,
                  },
               ]);

               validator.write(new ConformanceVersion(1.0, 3));
               validator.write(elDecl);
               validator.write(attListDecl);
               validator.write(endOfDocType);
               validator.end();

               expectNoErrorsOrWarnings(validator, done);
            });
         });

         it('reports a warning if more than one attribute definition is provided for an attribute', (done) => {
            const endOfDocType = new DocTypeEndXToken();
            const attListDecl1 = new AttListDeclarationXToken('elementType', [
               {
                  name: 'idAttr',
                  type: AttDefinitionType.ID,
                  enumeration: undefined,
                  value: [],
                  defaultType: AttDefaultType.IMPLIED,
               },
               {
                  name: 'anAttribute',
                  type: AttDefinitionType.CDATA,
                  enumeration: undefined,
                  value: [],
                  defaultType: AttDefaultType.REQUIRED,
               },
            ]);
            const attListDecl2 = new AttListDeclarationXToken('elementType', [
               {
                  name: 'anAttribute',
                  type: AttDefinitionType.ID, // This would cause us to have two ID's, if this were honored
                  enumeration: undefined,
                  value: [],
                  defaultType: AttDefaultType.REQUIRED,
               },
            ]);

            validator.write(attListDecl1);
            validator.write(attListDecl2);
            validator.write(endOfDocType);
            validator.end();

            const expected = new WarningToken(warning.id.ATTLISTDECL_ATTR_XTRA_DECLARATION, [
               'elementType',
               'anAttribute',
            ]);
            expectStream(validator, expected, done);
         });

         it('reports an error if an attribute default has no declaration for a reference (§4.1)', (done) => {
            const elDecl1 = new ElementDeclarationXToken('testEl', ContentSpecType.ANY, undefined);
            const attListDecl1 = new AttListDeclarationXToken('testEl', [
               {
                  name: 'textAttr',
                  type: AttDefinitionType.CDATA,
                  value: [new GeneralEntityReferenceXToken('foo')],
                  enumeration: undefined,
                  defaultType: undefined,
               },
            ]);

            validator.write(new XmlDeclarationXToken(1.0, undefined, true));
            validator.write(new InternalSubsetStartToken());
            validator.write(elDecl1);
            validator.write(attListDecl1);
            validator.write(new InternalSubsetEndToken());
            validator.end();

            const expected = new ValidityError(ValidityError.ID.ATTLISTDECL_REFERENCE_UNDEFINED, [
               'foo',
               'textAttr',
               'testEl',
            ]);
            expectStream(validator, expected, done);
         });
      });

      describe('ENTITY', () => {
         it('reports a warning if multiple ENTITY declarations with the same name are given', (done) => {
            const peDecl1 = new ParameterEntityDeclarationXToken('one', []);
            const peDecl2 = new ParameterEntityDeclarationXToken('one', []);
            const expected = new WarningToken(warning.id.ENTITYDECL_XRA_DECLARATION, ['one']);

            validator.write(peDecl1);
            validator.write(peDecl2);
            validator.end();

            expectStream(validator, expected, done);
         });

         it('reports a warning if multiple ENTITY declarations with the same name are given', (done) => {
            const geDecl1 = new GeneralEntityDeclarationXToken('one', []);
            const geDecl2 = new GeneralEntityDeclarationXToken('one', []);
            const expected = new WarningToken(warning.id.ENTITYDECL_XRA_DECLARATION, ['one']);

            validator.write(geDecl1);
            validator.write(geDecl2);
            validator.end();

            expectStream(validator, expected, done);
         });
      });

      describe('ELEMENT', () => {
         it('reports no errors if multiple ELEMENT declarations are provided', (done) => {
            const elDecl1 = new ElementDeclarationXToken('one', ContentSpecType.EMPTY, undefined);
            const elDecl2 = new ElementDeclarationXToken('two', ContentSpecType.EMPTY, undefined);

            validator.write(elDecl1);
            validator.write(elDecl2);
            validator.end();

            expectNoErrorsOrWarnings(validator, done);
         });

         it('reports no errors if the element has no pToken', (done) => {
            const elDecl1 = new ElementDeclarationXToken('one', ContentSpecType.EMPTY, undefined);
            const elDecl2 = new ElementDeclarationXToken('two', ContentSpecType.EMPTY, undefined);

            validator.write(elDecl1);
            validator.write(elDecl2);
            validator.end();

            expectNoErrorsOrWarnings(validator, done);
         });
      });

      describe('entity reference', () => {
         it('reports an error if a general entity reference is found, but there is no declaration for it (§4.1)', (done) => {
            validator.write(new XmlDeclarationXToken(1.0, undefined, true));
            validator.write(new GeneralEntityReferenceXToken('undeclared'));
            validator.end();

            const expected = new ValidityError(ValidityError.ID.GEREF_UNDEFINED, ['undeclared']);
            expectStream(validator, expected, done);
         });

         it('reports an error if a parameter entity reference is found, but there is no declaration for it (§4.1)', (done) => {
            validator.write(new XmlDeclarationXToken(1.0, undefined, true));
            validator.write(new ParameterEntityReferenceXToken('undeclared'));
            validator.end();

            const expected = new ValidityError(ValidityError.ID.PEREF_UNDEFINED, ['undeclared']);
            expectStream(validator, expected, done);
         });
      });

      describe('Error tokens', () => {
         it('ignores Errors when doing overall contextual checking', (done) => {
            const elDecl1 = new ElementDeclarationXToken('one', ContentSpecType.ANY, undefined);
            const startToken = new ElementStartXToken('one', []);

            validator.write(elDecl1);
            validator.write(startToken);
            validator.write(new WellFormedError(WellFormedError.ID.ELEMENTDECL_NO_NAME, ['x']));
            validator.end();

            gatherStreamResults<any>(validator, (tokens) => {
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
            ];
            data.forEach(([token, version, rev, causesError]) => {
               let errorToken: ValidityError;

               if (causesError) {
                  if (token === commentToken) {
                     errorToken = new ValidityError(ValidityError.ID.ANY_XTRA_COMMENT, [
                        'one',
                        version.toString(),
                        rev.toString(),
                     ]);
                  } else if (token === piToken) {
                     errorToken = new ValidityError(ValidityError.ID.ANY_XTRA_PI, [
                        'one',
                        version.toString(),
                        rev.toString(),
                     ]);
                  } else if (token === cDataToken) {
                     errorToken = new ValidityError(ValidityError.ID.ANY_XTRA_CDATA, [
                        'one',
                        version.toString(),
                        rev.toString(),
                     ]);
                  }
               }

               it(`${causesError ? 'reports an error' : 'accepts'} if a ${
                  token.type
               } token appears in an ANY element in XML ${version}/${rev} (§3.0.0)`, (done) => {
                  const confVer = new ConformanceVersion(version, rev);
                  const elementDecl = new ElementDeclarationXToken('one', ContentSpecType.ANY);
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
               const elementDecl = new ElementDeclarationXToken('one', ContentSpecType.ANY);
               const startToken = new ElementStartXToken('one', []);

               validator.write(elementDecl);
               validator.write(startToken);
               validator.write(elementDecl);
               validator.end();

               const errorToken = new ValidityError(ValidityError.ID.ANY_XTRA_MARKUP, ['one']);
               expectStream(validator, errorToken, done);
            });

            it('reports errors even when no ptoken is present', (done) => {
               const elementDecl = new ElementDeclarationXToken('one', ContentSpecType.ANY);
               const startToken = new ElementStartXToken('one', []);

               validator.write(elementDecl);
               validator.write(startToken);
               validator.write(elementDecl);
               validator.end();

               const errorToken = new ValidityError(ValidityError.ID.ANY_XTRA_MARKUP, ['one']);
               expectStream(validator, errorToken, done);
            });

            it('reports no errors when passing char data through it for 1.0/5 (§3.0.0)', (done) => {
               const elementDecl = new ElementDeclarationXToken('one', ContentSpecType.ANY);
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
               const elementDecl = new ElementDeclarationXToken('one', ContentSpecType.ANY);
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

         describe('MIXED content', () => {
            it('reports no error if there is a comment found in mixed content  in 1.0/1 (§3.0.0)', (done) => {
               const elementDecl = new ElementDeclarationXToken('one', ContentSpecType.ELEMENT, {
                  particles: [
                     {
                        name: '#PCDATA',
                        repeat: CpRepeat.ONE,
                     },
                  ],
                  repeat: CpRepeat.ONE,
                  listType: CpType.CHOICE,
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
               const elementDecl = new ElementDeclarationXToken('one', ContentSpecType.ELEMENT, {
                  particles: [
                     {
                        name: '#PCDATA',
                        repeat: CpRepeat.ONE,
                     },
                  ],
                  repeat: CpRepeat.ONE,
                  listType: CpType.CHOICE,
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
               const elementDecl = new ElementDeclarationXToken('one', ContentSpecType.ELEMENT, {
                  particles: [
                     {
                        name: '#PCDATA',
                        repeat: CpRepeat.ONE,
                     },
                  ],
                  repeat: CpRepeat.ONE,
                  listType: CpType.CHOICE,
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
               const elementDecl = new ElementDeclarationXToken('one', ContentSpecType.ELEMENT, {
                  particles: [
                     {
                        name: '#PCDATA',
                        repeat: CpRepeat.ONE,
                     },
                  ],
                  repeat: CpRepeat.ONE,
                  listType: CpType.CHOICE,
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
               const elementDecl = new ElementDeclarationXToken('one', ContentSpecType.ELEMENT, {
                  particles: [
                     {
                        name: '#PCDATA',
                        repeat: CpRepeat.ONE,
                     },
                  ],
                  repeat: CpRepeat.ONE,
                  listType: CpType.CHOICE,
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
               const elementDecl = new ElementDeclarationXToken('one', ContentSpecType.ELEMENT, {
                  particles: [
                     {
                        name: '#PCDATA',
                        repeat: CpRepeat.ONE,
                     },
                  ],
                  repeat: CpRepeat.ONE,
                  listType: CpType.CHOICE,
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
               const elementDecl = new ElementDeclarationXToken('one', ContentSpecType.ELEMENT, {
                  particles: [
                     {
                        name: '#PCDATA',
                        repeat: CpRepeat.ONE,
                     },
                  ],
                  repeat: CpRepeat.ONE,
                  listType: CpType.CHOICE,
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
               const elementDecl = new ElementDeclarationXToken('one', ContentSpecType.ELEMENT, {
                  particles: [
                     {
                        name: '#PCDATA',
                        repeat: CpRepeat.ONE,
                     },
                  ],
                  repeat: CpRepeat.ONE,
                  listType: CpType.CHOICE,
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
               const elementDecl = new ElementDeclarationXToken('one', ContentSpecType.ELEMENT, {
                  particles: [
                     {
                        name: '#PCDATA',
                        repeat: CpRepeat.ONE,
                     },
                  ],
                  repeat: CpRepeat.ONE,
                  listType: CpType.CHOICE,
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
               const elementDecl = new ElementDeclarationXToken('one', ContentSpecType.ELEMENT, {
                  particles: [
                     {
                        name: '#PCDATA',
                        repeat: CpRepeat.ONE,
                     },
                  ],
                  repeat: CpRepeat.ONE,
                  listType: CpType.CHOICE,
               });

               validator.write(elementDecl);
               validator.write(new ElementStartXToken('one', []));
               validator.write(new ElementDeclarationXToken('two', ContentSpecType.ANY));
               validator.end();

               const expected = new ValidityError(ValidityError.ID.MIXED_XTRA_MARKUP, ['one']);
               expectStream(validator, expected, done);
            });
         });
      });
   });
});
