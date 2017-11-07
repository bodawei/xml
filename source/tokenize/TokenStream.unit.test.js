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
   text,
} from '../xToken';

import TokenStream from './TokenStream.js';

describe('TokenStream (unit)', () => {
   let tokenStream;

   beforeEach(() => {
      tokenStream = new TokenStream();
   });

   it('calls declaration.makeToken()', () => {
      spyOn(declaration, 'makeToken');
      const pToken = { type: declaration.TYPE };

      tokenStream.write(pToken);
      tokenStream.read();

      expect(declaration.makeToken).toHaveBeenCalledWith(pToken);
   });

   it('calls envelope.makeToken()', () => {
      spyOn(envelope, 'makeToken');
      const pToken = { type: envelope.TYPE };

      tokenStream.write(pToken);
      tokenStream.read();

      expect(envelope.makeToken).toHaveBeenCalledWith(pToken);
   });

   it('calls instruction.makeToken()', () => {
      spyOn(instruction, 'makeToken');
      const pToken = { type: instruction.TYPE };

      tokenStream.write(pToken);
      tokenStream.read();

      expect(instruction.makeToken).toHaveBeenCalledWith(pToken);
   });

   it('calls cdata.makeToken()', () => {
      spyOn(cdata, 'makeToken');
      const pToken = { type: cdata.TYPE };

      tokenStream.write(pToken);
      tokenStream.read();

      expect(cdata.makeToken).toHaveBeenCalledWith(pToken);
   });

   it('calls charData.makeToken()', () => {
      spyOn(charData, 'makeToken');
      const pToken = { type: charData.TYPE };

      tokenStream.write(pToken);
      tokenStream.read();

      expect(charData.makeToken).toHaveBeenCalledWith(pToken);
   });

   it('calls comment.makeToken()', () => {
      spyOn(comment, 'makeToken');
      const pToken = { type: comment.TYPE };

      tokenStream.write(pToken);
      tokenStream.read();

      expect(comment.makeToken).toHaveBeenCalledWith(pToken);
   });

   it('calls elementStart.makeToken()', () => {
      spyOn(elementStart, 'makeToken');
      const pToken = { type: elementStart.TYPE };

      tokenStream.write(pToken);
      tokenStream.read();

      expect(elementStart.makeToken).toHaveBeenCalledWith(pToken);
   });

   it('calls elementStart.makeToken() with an empty element', () => {
      spyOn(elementStart, 'makeToken');
      const pToken = { type: elementStart.EMPTY_TYPE };

      tokenStream.write(pToken);
      tokenStream.read();

      expect(elementStart.makeToken).toHaveBeenCalledWith(pToken);
   });

   it('calls elementEnd.makeToken()', () => {
      spyOn(elementEnd, 'makeToken');
      const pToken = { type: elementEnd.TYPE };

      tokenStream.write(pToken);
      tokenStream.read();

      expect(elementEnd.makeToken).toHaveBeenCalledWith(pToken);
   });

   it('calls entityReference.makeToken() with a parameter entity reference', () => {
      spyOn(entityReference, 'makeToken');
      const pToken = { type: entityReference.PARAM_TYPE };

      tokenStream.write(pToken);
      tokenStream.read();

      expect(entityReference.makeToken).toHaveBeenCalledWith(pToken);
   });

   it('calls entityReference.makeToken()', () => {
      spyOn(entityReference, 'makeToken');
      const pToken = { type: entityReference.TYPE };

      tokenStream.write(pToken);
      tokenStream.read();

      expect(entityReference.makeToken).toHaveBeenCalledWith(pToken);
   });

   it('calls notationDeclaration.makeToken()', () => {
      spyOn(notationDeclaration, 'makeToken');
      const pToken = { type: notationDeclaration.TYPE };

      tokenStream.write(pToken);
      tokenStream.read();

      expect(notationDeclaration.makeToken).toHaveBeenCalledWith(pToken);
   });

   it('calls processingInstruction.makeToken()', () => {
      spyOn(processingInstruction, 'makeToken');
      const pToken = { type: processingInstruction.TYPE };

      tokenStream.write(pToken);
      tokenStream.read();

      expect(processingInstruction.makeToken).toHaveBeenCalledWith(pToken);
   });

   it('calls space.makeToken()', () => {
      spyOn(space, 'makeToken');
      const pToken = { type: space.TYPE };

      tokenStream.write(pToken);
      tokenStream.read();

      expect(space.makeToken).toHaveBeenCalledWith(pToken);
   });

   it('calls text.makeToken()', () => {
      spyOn(text, 'makeXToken');
      const pToken = { type: text.TYPE };

      tokenStream.write(pToken);
      tokenStream.read();

      expect(text.makeXToken).toHaveBeenCalledWith(pToken);
   });

   it('throws an error if asked to deal with an unknown pToken type', () => {
      tokenStream.write({ type: 'BOGUS' });

      const token = tokenStream.read();

      expect(token.message).toEqual('Unknown PToken type "BOGUS" encountered.');
   });

});
