/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { defaultExtractors } from 'extractor';
import { STokenSource, SToken } from 'sToken';
import { makeSTokenMaker } from 'sToken-test';

import { ElementEndPToken, parseElementEnd } from '../elementEnd';

describe('elementEnd (integration)', () => {
   let elementEndPToken: ElementEndPToken;

   beforeEach(() => {
      const makeSToken = makeSTokenMaker();
      elementEndPToken = new ElementEndPToken({
         open: SToken.fromString('<'),
         openSpace: undefined,
         name: makeSToken('elemName'),
         nameSpace: makeSToken(' '),
         close: makeSToken('>'),
      });
      (elementEndPToken as any).open = makeSToken('</');
   });

   describe('parse()', () => {

      it('parses the end of the element when called', (done) => {
         const source = new STokenSource(defaultExtractors);
         source.addText('elemName >');
         source.endText();

         parseElementEnd(source, elementEndPToken.open, (parsing) => {
            expect(parsing).toEqual(new ElementEndPToken(elementEndPToken));
            done();
         });
      });

   });

});
