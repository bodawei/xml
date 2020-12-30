/* Copyright ® 2018-2019 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityId, CONFORMANCE_VERSION, ENTITY_ID, ConformanceVersion,  } from 'basic';
import { defaultExtractors } from 'extractor';
import {
   ATTLIST_DECLARATION_PTOKEN,
   ELEMENT_DECLARATION_PTOKEN,
   GENERAL_ENTITY_DECLARATION_PTOKEN,
   PARAMETER_ENTITY_DECLARATION_PTOKEN,
   TEXT_PTOKEN,
   TEXTDECL_PTOKEN,
   XMLDECL_PTOKEN,
   ContextType,
   ParseValue,
} from 'pToken';
import { PTokenStream } from 'pTokenStream';
import { STokenSource } from 'sToken';
import {
   CHARREF_PTOKEN,
   DOCTYPE_START_PTOKEN,
   INTERNAL_SUBSET_START_TOKEN,
   INTERNAL_SUBSET_END_TOKEN,
   DOCTYPE_END_PTOKEN,
   SPACE_PTOKEN,
   ELEMENT_START_PTOKEN,
   CHARDATA_PTOKEN,
   ELEMENT_END_PTOKEN,
   ELEMENT_EMPTY_PTOKEN,
   EXTERNAL_SUBSET_END_TOKEN,
   EXTERNAL_SUBSET_START_TOKEN,
   GENERAL_ENTITY_START_PTOKEN,
   GENERAL_ENTITY_END_PTOKEN,
   PARAMETER_ENTITY_END_PTOKEN,
   PARAMETER_ENTITY_START_PTOKEN,
   CharDataPToken,
   CONDITIONAL_PTOKEN,
   CONDITIONAL_CLOSE_PTOKEN,
   GENERAL_ENTITY_REFERENCE_PTOKEN,
} from 'token';
import { EntityExpanderStream } from '../EntityExpanderStream';
import { gatherStream } from './helpers';

describe('EntityExpanderStream (integration)', () => {
   let pTokenStream: PTokenStream;
   let entityExpander: EntityExpanderStream;

   beforeEach(() => {
      pTokenStream = new PTokenStream(new STokenSource(defaultExtractors), {
         context: ContextType.DOCUMENT,
         confVer: new ConformanceVersion(1.0),
         entityId: new EntityId(__filename)
      });
      entityExpander = new EntityExpanderStream(true);

      pTokenStream.pipe(entityExpander);
   });

   function getIndex(tokens: Array<ParseValue>, type: string): number {
      let found = -1;

      for (let index = 0; index < tokens.length; index++) {
         const token = tokens[index];

         if (found === -1 && token.type === type) {
            found = index;
         }
      }

      if (found === -1) {
         throw new Error(`Did not find a token with the type ${type}`);
      }

      return found;
   }

   describe('Case 1: Expand the external subset', () => {
      it('expands the external subset', (done) => {
         pTokenStream.addText(`<?xml version="1.0"?>
         <!DOCTYPE one SYSTEM "./docs/testForCase1.xml">
         <one>&one;</one>`);
         pTokenStream.endText();

         gatherStream(
            entityExpander,
            (results) => {
               const types = results.map((token: any) => token.type);
               expect(types).toEqual([
                  CONFORMANCE_VERSION,
                  ENTITY_ID,
                  XMLDECL_PTOKEN,
                  SPACE_PTOKEN,
                  DOCTYPE_START_PTOKEN,
                  EXTERNAL_SUBSET_START_TOKEN,
                  PARAMETER_ENTITY_DECLARATION_PTOKEN,
                  SPACE_PTOKEN,
                  PARAMETER_ENTITY_START_PTOKEN,
                  GENERAL_ENTITY_DECLARATION_PTOKEN,
                  PARAMETER_ENTITY_END_PTOKEN,
                  SPACE_PTOKEN,
                  ELEMENT_DECLARATION_PTOKEN,
                  SPACE_PTOKEN,
                  EXTERNAL_SUBSET_END_TOKEN,
                  DOCTYPE_END_PTOKEN,
                  SPACE_PTOKEN,
                  ELEMENT_START_PTOKEN,
                  GENERAL_ENTITY_START_PTOKEN,
                  CHARDATA_PTOKEN,
                  GENERAL_ENTITY_END_PTOKEN,
                  ELEMENT_END_PTOKEN,
               ]);
            },
            done,
         );
      });
   });

   describe('Case 2: Expand parameter entity references in the DTD', () => {
      it('replaces references in the default value of an ATTLIST', (done) => {
         pTokenStream.addText(`<?xml version="1.0"?>
         <!DOCTYPE one [
            <!ENTITY % internalPE "<!ENTITY one 'my content'>">
            %internalPE;
            <!ELEMENT one EMPTY>
         ]>
         <one>&one;</one>`);
         pTokenStream.endText();

         gatherStream(
            entityExpander,
            (results) => {
               const types = results.map((token: any) => token.type);
               expect(types).toEqual([
                  CONFORMANCE_VERSION,
                  ENTITY_ID,
                  XMLDECL_PTOKEN,
                  SPACE_PTOKEN,
                  DOCTYPE_START_PTOKEN,
                  INTERNAL_SUBSET_START_TOKEN,
                  SPACE_PTOKEN,
                  PARAMETER_ENTITY_DECLARATION_PTOKEN,
                  SPACE_PTOKEN,
                  PARAMETER_ENTITY_START_PTOKEN,
                  GENERAL_ENTITY_DECLARATION_PTOKEN,
                  PARAMETER_ENTITY_END_PTOKEN,
                  SPACE_PTOKEN,
                  ELEMENT_DECLARATION_PTOKEN,
                  SPACE_PTOKEN,
                  INTERNAL_SUBSET_END_TOKEN,
                  DOCTYPE_END_PTOKEN,
                  SPACE_PTOKEN,
                  ELEMENT_START_PTOKEN,
                  GENERAL_ENTITY_START_PTOKEN,
                  CHARDATA_PTOKEN,
                  GENERAL_ENTITY_END_PTOKEN,
                  ELEMENT_END_PTOKEN,
               ]);
            },
            done,
         );
      });
   });

   describe('Case 3: Expand parameter entity references in the value of internal paramter and general entities', () => {
      it('expands', (done) => {
         pTokenStream.addText(`<?xml version="1.0"?>
         <!DOCTYPE one [
            <!ENTITY % grandparent "Grandma ">
            <!ENTITY % parent "Parent to %grandparent;">
            <!ENTITY child "Child to %parent;">
            <!ELEMENT one EMPTY>
         ]>
         <one>&child;</one>`);
         pTokenStream.endText();

         gatherStream(
            entityExpander,
            (results) => {
               const index = getIndex(results, CHARDATA_PTOKEN);

               expect((results[index] as any).text.str).toEqual('Child to Parent to Grandma ');
            },
            done,
         );
      });
   });

   describe('Case 4: Expansion of parameter entity references in the values of external parameter entities', () => {
      it('expands', (done) => {
         pTokenStream.addText(`<?xml version="1.0"?>
         <!DOCTYPE one SYSTEM "./docs/testForCase4.xml" [
            <!ELEMENT one EMPTY>
         ]>
         <one>&child;</one>`);
         pTokenStream.endText();

         gatherStream(
            entityExpander,
            (results) => {
               const index = getIndex(results, CHARDATA_PTOKEN);

               expect((results[index] as any).text.str).toEqual(
                  'ExternalChild to ExternalParent to ExternalGrandma ',
               );
            },
            done,
         );
      });
   });

   describe('Case 5: Expansion of parameter entity references in markup declarations but not in literals', () => {
      it('expands', (done) => {
         pTokenStream.addText(`<?xml version="1.0"?>
         <!DOCTYPE one SYSTEM "./docs/testForCase5.xml" [
            <!ELEMENT one EMPTY>
         ]>
         <one>&epandedEntity;</one>`);
         pTokenStream.endText();

         gatherStream(
            entityExpander,
            (results) => {
               const index = getIndex(results, CHARDATA_PTOKEN);

               expect((results[index] as any).text.str).toEqual('unassigned works');
            },
            done,
         );
      });
   });

   describe('Case 6: Expand general entities in an ATTLIST default value', () => {
      it('replaces references in the default value of an ATTLIST', (done) => {
         pTokenStream.addText(`<?xml version="1.0"?>
         <!DOCTYPE one [
            <!ENTITY % internalPE "foo">
            <!ENTITY internalGE "(%internalPE;)">
            <!ELEMENT one EMPTY>
            <!ATTLIST one
               first CDATA "Foo &#30;1 --> &internalGE;"
            >
         ]>
         <one/>`);
         pTokenStream.endText();

         gatherStream(
            entityExpander,
            (results) => {
               const index = getIndex(results, ATTLIST_DECLARATION_PTOKEN);

               const types = (results[index] as any).attDefs[0].value.map(
                  (token: any) => token.type,
               );
               expect(types).toEqual([
                  TEXT_PTOKEN,
                  CHARREF_PTOKEN,
                  TEXT_PTOKEN,
                  GENERAL_ENTITY_START_PTOKEN,
                  TEXT_PTOKEN,
                  GENERAL_ENTITY_END_PTOKEN,
               ]);
            },
            done,
         );
      });
   });

   describe('Case 7: Expand general entities in attributes', () => {
      it('replaces references in element attributes', (done) => {
         pTokenStream.addText(`<?xml version="1.0"?>
         <!DOCTYPE one [
            <!ENTITY % internalPE "foo">
            <!ENTITY internalGE "(%internalPE;)">
            <!ELEMENT one EMPTY>
            <!ATTLIST one
               first CDATA #IMPLIED
            >
         ]>
         <one second="first &#45; &internalGE;"/>`);
         pTokenStream.endText();

         gatherStream(
            entityExpander,
            (results) => {
               const index = getIndex(results, ELEMENT_EMPTY_PTOKEN);

               const types = (results[index] as any).attributes[0].value.map(
                  (token: any) => token.type,
               );
               expect(types).toEqual([
                  TEXT_PTOKEN,
                  CHARREF_PTOKEN,
                  TEXT_PTOKEN,
                  GENERAL_ENTITY_START_PTOKEN,
                  TEXT_PTOKEN,
                  GENERAL_ENTITY_END_PTOKEN,
               ]);
            },
            done,
         );
      });
   });

   describe('Case 8: Expand general entities in the content', () => {
      it('replaces an general entity reference with an entity start and end token', (done) => {
         pTokenStream.addText(`<?xml version="1.0"?>
         <!DOCTYPE one [
            <!ENTITY anEntity "the value">
            <!ELEMENT one ANY>
         ]>
         <one>
            &anEntity;
         </one>`);
         pTokenStream.endText();

         gatherStream(
            entityExpander,
            (results) => {
               const types = results.map((result) => result.type);

               expect(types).toEqual([
                  CONFORMANCE_VERSION,
                  ENTITY_ID,
                  XMLDECL_PTOKEN,
                  SPACE_PTOKEN,
                  DOCTYPE_START_PTOKEN,
                  INTERNAL_SUBSET_START_TOKEN,
                  SPACE_PTOKEN,
                  GENERAL_ENTITY_DECLARATION_PTOKEN,
                  SPACE_PTOKEN,
                  ELEMENT_DECLARATION_PTOKEN,
                  SPACE_PTOKEN,
                  INTERNAL_SUBSET_END_TOKEN,
                  DOCTYPE_END_PTOKEN,
                  SPACE_PTOKEN,
                  ELEMENT_START_PTOKEN,
                  CHARDATA_PTOKEN,
                  GENERAL_ENTITY_START_PTOKEN,
                  CHARDATA_PTOKEN,
                  GENERAL_ENTITY_END_PTOKEN,
                  CHARDATA_PTOKEN,
                  ELEMENT_END_PTOKEN,
               ]);
            },
            done,
         );
      });
   });

   describe('Case 9: Expand the parameter to a conditional section', () => {
      it('includes the parsed content within the conditional section', (done) => {
         pTokenStream.addText(`<?xml version="1.0"?>
         <!DOCTYPE one [
            <!ENTITY % doit " INCLUDE">
            <![%doit;[
               <!ENTITY anEntity "the value">
               <!ELEMENT one ANY>
            ]]>
         ]>
         <one>
            &anEntity;
         </one>`);
         pTokenStream.endText();

         gatherStream(
            entityExpander,
            (results) => {
               const types = results.map((result) => result.type);

               expect(types).toEqual([
                  CONFORMANCE_VERSION,
                  ENTITY_ID,
                  XMLDECL_PTOKEN,
                  SPACE_PTOKEN,
                  DOCTYPE_START_PTOKEN,
                  INTERNAL_SUBSET_START_TOKEN,
                  SPACE_PTOKEN,
                  PARAMETER_ENTITY_DECLARATION_PTOKEN,
                  SPACE_PTOKEN,
                  CONDITIONAL_PTOKEN,
                  SPACE_PTOKEN,
                  GENERAL_ENTITY_DECLARATION_PTOKEN,
                  SPACE_PTOKEN,
                  ELEMENT_DECLARATION_PTOKEN,
                  SPACE_PTOKEN,
                  CONDITIONAL_CLOSE_PTOKEN,
                  SPACE_PTOKEN,
                  INTERNAL_SUBSET_END_TOKEN,
                  DOCTYPE_END_PTOKEN,
                  SPACE_PTOKEN,
                  ELEMENT_START_PTOKEN,
                  CHARDATA_PTOKEN,
                  GENERAL_ENTITY_START_PTOKEN,
                  CHARDATA_PTOKEN,
                  GENERAL_ENTITY_END_PTOKEN,
                  CHARDATA_PTOKEN,
                  ELEMENT_END_PTOKEN,
               ]);
            },
            done,
         );
      });

      it('ignores content within an ignored conditional section', (done) => {
         pTokenStream.addText(`<?xml version="1.0"?>
         <!DOCTYPE one [
            <!ENTITY % doit " IGNORE ">
            <![%doit;[
               <!ENTITY anEntity "the value">
               <!ELEMENT one ANY>
            ]]>
         ]>
         <one>
            &anEntity;
         </one>`);
         pTokenStream.endText();

         gatherStream(
            entityExpander,
            (results) => {
               const types = results.map((result) => result.type);

               expect(types).toEqual([
                  CONFORMANCE_VERSION,
                  ENTITY_ID,
                  XMLDECL_PTOKEN,
                  SPACE_PTOKEN,
                  DOCTYPE_START_PTOKEN,
                  INTERNAL_SUBSET_START_TOKEN,
                  SPACE_PTOKEN,
                  PARAMETER_ENTITY_DECLARATION_PTOKEN,
                  SPACE_PTOKEN,
                  CONDITIONAL_PTOKEN,
                  TEXT_PTOKEN,
                  CONDITIONAL_CLOSE_PTOKEN,
                  SPACE_PTOKEN,
                  INTERNAL_SUBSET_END_TOKEN,
                  DOCTYPE_END_PTOKEN,
                  SPACE_PTOKEN,
                  ELEMENT_START_PTOKEN,
                  CHARDATA_PTOKEN,
                  GENERAL_ENTITY_REFERENCE_PTOKEN,
                  CHARDATA_PTOKEN,
                  ELEMENT_END_PTOKEN,
               ]);
            },
            done,
         );
      });
   });

   describe('Other cases', () => {
      it('expands predefined entities in external general entities', (done) => {
         pTokenStream.addText(`<?xml version="1.0" encoding="UTF-8"?>
         <!DOCTYPE TESTSUITE [
             <!ENTITY jclark-xmltest	SYSTEM "./docs/xmltest.xml">
         ] >
         <TESTSUITE>
            &jclark-xmltest;
         </TESTSUITE>`);
         pTokenStream.endText();

         gatherStream(
            entityExpander,
            (results) => {
               const types = results.map((result) => result.type);

               expect((results[22] as CharDataPToken).text.str).toEqual('>');
               expect(types).toEqual([
                  CONFORMANCE_VERSION,
                  ENTITY_ID,
                  XMLDECL_PTOKEN,
                  SPACE_PTOKEN,
                  DOCTYPE_START_PTOKEN,
                  INTERNAL_SUBSET_START_TOKEN,
                  SPACE_PTOKEN,
                  GENERAL_ENTITY_DECLARATION_PTOKEN,
                  SPACE_PTOKEN,
                  INTERNAL_SUBSET_END_TOKEN,
                  DOCTYPE_END_PTOKEN,
                  SPACE_PTOKEN,
                  ELEMENT_START_PTOKEN,
                  CHARDATA_PTOKEN,
                  GENERAL_ENTITY_START_PTOKEN,
                  TEXTDECL_PTOKEN,
                  CHARDATA_PTOKEN,
                  ELEMENT_START_PTOKEN,
                  CHARDATA_PTOKEN,
                  ELEMENT_START_PTOKEN,
                  CHARDATA_PTOKEN,
                  GENERAL_ENTITY_START_PTOKEN,
                  CHARDATA_PTOKEN,
                  GENERAL_ENTITY_END_PTOKEN,
                  CHARDATA_PTOKEN,
                  ELEMENT_END_PTOKEN,
                  CHARDATA_PTOKEN,
                  ELEMENT_END_PTOKEN,
                  SPACE_PTOKEN,
                  GENERAL_ENTITY_END_PTOKEN,
                  CHARDATA_PTOKEN,
                  ELEMENT_END_PTOKEN
               ]);
            },
            done,
         );
      });

   });

   // it('replaces a parameter entity reference with an entity start and end token', (done) => {
   //    pTokenStream.addText(`<?xml version="1.0"?>
   //       <!DOCTYPE one [
   //          <!ENTITY % anEntity "the value">
   //          <!ELEMENT one ANY>
   //          %anEntity;
   //       ]>
   //       <one></one>`);
   //    pTokenStream.endText();

   //    gatherStream(
   //       entityExpander,
   //       (results) => {
   //          const index = getIndex(results, PARAMETER_ENTITY_START_PTOKEN);

   //          expect(results[index + 1].type).toEqual(CHARDATA_PTOKEN);
   //          expect(results[index + 2].type).toEqual(PARAMETER_ENTITY_END_PTOKEN);
   //       },
   //       done,
   //    );
   // });

   // it('replaces a multiply nested entity', (done) => {
   //    pTokenStream.addText(`<?xml version="1.0"?>
   //       <!DOCTYPE one [
   //          <!ENTITY seven "≤done≥">
   //          <!ENTITY six "{&seven;}">
   //          <!ENTITY five "[&six;]">
   //          <!ENTITY four " (&five;) ">
   //          <!ENTITY three "{&four;}">
   //          <!ENTITY two "[&three;]">
   //          <!ENTITY base "(&two;)">
   //          <!ELEMENT one ANY>
   //       ]>
   //       <one>
   //          &base;
   //       </one>`);
   //    pTokenStream.endText();

   //    gatherStream(
   //       entityExpander,
   //       (results) => {
   //          const index = getIndex(results, GENERAL_ENTITY_START_PTOKEN);

   //          expect(results[index + 2].type).toEqual(GENERAL_ENTITY_START_PTOKEN);
   //          expect(results[index + 26].type).toEqual(GENERAL_ENTITY_END_PTOKEN);
   //       },
   //       done,
   //    );
   // });

   // it('pre-parses internal entity values for character references, and treats them as content', (done) => {
   //    pTokenStream.addText(`<?xml version="1.0"?>
   //       <!DOCTYPE one [
   //          <!ENTITY elementWithCharRef "&#x3c;two></two>">
   //          <!ELEMENT one ANY>
   //          <!ELEMENT two ANY>
   //       ]>
   //       <one>
   //          &elementWithCharRef;
   //       </one>`);
   //    pTokenStream.endText();

   //    gatherStream(
   //       entityExpander,
   //       (results) => {
   //          const index = getIndex(results, GENERAL_ENTITY_START_PTOKEN);

   //          expect(results[index + 1].type).toEqual(ELEMENT_START_PTOKEN);
   //          expect((results[index + 1] as any).name.str).toEqual('two');
   //       },
   //       done,
   //    );
   // });

   // it('replaces references to internal parameter entities with actual values', (done) => {
   //    pTokenStream.addText(`<?xml version="1.0"?>
   //       <!DOCTYPE one [
   //          <!ENTITY % internalPE1 "foo">
   //          <!ENTITY % internalPE2 "(%internalPE1;)">
   //          <!ENTITY internalGE "[%internalPE2;]">
   //          <!ELEMENT one ANY>
   //       ]>
   //       <one>
   //          &internalGE;
   //       </one>`);
   //    pTokenStream.endText();

   //    gatherStream(
   //       entityExpander,
   //       (results) => {
   //          const index = getIndex(results, GENERAL_ENTITY_DECLARATION_PTOKEN);
   //          const expectedRef2 = new ParameterEntityReferencePToken({
   //             open: SToken.fromString('%'),
   //             openSpace: undefined,
   //             name: SToken.fromString('internalPE2'),
   //             nameSpace: undefined,
   //             close: SToken.fromString(';'),
   //          });
   //          const expectedRef1 = new ParameterEntityReferencePToken({
   //             open: SToken.fromString('%'),
   //             openSpace: undefined,
   //             name: SToken.fromString('internalPE1'),
   //             nameSpace: undefined,
   //             close: SToken.fromString(';'),
   //          });

   //          expect((results[index] as any).value).toEqualRangeless([
   //             new TextPToken({ text: SToken.fromString('[') }),
   //             new ParameterEntityStartPToken(expectedRef2),
   //             new TextPToken({ text: SToken.fromString('(') }),
   //             new ParameterEntityStartPToken(expectedRef1),
   //             new TextPToken({ text: SToken.fromString('foo') }),
   //             new ParameterEntityEndPToken(expectedRef1),
   //             new TextPToken({ text: SToken.fromString(')') }),
   //             new ParameterEntityEndPToken(expectedRef2),
   //             new TextPToken({ text: SToken.fromString(']') }),
   //          ]);
   //       },
   //       done,
   //    );
   // });

   // it('replaces references to external parameter entities in entity values', (done) => {
   //    pTokenStream.addText(`<?xml version="1.0"?>
   //       <!DOCTYPE one [
   //          <!ENTITY % externalPE SYSTEM "foo.xml">
   //          <!ENTITY internalGE "%externalPE;">
   //          <!ELEMENT one ANY>
   //       ]>
   //       <one>
   //          &internalGE;
   //       </one>`);
   //    pTokenStream.endText();

   //    gatherStream(
   //       entityExpander,
   //       (results) => {
   //          const index = getIndex(results, GENERAL_ENTITY_DECLARATION_PTOKEN);
   //          const expectedRef1 = new ParameterEntityReferencePToken({
   //             open: SToken.fromString('%'),
   //             openSpace: undefined,
   //             name: SToken.fromString('externalPE'),
   //             nameSpace: undefined,
   //             close: SToken.fromString(';'),
   //          });

   //          expect((results[index] as any).value).toEqualRangeless([
   //             new ParameterEntityStartPToken(expectedRef1),
   //             new TextPToken({ text: SToken.fromString('!placeholder!') }),
   //             new ParameterEntityEndPToken(expectedRef1),
   //          ]);
   //       },
   //       done,
   //    );
   // });

   // it('replaces references in ATTLIST defaults', (done) => {
   //    pTokenStream.addText(`<?xml version="1.0"?>
   //       <!DOCTYPE one [
   //          <!ENTITY % internalPE "foo">
   //          <!ENTITY internalGE "(%internalPE;)">
   //          <!ELEMENT one ANY>
   //          <!ATTLIST one anAttr CDATA "&#91;&internalGE;&#x5D;">
   //       ]>
   //       <one>
   //       </one>`);
   //    pTokenStream.endText();

   //    gatherStream(
   //       entityExpander,
   //       (results) => {
   //          const index = getIndex(results, 'ATTLISTDECL_PTOKEN_TYPE');
   //          const expectedRef1 = new ParameterEntityReferencePToken({
   //             open: SToken.fromString('%'),
   //             openSpace: undefined,
   //             name: SToken.fromString('internalPE'),
   //             nameSpace: undefined,
   //             close: SToken.fromString(';'),
   //          });
   //          const expectedRef2 = new GeneralEntityReferencePToken({
   //             open: SToken.fromString('&'),
   //             openSpace: undefined,
   //             name: SToken.fromString('internalGE'),
   //             nameSpace: undefined,
   //             close: SToken.fromString(';'),
   //          });
   //          const expected = new AttListPToken({
   //             open: SToken.fromString('<!'),
   //             openSpace: undefined,
   //             declType: SToken.fromString('ATTLIST'),
   //             declTypeSpace: SToken.fromString(' '),
   //             elementName: SToken.fromString('one'),
   //             postElementNameSpace: SToken.fromString(' '),
   //             attDefs: [
   //                {
   //                   name: SToken.fromString('anAttr'),
   //                   postNameSpace: SToken.fromString(' '),
   //                   type: SToken.fromString('CDATA'),
   //                   postTypeSpace: SToken.fromString(' '),
   //                   openQuote: SToken.fromString('"'),
   //                   closeQuote: SToken.fromString('"'),
   //                   value: [
   //                      new CharRefPToken({
   //                         open: SToken.fromString('&#'),
   //                         openSpace: undefined,
   //                         hexMarkerSpace: undefined,
   //                         digits: SToken.fromString('91'),
   //                         digitsSpace: undefined,
   //                         close: SToken.fromString(';'),
   //                         charCode: 91,
   //                      }),
   //                      new GeneralEntityStartPToken(expectedRef2),
   //                      new CharDataPToken({ text: SToken.fromString('(foo)') }),
   //                      // new TextPToken({ text: SToken.fromString('(') }),
   //                      // new ParameterEntityStartPToken(expectedRef1), // Maybe should not ahve these
   //                      // new TextPToken({ text: SToken.fromString('foo') }),
   //                      // new ParameterEntityEndPToken(expectedRef1),
   //                      // new TextPToken({ text: SToken.fromString(')') }),
   //                      new GeneralEntityEndPToken(expectedRef2),
   //                      new CharRefPToken({
   //                         open: SToken.fromString('&#'),
   //                         openSpace: undefined,
   //                         hexMarker: SToken.fromString('x'),
   //                         hexMarkerSpace: undefined,
   //                         digits: SToken.fromString('5D'),
   //                         digitsSpace: undefined,
   //                         close: SToken.fromString(';'),
   //                         charCode: 0x5d,
   //                      }),
   //                   ],
   //                },
   //             ] as any,
   //             close: SToken.fromString('>'),
   //          });

   //          expect(results[index] as any).toEqualRangeless(expected);
   //       },
   //       done,
   //    );
   // });

   // it('replaces references in element attributes', (done) => {
   //    pTokenStream.addText(`<?xml version="1.0"?>
   //       <!DOCTYPE one [
   //          <!ENTITY % internalPE "foo">
   //          <!ENTITY internalGE "(%internalPE;)">
   //          <!ELEMENT one EMPTY>
   //          <!ATTLIST one
   //             first CDATA #IMPLIED
   //             second CDATA #IMPLIED
   //          >
   //       ]>
   //       <one second="first &#45; &internalGE;" first="second &#45; &internalGE;"/>`);
   //    pTokenStream.endText();

   //    gatherStream(
   //       entityExpander,
   //       (results) => {
   //          const index = getIndex(results, ELEMENT_EMPTY_PTOKEN);
   //          const expectedRef1 = new ParameterEntityReferencePToken({
   //             open: SToken.fromString('%'),
   //             openSpace: undefined,
   //             name: SToken.fromString('internalPE'),
   //             nameSpace: undefined,
   //             close: SToken.fromString(';'),
   //          });
   //          const expectedRef2 = new GeneralEntityReferencePToken({
   //             open: SToken.fromString('&'),
   //             openSpace: undefined,
   //             name: SToken.fromString('internalGE'),
   //             nameSpace: undefined,
   //             close: SToken.fromString(';'),
   //          });
   //          const expected = new ElementEmptyPToken({
   //             open: SToken.fromString('<'),
   //             openSpace: undefined,
   //             name: SToken.fromString('one'),
   //             nameSpace: SToken.fromString(' '),
   //             attributes: [
   //                {
   //                   name: SToken.fromString('second'),
   //                   postNameSpace: undefined,
   //                   equal: SToken.fromString('='),
   //                   postEqualSpace: undefined,
   //                   openQuote: SToken.fromString('"'),
   //                   closeQuote: SToken.fromString('"'),
   //                   value: [
   //                      new TextPToken({ text: SToken.fromString('first ') }),
   //                      new CharRefPToken({
   //                         open: SToken.fromString('&#'),
   //                         openSpace: undefined,
   //                         hexMarkerSpace: undefined,
   //                         digits: SToken.fromString('45'),
   //                         digitsSpace: undefined,
   //                         close: SToken.fromString(';'),
   //                         charCode: 45,
   //                      }),
   //                      new TextPToken({ text: SToken.fromString(' ') }),
   //                      new GeneralEntityStartPToken(expectedRef2),
   //                      new CharDataPToken({ text: SToken.fromString('(foo)') }),
   //                      // new TextPToken({ text: SToken.fromString('(') }),
   //                      // new ParameterEntityStartPToken(expectedRef1),
   //                      // new TextPToken({ text: SToken.fromString('foo') }),
   //                      // new ParameterEntityEndPToken(expectedRef1),
   //                      // new TextPToken({ text: SToken.fromString(')') }),
   //                      new GeneralEntityEndPToken(expectedRef2),
   //                   ],
   //                   trailingSpace: SToken.fromString(' '),
   //                },
   //                {
   //                   name: SToken.fromString('first'),
   //                   postNameSpace: undefined,
   //                   equal: SToken.fromString('='),
   //                   postEqualSpace: undefined,
   //                   openQuote: SToken.fromString('"'),
   //                   closeQuote: SToken.fromString('"'),
   //                   value: [
   //                      new TextPToken({ text: SToken.fromString('second ') }),
   //                      new CharRefPToken({
   //                         open: SToken.fromString('&#'),
   //                         openSpace: undefined,
   //                         hexMarkerSpace: undefined,
   //                         digits: SToken.fromString('45'),
   //                         digitsSpace: undefined,
   //                         close: SToken.fromString(';'),
   //                         charCode: 45,
   //                      }),
   //                      new TextPToken({ text: SToken.fromString(' ') }),
   //                      new GeneralEntityStartPToken(expectedRef2),
   //                      new CharDataPToken({ text: SToken.fromString('(foo)') }),
   //                      // new TextPToken({ text: SToken.fromString('(') }),
   //                      // new ParameterEntityStartPToken(expectedRef1),
   //                      // new TextPToken({ text: SToken.fromString('foo') }),
   //                      // new ParameterEntityEndPToken(expectedRef1),
   //                      // new TextPToken({ text: SToken.fromString(')') }),
   //                      new GeneralEntityEndPToken(expectedRef2),
   //                   ],
   //                   trailingSpace: undefined,
   //                },
   //             ],
   //             close: SToken.fromString('/>'),
   //          });

   //          expect((results[index] as any).attributes[0]).toEqualRangeless(expected.attributes[0]);
   //       },
   //       done,
   //    );
   // });

   // it('aborts on a recursive entity reference', (done) => {
   //    pTokenStream.addText(`<?xml version="1.0"?>
   //       <!DOCTYPE one [
   //          <!ENTITY second "[&first;]">
   //          <!ENTITY first "(&second;)">
   //          <!ELEMENT one ANY>
   //       ]>
   //       <one>
   //          &first;
   //       </one>`);
   //    pTokenStream.endText();

   //    const expected = new WellFormedError(
   //       WellFormedError.ID.REFERENCE_INVALID_RECURSION,
   //       ['first'],
   //       new Offset(new EntityId(), 78, 2, 31),
   //       new Offset(new EntityId(), 77, 2, 30),
   //    );
   //    expectError(entityExpander, expected, done);
   // });
});
