/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { defaultExtractors } from 'extractor';
import { STokenSource, toSToken } from 'sToken';
import { ParameterEntityReferencePToken, TextPToken } from 'token';

import { DeclarationStart } from '../../../token/bridge/declaration';

import {
   NotationDeclarationPToken,
   parseNotationDeclaration,
   resumeParseNotationDeclaration,
   NOTATION_DECLARATION_PTOKEN,
} from '../notationDeclaration';

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

   describe('parseNotationDeclaration()', () => {
      it('produces an externalID when called', (done) => {
         const source = new STokenSource(defaultExtractors);
         source.addText('foo SYSTEM "sys.dtd">');
         source.endText();

         parseNotationDeclaration(source, declarationStart, (parsing) => {
            expect(parsing.externalId?.externalType?.str).toEqual('SYSTEM');
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

      it('copes with a PERef in the externalId (check unsasigned calls)', (done) => {
         const source = new STokenSource(defaultExtractors);
         source.addText('notationName %foo;>');
         source.endText();

         parseNotationDeclaration(source, { open: toSToken('<!') }, (result) => {
            expect(result).toEqualRangeless(
               new NotationDeclarationPToken({
                  type: NOTATION_DECLARATION_PTOKEN,
                  open: toSToken('<!'),
                  name: toSToken('notationName'),
                  nameSpace: toSToken(' '),
                  externalId: undefined,
                  unexpanded: {
                     propName: 'externalType',
                     tokens: [
                        new ParameterEntityReferencePToken({
                           open: toSToken('%'),
                           name: toSToken('foo'),
                           close: toSToken(';'),
                        }),
                     ],
                  },
                  close: toSToken('>'),
               }),
            );
            done();
         });
      });
   });

   describe('resumeParseNotationDeclaration()', () => {
      it('populates a partiall build nottion declaratoin', (done) => {
         const nd = new NotationDeclarationPToken({
            open: toSToken('<!'),
            name: toSToken('aName'),
            nameSpace: toSToken(' '),
            externalId: undefined,
            externalIdSpace: toSToken('\t\t'),
            unexpanded: {
               tokens: [],
               propName: 'name',
            },
            close: toSToken('>'),
         });

         const source = new STokenSource(defaultExtractors);
         source.addText('foo   PUBLIC "blah - " "sys.dtd"\tjunk');
         source.endText();

         resumeParseNotationDeclaration(source, nd, (parsed) => {
            expect(parsed).toEqualRangeless(
               new NotationDeclarationPToken({
                  open: toSToken('<!'),
                  name: toSToken('foo'),
                  nameSpace: toSToken('   '),
                  externalId: {
                     externalType: toSToken('PUBLIC'),
                     externalTypeSpace: toSToken(' '),
                     public: {
                        value: [new TextPToken({ text: toSToken('blah - ') })],
                        openQuote: toSToken('"'),
                        closeQuote: toSToken('"'),
                     },
                     publicSpace: toSToken(' '),
                     system: {
                        value: [new TextPToken({ text: toSToken('sys.dtd') })],
                        openQuote: toSToken('"'),
                        closeQuote: toSToken('"'),
                     },
                  },
                  externalIdSpace: toSToken('\t'),
                  unexpanded: {
                     tokens: [],
                     propName: 'name',
                  },
                  extra: toSToken('junk'),
                  close: toSToken('>'),
               }),
            );
            done();
         });
      });
   });
});
