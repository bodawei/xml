/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { toSToken } from 'sToken';
import { CommentPToken } from 'token';

import { COMMENT_XTOKEN, CommentXToken } from '../commentXToken';

describe('comment (unit)', () => {
   let commentPToken: CommentPToken;

   beforeEach(() => {
      commentPToken = new CommentPToken({
         open: toSToken('<!--'),
         text: [toSToken('commentText')],
         close: toSToken('-->'),
      });
   });

   it('returns comment with the text of the comment', () => {
      const token = new CommentXToken(commentPToken);

      expect(token.text).toEqual('commentText');
   });

   it('returns the text as an empty string when no text values present', () => {
      commentPToken = new CommentPToken({
         open: toSToken('<!--'),
         text: [],
         close: toSToken('-->'),
      });

      const token = new CommentXToken(commentPToken);

      expect(token.text).toEqual('');
   });

   it('returns a comment token with all the expected values', () => {
      const token = new CommentXToken(commentPToken);

      expect(token).toEqual({
         type: COMMENT_XTOKEN,
         text: 'commentText',
         pToken: commentPToken,
      });
   });

   it('returns a comment token from a PToken with all STokens', () => {
      const pToken = new CommentPToken({
         open: toSToken('<!--'),
         text: [toSToken('part1'), toSToken('--')],
         close: toSToken('-->'),
      });
      const token = new CommentXToken(pToken);

      expect(token).toEqual({
         type: COMMENT_XTOKEN,
         text: 'part1--',
         pToken: pToken,
      });
   });
});
