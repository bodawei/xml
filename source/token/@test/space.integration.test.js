/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation, EntityMetaData, Range } from '../../basic';
import { defaultExtractors } from '../../extractor';
import { SToken, STokenSource } from '../../sToken';

import * as space from '../space.js';

describe('space (integration)', () => {

   describe('parse()', () => {

      it('does a simple parse', (done) => {
         const pToken = {
            type: 'SPACE',
            text: new SToken(' \t\n\n', ' \t\n\r\n', new Range(new EntityLocation(), 0, 0, 0, 5, 2, 0)),
         };
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText(' \t\n\r\n');
         source.endText();

         space.parse(source, (result) => {
            expect(result).toContainPTokenProps(pToken);
            done();
         });
      });

   });

});
