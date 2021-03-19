/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { ConformanceVersion, EntityId, Offset, Range } from 'basic';
import { MockErrorCollector } from 'basic-test';
import { toSToken, SToken } from 'sToken';
import { CommentPToken } from 'token';

import { charCheck } from '../../common/charCheck';
import { WellFormedError } from '../../error/WellFormedError';

import { commentCheck } from '../commentCheck';

jest.mock('../../common/charCheck');

describe('commentCheck()', () => {
   let confVer: ConformanceVersion;
   let mockErrorCollector: MockErrorCollector;
   let commentPToken: CommentPToken;

   beforeEach(() => {
      commentPToken = new CommentPToken({
         open: toSToken('<!--'),
         text: [toSToken('commentText')],
         close: toSToken('-->'),
      });

      confVer = new ConformanceVersion();
      mockErrorCollector = new MockErrorCollector();
   });

   it('asks the charCheck() to validate the text', () => {
      commentPToken = new CommentPToken({
         ...commentPToken,
         text: [toSToken('blah'), toSToken('commentText')],
      });

      commentCheck(commentPToken, mockErrorCollector, confVer);

      expect(charCheck).toHaveBeenCalledWith(commentPToken.text[0], mockErrorCollector, confVer);
      expect(charCheck).toHaveBeenCalledWith(commentPToken.text[1], mockErrorCollector, confVer);
   });

   it('reports an error when the content ends with a hyphen', () => {
      commentPToken = new CommentPToken({
         ...commentPToken,
         text: [new SToken('-', '-', new Range(new EntityId(), 1, 0, 1, 2, 0, 2))],
      });

      commentCheck(commentPToken, mockErrorCollector, confVer);

      // @ts-expect-error ts2339 types for matchers not right
      expect(mockErrorCollector).toReportWFError({
         id: WellFormedError.ID.COMMENT_ENDS_WITH_HYPHEN,
         params: undefined,
         position: new Offset(new EntityId(), 1, 0, 1),
      });
   });

   it('reports an error when the content ends with a hyphen, and there is no range', () => {
      commentPToken.text[0].str += '-';
      commentPToken.text[0].originalStr += '-';
      commentPToken.text[0].ranges = [];

      commentCheck(commentPToken, mockErrorCollector, confVer);

      // @ts-expect-error ts2339 types for matchers not right
      expect(mockErrorCollector).toReportWFError({
         id: WellFormedError.ID.COMMENT_ENDS_WITH_HYPHEN,
         params: undefined,
         position: commentPToken.text[0],
      });
   });

   it('reports an error there is a "--" in the comment text', () => {
      commentPToken = new CommentPToken({
         ...commentPToken,
         text: [toSToken('commentText'), toSToken('--'), toSToken(' illegal')],
      });

      commentCheck(commentPToken, mockErrorCollector, confVer);

      // @ts-expect-error ts2339 types for matchers not right
      expect(mockErrorCollector).toReportWFError({
         id: WellFormedError.ID.COMMENT_DOUBLE_HYPHEN,
         params: undefined,
         position: commentPToken.text[1],
      });
   });

   it('reports an error when there was no closing', () => {
      commentPToken = new CommentPToken({
         ...commentPToken,
         close: undefined,
      });

      commentCheck(commentPToken, mockErrorCollector, confVer);

      // @ts-expect-error ts2339 types for matchers not right
      expect(mockErrorCollector).toReportWFError({
         id: WellFormedError.ID.COMMENT_NO_CLOSE,
         params: undefined,
         position: undefined,
         lastPosition: commentPToken.text[0],
      });
   });

   it('reports an error when there was an empty text and no closing', () => {
      commentPToken = new CommentPToken({
         ...commentPToken,
         text: [],
         close: undefined,
      });

      commentCheck(commentPToken, mockErrorCollector, confVer);

      // @ts-expect-error ts2339 types for matchers not right
      expect(mockErrorCollector).toReportWFError({
         id: WellFormedError.ID.COMMENT_NO_CLOSE,
         params: undefined,
         position: undefined,
         lastPosition: commentPToken.open,
      });
   });
});
