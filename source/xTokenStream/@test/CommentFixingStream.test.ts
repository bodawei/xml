/* Copyright ® 2016-2019 by 柏大衛. All rights reserved. */

import { CommentXToken } from 'token';

import CommentFixingStream from '../CommentFixingStream';

describe('CommentFixingStream (unit)', () => {
   let cfs: CommentFixingStream;

   beforeEach(() => {
      cfs = new CommentFixingStream();
      spyOn(cfs, 'push');
   });

   it('passes non-comment through unchanged', () => {
      const obj = { obj: true };
      cfs.write(obj);

      expect(cfs.push).toHaveBeenCalledWith(obj);
   });

   it('passes comment through unchanged', () => {
      const cToken = new CommentXToken('this is a test');
      cfs.write(cToken);

      expect(cfs.push).toHaveBeenCalledWith(cToken);
   });

   it('passes comment with a character reference through with the decimalreference resovled', () => {
      const before = new CommentXToken('this is &#97; test');
      const after = new CommentXToken('this is a test');
      cfs.write(before);

      expect(cfs.push).toHaveBeenCalledWith(after);
   });

   it('passes comment with a hex character reference through with the reference resovled', () => {
      const before = new CommentXToken('this is &#x41; test');
      const after = new CommentXToken('this is A test');
      cfs.write(before);

      expect(cfs.push).toHaveBeenCalledWith(after);
   });

   it('passes comment with multiple char references', () => {
      const before = new CommentXToken('this &#105;s&#32;&#x41; test');
      const after = new CommentXToken('this is A test');
      cfs.write(before);

      expect(cfs.push).toHaveBeenCalledWith(after);
   });

   it('does not do anything with a &# that is not followed by digits', () => {
      const before = new CommentXToken('this is &#z; test');
      const after = new CommentXToken('this is &#z; test');
      cfs.write(before);

      expect(cfs.push).toHaveBeenCalledWith(after);
   });

});
