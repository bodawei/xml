/* Copyright ® 2018 by David John Burrowes. All rights reserved. */
/* eslint-env jasmine */

import { PTokenStream } from "pTokenStream";
import { EntityMetaData } from "basic";
import { EntityExpanderStream } from "../EntityExpanderStream";
import { gatherStream } from "./utils";
import {
   GENERAL_ENTITY_START_PTOKEN,
   GENERAL_ENTITY_END_PTOKEN,
   PARAMETER_ENTITY_START_PTOKEN,
   PARAMETER_ENTITY_END_PTOKEN,
   GENERAL_ENTITY_DECLARATION_PTOKEN,
   PToken,
   text,
   ParameterEntityStartPToken,
   ParameterEntityReferencePToken,
   ParameterEntityEndPToken,
   GeneralEntityReferencePToken,
   GeneralEntityStartPToken,
   GeneralEntityEndPToken,
} from "token";
import { SToken } from "sToken";
import { AttListPToken } from "source/token/attListDeclaration";
import { CharRefPToken } from "source/token/charRef";

describe('EntityExpanderStream (integration)', () => {
   let pTokenStream: PTokenStream;
   let entityExpander: EntityExpanderStream;

   beforeEach(() => {
      pTokenStream = new PTokenStream(new EntityMetaData());
      entityExpander = new EntityExpanderStream(true);

      pTokenStream.pipe(entityExpander);
   });

   function getIndex(tokens: Array<PToken>, type: string): number {
      let found = -1;

      for (let index = 0; index < tokens.length; index ++) {
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

      gatherStream(entityExpander, (results) => {
         const index = getIndex(results, GENERAL_ENTITY_START_PTOKEN);

         expect(results[index + 1].type).toEqual('CHARDATA');
         expect(results[index + 2].type).toEqual(GENERAL_ENTITY_END_PTOKEN);
      }, done);
   });

   it('replaces a parameter entity reference with an entity start and end token', (done) => {
      pTokenStream.addText(`<?xml version="1.0"?>
         <!DOCTYPE one [
            <!ENTITY % anEntity "the value">
            <!ELEMENT one ANY>
            %anEntity;
         ]>
         <one></one>`);
      pTokenStream.endText();

      gatherStream(entityExpander, (results) => {
         const index = getIndex(results, PARAMETER_ENTITY_START_PTOKEN);

         expect(results[index + 1].type).toEqual('CHARDATA');
         expect(results[index + 2].type).toEqual(PARAMETER_ENTITY_END_PTOKEN);
      }, done);
   });

   it('replaces a multiply nested entity', (done) => {
      pTokenStream.addText(`<?xml version="1.0"?>
         <!DOCTYPE one [
            <!ENTITY seven "≤done≥">
            <!ENTITY six "{&seven;}">
            <!ENTITY five "[&six;]">
            <!ENTITY four " (&five;) ">
            <!ENTITY three "{&four;}">
            <!ENTITY two "[&three;]">
            <!ENTITY base "(&two;)">
            <!ELEMENT one ANY>
         ]>
         <one>
            &base;
         </one>`);
      pTokenStream.endText();

      gatherStream(entityExpander, (results) => {
         const index = getIndex(results, GENERAL_ENTITY_START_PTOKEN);

         expect(results[index + 2].type).toEqual(GENERAL_ENTITY_START_PTOKEN);
         expect(results[index + 27].type).toEqual(GENERAL_ENTITY_END_PTOKEN);
      }, done);
   });

   it('pre-parses internal entity values for character references, and treats them as content', (done) => {
      pTokenStream.addText(`<?xml version="1.0"?>
         <!DOCTYPE one [
            <!ENTITY elementWithCharRef "&#x3c;two></two>">
            <!ELEMENT one ANY>
            <!ELEMENT two ANY>
         ]>
         <one>
            &elementWithCharRef;
         </one>`);
      pTokenStream.endText();

      gatherStream(entityExpander, (results) => {
         const index = getIndex(results, GENERAL_ENTITY_START_PTOKEN);

         expect(results[index + 1].type).toEqual('ELEMENT_START');
         expect((results[index + 1] as any).name.str).toEqual('two');
      }, done);
   });

   it('replaces references to internal parameter entities with actual values', (done) => {
      pTokenStream.addText(`<?xml version="1.0"?>
         <!DOCTYPE one [
            <!ENTITY % internalPE1 "foo">
            <!ENTITY % internalPE2 "(%internalPE1;)">
            <!ENTITY internalGE "[%internalPE2;]">
            <!ELEMENT one ANY>
         ]>
         <one>
            &internalGE;
         </one>`);
      pTokenStream.endText();

      gatherStream(entityExpander, (results) => {
         const index = getIndex(results, GENERAL_ENTITY_DECLARATION_PTOKEN);
         const expectedRef2 = new ParameterEntityReferencePToken({
            open: SToken.fromString('%'),
            openSpace: undefined,
            name: SToken.fromString('internalPE2'),
            nameSpace: undefined,
            close: SToken.fromString(';'),
         });
         const expectedRef1 = new ParameterEntityReferencePToken({
            open: SToken.fromString('%'),
            openSpace: undefined,
            name: SToken.fromString('internalPE1'),
            nameSpace: undefined,
            close: SToken.fromString(';'),
         });

         expect((results[index] as any).value).toEqualRangeless([
            new text.PToken({ text: SToken.fromString('[') }),
            new ParameterEntityStartPToken(expectedRef2),
            new text.PToken({ text: SToken.fromString('(') }),
            new ParameterEntityStartPToken(expectedRef1),
            new text.PToken({ text: SToken.fromString('foo') }),
            new ParameterEntityEndPToken(expectedRef1),
            new text.PToken({ text: SToken.fromString(')') }),
            new ParameterEntityEndPToken(expectedRef2),
            new text.PToken({ text: SToken.fromString(']') }),
         ]);
      }, done);
   });

   it('replaces references in ATTLIST defaults', (done) => {
      pTokenStream.addText(`<?xml version="1.0"?>
         <!DOCTYPE one [
            <!ENTITY % internalPE "foo">
            <!ENTITY internalGE "(%internalPE;)">
            <!ELEMENT one ANY>
            <!ATTLIST one anAttr CDATA "&#91;&internalGE;&#x5D;">
         ]>
         <one>
         </one>`);
      pTokenStream.endText();

      gatherStream(entityExpander, (results) => {
         const index = getIndex(results, 'ATTLISTDECL_PTOKEN_TYPE');
         const expectedRef1 = new ParameterEntityReferencePToken({
            open: SToken.fromString('%'),
            openSpace: undefined,
            name: SToken.fromString('internalPE'),
            nameSpace: undefined,
            close: SToken.fromString(';'),
         });
         const expectedRef2 = new GeneralEntityReferencePToken({
            open: SToken.fromString('&'),
            openSpace: undefined,
            name: SToken.fromString('internalGE'),
            nameSpace: undefined,
            close: SToken.fromString(';'),
         });
         const expected = new AttListPToken({
            open: SToken.fromString('<!'),
            postOpenSpace: undefined,
            declType: SToken.fromString('ATTLIST'),
            postDeclTypeSpace: SToken.fromString(' '),
            elementName: SToken.fromString('one'),
            postElementNameSpace: SToken.fromString(' '),
            attDefs: [{
               name: SToken.fromString('anAttr'),
               postNameSpace: SToken.fromString(' '),
               type: SToken.fromString('CDATA'),
               postTypeSpace: SToken.fromString(' '),
               openQuote: SToken.fromString('"'),
               closeQuote: SToken.fromString('"'),
               value: [
                  new CharRefPToken({
                     open: SToken.fromString('&#'),
                     postOpenSpace: undefined,
                     postHexMarkerSpace: undefined,
                     digits: SToken.fromString('91'),
                     postDigitsSpace: undefined,
                     close: SToken.fromString(';'),
                  }),
                  new GeneralEntityStartPToken(expectedRef2),
                  new text.PToken({ text: SToken.fromString('(') }),
                  new ParameterEntityStartPToken(expectedRef1),
                  new text.PToken({ text: SToken.fromString('foo') }),
                  new ParameterEntityEndPToken(expectedRef1),
                  new text.PToken({ text: SToken.fromString(')') }),
                  new GeneralEntityEndPToken(expectedRef2),
                  new CharRefPToken({
                     open: SToken.fromString('&#'),
                     postOpenSpace: undefined,
                     hexMarker: SToken.fromString('x'),
                     postHexMarkerSpace: undefined,
                     digits: SToken.fromString('5D'),
                     postDigitsSpace: undefined,
                     close: SToken.fromString(';'),
                  }),
               ],
            }],
            close: SToken.fromString('>'),
         });

         expect((results[index] as any)).toEqualRangeless(expected);
      }, done);
   });

});
