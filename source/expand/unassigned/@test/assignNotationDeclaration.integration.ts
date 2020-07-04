import { EntityMetaData } from 'basic';
import { defaultExtractors } from 'extractor';
import { STokenSource, toSToken, SToken } from 'sToken';
import {
   EXTERNAL_ID,
   UnassignedType,
   NotationDeclarationPToken,
   parseNotationDeclaration,
   spaceFromSToken,
   wordFromSToken,
   ParameterEntityEndPToken,
   ParameterEntityReferencePToken,
   UnassignedArray,
   ParameterEntityStartPToken,
   TextPToken,
} from 'token';

import { assignNotationDeclaration } from '../assignNotationDeclaration';

// REFACTOR/CLEANUP bad import
import helper from '../../../token/@test/helper';

describe('assignUnassigned() (integration)', () => {
   it('fills in the missing properties, including the preceeding declaration space', (done) => {
      const source = new STokenSource(defaultExtractors, new EntityMetaData());
      source.addText('%foo;>');
      source.endText();

      parseNotationDeclaration(source, { open: toSToken('<!') }, (pToken) => {
         const peRefPlus: UnassignedArray = [
            {
               type: UnassignedType.ENTITY_START,
               token: new ParameterEntityStartPToken(
                  new ParameterEntityReferencePToken({ open: toSToken('%') }),
               ),
            },
            wordFromSToken(toSToken('notationName')),
            spaceFromSToken(toSToken(' ')),
            wordFromSToken(toSToken('PUBLIC')),
            {
               type: UnassignedType.LITERAL,
               token: {
                  openQuote: toSToken('"'),
                  value: [new TextPToken({ text: toSToken('foo') })],
                  closeQuote: toSToken('"'),
               },
            },
            {
               type: UnassignedType.ENTITY_END,
               token: new ParameterEntityEndPToken(
                  new ParameterEntityReferencePToken({ open: toSToken('%') }),
               ),
            },
            // REFACTOR/cleanup unassigned doesn't know allow expanded perefs.. wtf.
         ] as any;
         assignNotationDeclaration(peRefPlus.slice(0), pToken);

         expect(pToken).toEqualRangeless(
            new NotationDeclarationPToken({
               type: 'NOTATION_DECLARATION_PTOKEN',
               open: toSToken('<!'),
               declTypeSpace: new SToken(' ', ' ', [helper.makeInsertedRange()]),
               name: toSToken('notationName'),
               nameSpace: toSToken(' '),
               peRefPlus,
               extra: [],
               externalId: {
                  type: EXTERNAL_ID,
                  externalType: toSToken('PUBLIC'),
                  externalTypeSpace: undefined,
                  public: {
                     openQuote: toSToken('"'),
                     value: [new TextPToken({ text: toSToken('foo') })],
                     closeQuote: toSToken('"'),
                  },
                  publicSpace: new SToken(' ', ' ', [helper.makeInsertedRange()]),
                  system: undefined,
               },
               close: toSToken('>'),
            }),
         );
         done();
      });
   });
});
