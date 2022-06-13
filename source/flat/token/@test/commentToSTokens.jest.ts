/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { toSToken } from 'basic';
import { CommentPToken } from 'token';

import { commentToSTokens } from '../commentToSTokens';

describe('commentToSTokens() (unit)', () => {
   it('returns all the STokens', () => {
      const commentPToken = new CommentPToken({
         open: toSToken('<!--'),
         text: [toSToken('commentText')],
         close: toSToken('-->'),
      });

      const result = commentToSTokens(commentPToken);

      expect(result).toEqual([commentPToken.open, commentPToken.text[0], commentPToken.close!]);
   });
});
