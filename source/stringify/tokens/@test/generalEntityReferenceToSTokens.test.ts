/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { GeneralEntityReferencePToken } from "token";
import { toSToken } from "sToken";

import { generalEntityReferenceToSTokens} from '../generalEntityReferenceToSTokens';

describe('toSTokenArray()', () => {

   it('returns all the STokens', () => {
      const gePToken = new GeneralEntityReferencePToken({
         open: toSToken('&'),
         openSpace: toSToken(' '),
         name: toSToken('entityName'),
         nameSpace: toSToken(' '),
         close: toSToken(';'),
      });

      expect(generalEntityReferenceToSTokens(gePToken)).toEqual([
         gePToken.open!,
         gePToken.openSpace!,
         gePToken.name!,
         gePToken.nameSpace!,
         gePToken.close!,
      ]);
   });

});
