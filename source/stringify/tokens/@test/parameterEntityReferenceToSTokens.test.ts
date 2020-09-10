import { ParameterEntityReferencePToken } from 'token';
import { toSToken } from 'sToken';

import { parameterEntityReferenceToSTokens } from '../parameterEntityReferenceToSTokens';

describe('toSTokenArray()', () => {
   it('returns all the STokens', () => {
      const pePToken = new ParameterEntityReferencePToken({
         open: toSToken('%'),
         openSpace: toSToken(' '),
         name: toSToken('entityName'),
         nameSpace: toSToken(' '),
         close: toSToken(';'),
      });

      expect(parameterEntityReferenceToSTokens(pePToken)).toEqual([
         pePToken.open!,
         pePToken.openSpace!,
         pePToken.name!,
         pePToken.nameSpace!,
         pePToken.close!,
      ]);
   });
});
