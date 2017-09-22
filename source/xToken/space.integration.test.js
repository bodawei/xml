/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation, EntityMetaData, Range } from '../basic';
import { defaultExtractors, LToken, LTokenSource } from '../lToken';

import * as space from './space.js';

describe('space (integration)', () => {

   describe('parse()', () => {

      it('does a simple parse', (done) => {
         const parsed = {
            type: 'SPACE',
            text: new LToken(' \t\n\n', ' \t\n\r\n', new Range(new EntityLocation(), 0, 0, 0, 5, 2, 0)),
         };
         const source = new LTokenSource(defaultExtractors, new EntityMetaData());
         source.addText(' \t\n\r\n');
         source.endText();

         space.parse(source, (result) => {
            expect(result).toContainParsedProps(parsed);
            done();
         });
      });

   });

});
