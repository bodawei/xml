/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { defaultExtractors } from 'extractor';
import { toSToken, STokenSource, SToken } from 'sToken';
import {
   GeneralEntityDeclarationPToken,
   ParameterEntityStartPToken,
   ParameterEntityReferencePToken,
   ParameterEntityEndPToken,
   UnassignedType,
   parseEntityDeclaration,
   spaceFromSToken,
   wordFromSToken,
} from 'token';
import { makeInsertedRange } from 'token-test';

import { assignEntityDeclaration } from '../assignEntityDeclaration';

describe('assignEntityDeclaration() (integration)', () => {
   it('fills in the missing properties, including the preceeding declaration space', (done) => {
      const source = new STokenSource(defaultExtractors);
      source.addText('%foo;>');
      source.endText();

      parseEntityDeclaration(source, {} as any, (pToken) => {
         // "expand" what should be there.
         const unassignedValue = [
            {
               type: UnassignedType.ENTITY_START,
               token: new ParameterEntityStartPToken(
                  new ParameterEntityReferencePToken({ open: toSToken('%') }),
               ),
            },
            wordFromSToken(toSToken('entityName')),
            spaceFromSToken(toSToken(' ')),
            {
               type: UnassignedType.LITERAL,
               token: {
                  openQuote: toSToken('"'),
                  value: [toSToken('foo')],
                  closeQuote: toSToken('"'),
               },
            },
            {
               type: UnassignedType.ENTITY_END,
               token: new ParameterEntityEndPToken(
                  new ParameterEntityReferencePToken({ open: toSToken('%') }),
               ),
            },
         ] as any;

         assignEntityDeclaration(unassignedValue, pToken);

         expect(pToken).toEqualRangeless(
            new GeneralEntityDeclarationPToken({
               declTypeSpace: new SToken(' ', ' ', [makeInsertedRange()]),
               name: toSToken('entityName'),
               nameSpace: toSToken(' '),
               openQuote: toSToken('"'),
               value: [toSToken('foo')],
               closeQuote: toSToken('"'),
               entityValueSpace: new SToken(' ', ' ', [makeInsertedRange()]),
               close: toSToken('>'),
               peRefPlus: [
                  {
                     type: UnassignedType.REFERENCE,
                     token: new ParameterEntityReferencePToken({
                        open: toSToken('%'),
                        openSpace: undefined,
                        name: toSToken('foo'),
                        nameSpace: undefined,
                        close: toSToken(';'),
                     }),
                  },
               ],
            }),
         );
         done();
      });
   });
});
