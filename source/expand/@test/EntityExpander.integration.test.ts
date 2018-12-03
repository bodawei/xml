/* Copyright ® 2018 by David John Burrowes. All rights reserved. */
/* eslint-env jasmine */

import { PTokenStream } from "pTokenStream";
import { EntityMetaData } from "basic";
import { EntityExpander } from "../EntityExpander";
import { gatherStream } from "./utils";
import { GENERAL_ENTITY_START_PTOKEN, GENERAL_ENTITY_END_PTOKEN, PToken, PARAMETER_ENTITY_START_PTOKEN, PARAMETER_ENTITY_END_PTOKEN } from "token";

describe('EntityExpander (integration)', () => {
   let pTokenStream: PTokenStream;
   let entityExpander: EntityExpander;

   beforeEach(() => {
      pTokenStream = new PTokenStream(new EntityMetaData());
      entityExpander = new EntityExpander(true);

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

});
