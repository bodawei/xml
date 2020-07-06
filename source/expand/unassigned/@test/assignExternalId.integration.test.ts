/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { EntityMetaData } from 'basic';
import { defaultExtractors } from 'extractor';
import { STokenSource, toSToken, SToken } from 'sToken';
import {
   TextPToken,
   UnassignedType,
   ParameterEntityEndPToken,
   ParameterEntityReferencePToken,
   wordFromSToken,
   ParameterEntityStartPToken,
   parseExternalId,
} from 'token';
import { makeInsertedRange } from 'token-test';

import { assignExternalId } from '../assignExternalId';

describe('assignExternalId() (integration)', () => {
   let emd: EntityMetaData;
   let source: STokenSource;

   beforeEach(() => {
      emd = new EntityMetaData();
      source = new STokenSource(defaultExtractors, emd);
   });
   it('assigns the public and system value (check unassigned.assignToProps())', (done) => {
      source.addText('PUBLIC\t%publicVal;\t"sys.xml">');
      source.endText();

      parseExternalId(source, [], true, (result) => {
         // expand/replace the publicVal reference
         result.peRefPlus.shift();
         result.peRefPlus.unshift({
            type: UnassignedType.ENTITY_END,
            token: new ParameterEntityEndPToken(
               new ParameterEntityReferencePToken({ open: toSToken('%') }),
            ) as any,
         });
         result.peRefPlus.unshift({
            type: UnassignedType.LITERAL,
            token: {
               openQuote: toSToken('"'),
               value: [new TextPToken({ text: toSToken('pub.xml') })],
               closeQuote: toSToken('"'),
            },
         });
         result.peRefPlus.unshift({
            type: UnassignedType.ENTITY_START,
            token: new ParameterEntityStartPToken(
               new ParameterEntityReferencePToken({ open: toSToken('%') }),
            ) as any,
         });

         const assignResult = assignExternalId(
            result.peRefPlus,
            result.nextPropName,
            result.externalId,
         );

         expect(assignResult).toEqualRangeless({
            externalId: {
               type: 'EXTERNAL_ID',
               externalType: toSToken('PUBLIC'),
               externalTypeSpace: toSToken('\t '),
               public: {
                  openQuote: toSToken('"'),
                  value: [new TextPToken({ text: toSToken('pub.xml') })],
                  closeQuote: toSToken('"'),
               },
               publicSpace: toSToken(' \t'),
               system: {
                  openQuote: toSToken('"'),
                  value: [new TextPToken({ text: toSToken('sys.xml') })],
                  closeQuote: toSToken('"'),
               },
            },
         });
         done();
      });
   });

   it('adds a space to an otherwise missing previous prop name (check unsasigned calls)', (done) => {
      const expectedString = new SToken(' ', ' ', [makeInsertedRange()]);
      source.addText('%foo;>');
      source.endText();

      parseExternalId(source, [], true, (result) => {
         // expand/replace the publicVal reference
         result.peRefPlus.shift();

         result.peRefPlus.unshift(wordFromSToken(toSToken('public')), {
            type: UnassignedType.ENTITY_END,
            token: new ParameterEntityEndPToken(
               new ParameterEntityReferencePToken({ open: toSToken('%') }),
            ) as any,
         });
         result.peRefPlus.unshift();
         result.peRefPlus.unshift({
            type: UnassignedType.ENTITY_START,
            token: new ParameterEntityStartPToken(
               new ParameterEntityReferencePToken({ open: toSToken('%') }),
            ) as any,
         });

         const assignResult = assignExternalId(result.peRefPlus, undefined, result.externalId!);
         expect(assignResult.preSpace).toEqual(expectedString);
         done();
      });
   });
});
