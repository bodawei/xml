/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { EntityId, ConformanceVersion } from 'basic';
import { toSToken } from 'sToken';
import {
   CharRefPToken,
   ParameterEntityReferencePToken,
   ParameterEntityStartPToken,
   ParameterEntityEndPToken,
   TextPToken,
} from 'token';

import { entityValueToSTokenSource } from '../entityValueToSTokenSource';

describe('entityValueToSTokenSource() (unit)', () => {
   it('returns an empty STokenSource when given an empty EntityValuePToken', (done) => {
      const result = entityValueToSTokenSource([], new EntityId());

      result.extractNoParams('all', (stoken) => {
         expect(stoken).toBeUndefined();
         done();
      });
   });

   it('returns the text contents of a text token', (done) => {
      const result = entityValueToSTokenSource(
         [new TextPToken({ text: toSToken('wowzers') })],
         new EntityId(),
      );

      result.extractNoParams('all', (stoken) => {
         expect(stoken!.str).toEqual('wowzers');
         done();
      });
   });

   it('returns only the text portions of all the values in the EntityValuePToken', (done) => {
      const otherPERef = new ParameterEntityReferencePToken({
         open: toSToken('&'),
         name: toSToken('two'),
         close: toSToken(';'),
         nameSpace: undefined,
         openSpace: undefined,
      });
      const result = entityValueToSTokenSource(
         [
            new CharRefPToken({ open: toSToken('&#'), digits: toSToken('65'), charCode: 65 }),
            new TextPToken({ text: toSToken('one') }),
            new ParameterEntityReferencePToken({
               open: toSToken('&'),
               name: toSToken('two'),
               close: toSToken(';'),
               nameSpace: undefined,
               openSpace: undefined,
            }),
            new ParameterEntityStartPToken(otherPERef),
            new TextPToken({ text: toSToken('three') }),
            new ParameterEntityEndPToken(otherPERef),
         ],
         new EntityId(),
      );

      result.extractNoParams('all', (stoken) => {
         expect(stoken!.str).toEqual('Aonethree');
         done();
      });
   });
});
