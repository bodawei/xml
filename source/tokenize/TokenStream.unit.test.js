/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import {
   declaration,
   envelope,
   instruction,

   cdata,
   charData,
   comment,
   elementEnd,
   elementStart,
   entityReference,
   notationDeclaration,
   processingInstruction,
   space,
} from '../xToken';

import TokenStream from './TokenStream.js';

describe('TokenStream (unit)', () => {
   let tokenStream;

   beforeEach(() => {
      tokenStream = new TokenStream();
   });

   it('calls declaration.makeToken()', () => {
      spyOn(declaration, 'makeToken');
      const parsed = { type: declaration.TYPE };

      tokenStream.write(parsed);
      tokenStream.read();

      expect(declaration.makeToken).toHaveBeenCalledWith(parsed);
   });

   it('calls envelope.makeToken()', () => {
      spyOn(envelope, 'makeToken');
      const parsed = { type: envelope.TYPE };

      tokenStream.write(parsed);
      tokenStream.read();

      expect(envelope.makeToken).toHaveBeenCalledWith(parsed);
   });

   it('calls instruction.makeToken()', () => {
      spyOn(instruction, 'makeToken');
      const parsed = { type: instruction.TYPE };

      tokenStream.write(parsed);
      tokenStream.read();

      expect(instruction.makeToken).toHaveBeenCalledWith(parsed);
   });

   it('calls cdata.makeToken()', () => {
      spyOn(cdata, 'makeToken');
      const parsed = { type: cdata.TYPE };

      tokenStream.write(parsed);
      tokenStream.read();

      expect(cdata.makeToken).toHaveBeenCalledWith(parsed);
   });

   it('calls charData.makeToken()', () => {
      spyOn(charData, 'makeToken');
      const parsed = { type: charData.TYPE };

      tokenStream.write(parsed);
      tokenStream.read();

      expect(charData.makeToken).toHaveBeenCalledWith(parsed);
   });

   it('calls comment.makeToken()', () => {
      spyOn(comment, 'makeToken');
      const parsed = { type: comment.TYPE };

      tokenStream.write(parsed);
      tokenStream.read();

      expect(comment.makeToken).toHaveBeenCalledWith(parsed);
   });

   it('calls elementStart.makeToken()', () => {
      spyOn(elementStart, 'makeToken');
      const parsed = { type: elementStart.TYPE };

      tokenStream.write(parsed);
      tokenStream.read();

      expect(elementStart.makeToken).toHaveBeenCalledWith(parsed);
   });

   it('calls elementStart.makeToken() with an empty element', () => {
      spyOn(elementStart, 'makeToken');
      const parsed = { type: elementStart.EMPTY_TYPE };

      tokenStream.write(parsed);
      tokenStream.read();

      expect(elementStart.makeToken).toHaveBeenCalledWith(parsed);
   });

   it('calls elementEnd.makeToken()', () => {
      spyOn(elementEnd, 'makeToken');
      const parsed = { type: elementEnd.TYPE };

      tokenStream.write(parsed);
      tokenStream.read();

      expect(elementEnd.makeToken).toHaveBeenCalledWith(parsed);
   });

   it('calls entityReference.makeToken()', () => {
      spyOn(entityReference, 'makeToken');
      const parsed = { type: entityReference.TYPE };

      tokenStream.write(parsed);
      tokenStream.read();

      expect(entityReference.makeToken).toHaveBeenCalledWith(parsed);
   });

   it('calls notationDeclaration.makeToken()', () => {
      spyOn(notationDeclaration, 'makeToken');
      const parsed = { type: notationDeclaration.TYPE };

      tokenStream.write(parsed);
      tokenStream.read();

      expect(notationDeclaration.makeToken).toHaveBeenCalledWith(parsed);
   });

   it('calls processingInstruction.makeToken()', () => {
      spyOn(processingInstruction, 'makeToken');
      const parsed = { type: processingInstruction.TYPE };

      tokenStream.write(parsed);
      tokenStream.read();

      expect(processingInstruction.makeToken).toHaveBeenCalledWith(parsed);
   });

   it('calls space.makeToken()', () => {
      spyOn(space, 'makeToken');
      const parsed = { type: space.TYPE };

      tokenStream.write(parsed);
      tokenStream.read();

      expect(space.makeToken).toHaveBeenCalledWith(parsed);
   });

   it('throws an error if asked to deal with an unknown parsed type', () => {
      tokenStream.write({ type: 'BOGUS' });

      const token = tokenStream.read();

      expect(token.message).toEqual('Unknown parsed type "BOGUS" encountered.');
   });

});
