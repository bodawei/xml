/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { ConformanceVersion, EntityId, Offset, Range } from 'basic';
import { ParamCollector } from 'basic-test';
import { toSToken, SToken } from 'basic';
import { CommentPToken } from 'token';

import { charCheck } from '../../common/charCheck';
import { wellFormedErrorCodes } from '../../error/wellFormedError';

import { commentCheck } from '../commentCheck';

jest.mock('../../common/charCheck');

const WFEID = wellFormedErrorCodes.id;

describe('commentCheck()', () => {
   let confVer: ConformanceVersion;
   let collector: ParamCollector;
   let commentPToken: CommentPToken;

   beforeEach(() => {
      commentPToken = new CommentPToken({
         close: toSToken('-->'),
         open: toSToken('<!--'),
         text: [toSToken('commentText')],
      });

      confVer = new ConformanceVersion();
      collector = new ParamCollector();
   });

   it('asks the charCheck() to validate the text', () => {
      commentPToken = new CommentPToken({
         ...commentPToken,
         text: [toSToken('blah'), toSToken('commentText')],
      });

      commentCheck(commentPToken, collector, confVer);

      expect(charCheck).toHaveBeenCalledWith(commentPToken.text[0], collector, confVer, false);
      expect(charCheck).toHaveBeenCalledWith(commentPToken.text[1], collector, confVer, false);
   });

   it('reports an error when the content ends with a hyphen', () => {
      commentPToken = new CommentPToken({
         ...commentPToken,
         text: [new SToken('-', '-', new Range(new EntityId(), 1, 0, 1, 2, 0, 2))],
      });

      commentCheck(commentPToken, collector, confVer);

      // @ts-expect-error ts2339 types for matchers not right
      expect(collector).toHaveWellFormedError({
         id: WFEID.COMMENT_ENDS_WITH_HYPHEN,
         params: [],
         position: new Offset(new EntityId(), 1, 0, 1),
      });
   });

   it('reports an error when the content ends with a hyphen, and there is no range', () => {
      commentPToken.text[0].str += '-';
      commentPToken.text[0].originalStr += '-';
      commentPToken.text[0].ranges = [];

      commentCheck(commentPToken, collector, confVer);

      // @ts-expect-error ts2339 types for matchers not right
      expect(collector).toHaveWellFormedError({
         id: WFEID.COMMENT_ENDS_WITH_HYPHEN,
         params: [],
         position: commentPToken.text[0],
      });
   });

   it('reports an error there is a "--" in the comment text', () => {
      commentPToken = new CommentPToken({
         ...commentPToken,
         text: [toSToken('commentText'), toSToken('--'), toSToken(' illegal')],
      });

      commentCheck(commentPToken, collector, confVer);

      // @ts-expect-error ts2339 types for matchers not right
      expect(collector).toHaveWellFormedError({
         id: WFEID.COMMENT_DOUBLE_HYPHEN,
         params: [],
         position: commentPToken.text[1],
      });
   });

   it('reports an error when there was no closing', () => {
      commentPToken = new CommentPToken({
         ...commentPToken,
         close: undefined,
      });

      commentCheck(commentPToken, collector, confVer);

      // @ts-expect-error ts2339 types for matchers not right
      expect(collector).toHaveWellFormedError({
         id: WFEID.COMMENT_NO_CLOSE,
         lastPosition: commentPToken.text[0],
         params: [],
         position: undefined,
      });
   });

   it('reports an error when there was an empty text and no closing', () => {
      commentPToken = new CommentPToken({
         ...commentPToken,
         close: undefined,
         text: [],
      });

      commentCheck(commentPToken, collector, confVer);

      // @ts-expect-error ts2339 types for matchers not right
      expect(collector).toHaveWellFormedError({
         id: WFEID.COMMENT_NO_CLOSE,
         lastPosition: commentPToken.open,
         params: [],
         position: undefined,
      });
   });
});
