/* Copyright ® 2016-2021 by 柏大衛. All rights reserved. */

import { Range } from 'basic';
import { toSToken, SToken } from 'basic';
import { CommentPToken } from 'token';

import { CommentExpanderStream } from '../CommentExpanderStream';

describe('CommentExpanderStream (unit)', () => {
   let cfs: CommentExpanderStream;
   let mockPush: jest.Mock;
   let ranges: Array<Range>;

   beforeEach(() => {
      cfs = new CommentExpanderStream();
      mockPush = jest.fn();
      cfs.push = mockPush;
      ranges = toSToken('junk').ranges;
   });

   it('passes non-comment through unchanged', () => {
      const obj = { obj: true };
      cfs.write(obj);

      expect(mockPush).toHaveBeenCalledWith(obj);
   });

   it('passes comment through unchanged', () => {
      const cToken = new CommentPToken({
         open: toSToken('<!--'),
         text: [toSToken('this is a test')],
      });
      cfs.write(cToken);

      expect(mockPush).toHaveBeenCalledWith(cToken);
   });

   it('passes comment with a character reference through with the decimalreference resovled', () => {
      const before = new CommentPToken({
         open: toSToken('<!--'),
         text: [toSToken('this is &#97; test')],
      });
      const after = new CommentPToken({
         open: toSToken('<!--'),
         text: [new SToken('this is a test', 'this is &#97; test', ranges)],
      });
      cfs.write(before);

      expect(mockPush).toHaveBeenCalledWith(after);
   });

   it('passes comment with a hex character reference through with the reference resovled', () => {
      const before = new CommentPToken({
         open: toSToken('<!--'),
         text: [toSToken('this is &#x41; test')],
      });
      const after = new CommentPToken({
         open: toSToken('<!--'),
         text: [new SToken('this is A test', 'this is &#x41; test', ranges)],
      });
      cfs.write(before);

      expect(mockPush).toHaveBeenCalledWith(after);
   });

   it('passes comment with multiple char references', () => {
      const before = new CommentPToken({
         open: toSToken('<!--'),
         text: [toSToken('this &#105;s&#32;&#x41; test')],
      });
      const after = new CommentPToken({
         open: toSToken('<!--'),
         text: [new SToken('this is A test', 'this &#105;s&#32;&#x41; test', ranges)],
      });
      cfs.write(before);

      expect(mockPush).toHaveBeenCalledWith(after);
   });

   it('replaces across multiple STokens', () => {
      const before = new CommentPToken({
         open: toSToken('<!--'),
         text: [
            toSToken('this &#105;s&#32;&#x41; test'),
            toSToken('--'),
            toSToken(''),
            toSToken('this is &#97; test'),
         ],
      });
      const after = new CommentPToken({
         open: toSToken('<!--'),
         text: [
            new SToken('this is A test', 'this &#105;s&#32;&#x41; test', ranges),
            new SToken('--', '--', ranges),
            new SToken('', '', ranges),
            new SToken('this is a test', 'this is &#97; test', ranges),
         ],
      });
      cfs.write(before);

      expect(mockPush).toHaveBeenCalledWith(after);
   });

   it('does not do anything with a &# that is not followed by digits', () => {
      const before = new CommentPToken({
         open: toSToken('<!--'),
         text: [toSToken('this is &#z; test')],
      });
      const after = new CommentPToken({
         open: toSToken('<!--'),
         text: [new SToken('this is &#z; test', 'this is &#z; test', ranges)],
      });
      cfs.write(before);

      expect(mockPush).toHaveBeenCalledWith(after);
   });
});
