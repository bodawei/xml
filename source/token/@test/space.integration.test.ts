/* Copyright ® 2017-2019 by 柏大衛. All rights reserved. */

import { EntityId, Range } from 'basic';
import { SToken, STokenSource } from 'basic';

import { parseSpace } from '../space';

describe('space (integration)', () => {

   describe('parse()', () => {

      it('does a simple parse', (done) => {
         const pToken = {
            type: 'SPACE_PTOKEN',
            text: new SToken(' \t\n\n', ' \t\n\r\n', new Range(new EntityId(), 0, 0, 0, 5, 2, 0)),
         };
         const source = new STokenSource();
         source.addText(' \t\n\r\n');
         source.endText();

         parseSpace(source, (result) => {
            expect(result).toContainPTokenProps(pToken);
            done();
         });
      });

   });

});
