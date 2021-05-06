/* Copyright ® 2018-2021 by 柏大衛. All rights reserved. */

import { GeneralEntityReferencePToken, TextPToken } from 'pToken';
import { STokenSource } from 'sToken';
import { makeSTokenMaker } from 'sToken-test';
import { literalValue } from 'token';
import { GeneralEntityReferenceXToken, TextXToken } from 'xToken';

import { makeLiteralValueX } from '../makeLiteralValueX';

describe('literalValue (integration)', () => {
   let source: STokenSource;

   beforeEach(() => {
      source = new STokenSource();
   });

   it('converts intput PToken into a set of XTokens', (done) => {
      source.addText('one&ref;two"');
      source.endText();
      literalValue.parse(source, ['"', '&'], (pToken) => {
         const results = makeLiteralValueX(pToken);
         const makeSToken = makeSTokenMaker();
         const pToken1 = new TextPToken({ text: makeSToken('one') });
         const pTokenRef = new GeneralEntityReferencePToken({
            open: makeSToken('&'),
            openSpace: undefined,
            name: makeSToken('ref'),
            nameSpace: undefined,
            close: makeSToken(';'),
         });
         const pToken2 = new TextPToken({ text: makeSToken('two') });

         expect(results).toEqual([
            new TextXToken(pToken1),
            new GeneralEntityReferenceXToken(pTokenRef),
            new TextXToken(pToken2),
         ]);
         done();
      });
   });
});
