/* Copyright ® 2017-2026 by 柏大衛. All rights reserved. */

import { STokenSource, toSToken } from 'basic';
import { makeSTokenMaker } from 'pToken-test';

import { ElementEndPToken, parseElementEnd } from '../elementEnd';

describe('elementEnd (integration)', () => {
   let elementEndPToken: ElementEndPToken;

   beforeEach(() => {
      const makeSToken = makeSTokenMaker();
      elementEndPToken = new ElementEndPToken({
         open: toSToken('<'),
         openSpace: undefined,
         name: makeSToken('elemName'),
         nameSpace: makeSToken(' '),
         close: makeSToken('>'),
      });
      (elementEndPToken as any).open = makeSToken('</');
   });

   describe('parse()', () => {
      it('parses the end of the element when called', (done) => {
         const source = new STokenSource();
         source.addText('elemName >');
         source.endText();

         parseElementEnd(source, elementEndPToken.open, (parsing) => {
            expect(parsing).toEqual(new ElementEndPToken(elementEndPToken));
            done();
         });
      });
   });
});
