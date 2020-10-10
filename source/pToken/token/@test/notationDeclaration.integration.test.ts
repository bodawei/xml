/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { defaultExtractors } from 'extractor';
import { STokenSource, toSToken } from 'sToken';
import { ParameterEntityReferencePToken } from 'token';

import { DeclarationStart } from '../../../token/bridge/declaration';
import { EXTERNAL_ID } from '../../../token/common/externalId';
import { UnassignedType, UnassignedArray } from '../../../token/common/unassigned';

import { NotationDeclarationPToken, parseNotationDeclaration } from '../notationDeclaration';

describe('notationDeclaration (integration)', () => {
   let declarationStart: DeclarationStart;

   beforeEach(() => {
      declarationStart = {
         open: toSToken('<!'),
         openSpace: undefined,
         declType: toSToken('NOTATION'),
         declTypeSpace: toSToken(' '),
      };
   });

   describe('parse()', () => {
      it('produces an externalID when called', (done) => {
         const source = new STokenSource(defaultExtractors);
         source.addText('foo SYSTEM "sys.dtd">');
         source.endText();

         parseNotationDeclaration(source, declarationStart, (parsing) => {
            expect(parsing.externalId?.type).toEqual(EXTERNAL_ID);
            done();
         });
      });

      it('parses a PERef (check unexpanded calls)', (done) => {
         const source = new STokenSource(defaultExtractors);
         source.addText('%foo;>');
         source.endText();

         parseNotationDeclaration(source, { open: toSToken('<!') }, (result) => {
            expect(result).toEqualRangeless(
               new NotationDeclarationPToken({
                  open: toSToken('<!'),
                  unexpanded: {
                     tokens: [
                        new ParameterEntityReferencePToken({
                           open: toSToken('%'),
                           openSpace: undefined,
                           name: toSToken('foo'),
                           nameSpace: undefined,
                           close: toSToken(';'),
                        }),
                     ],
                     propName: 'name',
                  },
                  close: toSToken('>'),
               }),
            );
            done();
         });
      });

      xit('copes with a PERef in the externalId (check unsasigned calls)', (done) => {
         const source = new STokenSource(defaultExtractors);
         source.addText('notationName %foo;>');
         source.endText();
         const unassignedValue: UnassignedArray = [
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
         ];

         parseNotationDeclaration(source, { open: toSToken('<!') }, (result) => {
            expect(result).toEqualRangeless(
               new NotationDeclarationPToken({
                  type: 'NOTATION_DECLARATION_PTOKEN2',
                  open: toSToken('<!'),
                  name: toSToken('notationName'),
                  nameSpace: toSToken(' '),
                  externalId: {
                     type: 'EXTERNAL_ID',
                     externalType: undefined,
                     externalTypeSpace: undefined,
                     public: undefined,
                     publicSpace: undefined,
                     system: undefined,
                  },
                  close: toSToken('>'),
               }),
            );
            done();
         });
      });
   });
});
