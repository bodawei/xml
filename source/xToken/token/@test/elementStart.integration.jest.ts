/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */

import { STokenSource, toSToken } from 'basic';
import { ELEMENT_START_PTOKEN, parseElementStart } from 'token';

import { TextXToken } from '../textXToken';
import { ElementStartXToken } from '../elementStartXToken';

describe('ElementStartXToken (integration)', () => {
   let source: STokenSource;

   beforeEach(() => {
      source = new STokenSource();
   });

   it('generates a full token with attributes', (done) => {
      source.addText(' aName attr1="value1" attr2="value two">');
      source.endText();

      parseElementStart(source, toSToken('<'), (pToken) => {
         let token: ElementStartXToken | undefined = undefined;

         if (pToken?.type === ELEMENT_START_PTOKEN) {
            token = new ElementStartXToken(pToken);
            delete token.attributes[0].value[0].pToken;
            delete token.attributes[1].value[0].pToken;
            delete token.pToken;
         }

         expect(token).toEqual(
            new ElementStartXToken('aName', [
               {
                  name: 'attr1',
                  value: [new TextXToken('value1')],
               },
               {
                  name: 'attr2',
                  value: [new TextXToken('value two')],
               },
            ]),
         );
         done();
      });
   });
});
