/* Copyright ® 2017-2019 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { gatherStreamResults } from 'basic-test';
import { ConformanceVersion, ERROR_TYPE, warning, WarningToken } from 'basic';
import { WellFormedError } from 'wellformedness';
import { SToken } from 'sToken';
import {
   AttDefinitionType,
   AttDefaultType,
   AttListDeclarationXToken,
   ContentSpecType,
   DocTypeEndXToken,
   DocTypeStartXToken,
   ElementDeclarationXToken,
   ElementEmptyXToken,
   ElementStartXToken,
   NotationDeclarationXToken,
   GeneralEntityDeclarationXToken,
   ParameterEntityDeclarationXToken,
   XmlDeclarationXToken,
} from 'xToken';

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
   });
});
