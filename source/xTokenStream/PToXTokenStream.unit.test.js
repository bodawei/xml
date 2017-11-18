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
} from '../token';

import PToXTokenStream from './PToXTokenStream.js';

describe('PToXTokenStream (unit)', () => {
   let tokenStream;

   beforeEach(() => {
      tokenStream = new PToXTokenStream();
   });

   it('calls declaration.pTokenToXToken()', () => {
      spyOn(declaration, 'pTokenToXToken');
      const pToken = { type: declaration.PTYPE };

      tokenStream.write(pToken);
      tokenStream.read();

      expect(declaration.pTokenToXToken).toHaveBeenCalledWith(pToken);
   });

   it('calls envelope.pTokenToXToken()', () => {
      spyOn(envelope, 'pTokenToXToken');
      const pToken = { type: envelope.PTYPE };

      tokenStream.write(pToken);
      tokenStream.read();

      expect(envelope.pTokenToXToken).toHaveBeenCalledWith(pToken);
   });

   it('calls instruction.pTokenToXToken()', () => {
      spyOn(instruction, 'pTokenToXToken');
      const pToken = { type: instruction.PTYPE };

      tokenStream.write(pToken);
      tokenStream.read();

      expect(instruction.pTokenToXToken).toHaveBeenCalledWith(pToken);
   });

   it('calls cdata.pTokenToXToken()', () => {
      spyOn(cdata, 'pTokenToXToken');
      const pToken = { type: cdata.PTYPE };

      tokenStream.write(pToken);
      tokenStream.read();

      expect(cdata.pTokenToXToken).toHaveBeenCalledWith(pToken);
   });

   it('calls charData.pTokenToXToken()', () => {
      spyOn(charData, 'pTokenToXToken');
      const pToken = { type: charData.PTYPE };

      tokenStream.write(pToken);
      tokenStream.read();

      expect(charData.pTokenToXToken).toHaveBeenCalledWith(pToken);
   });

   it('calls comment.pTokenToXToken()', () => {
      spyOn(comment, 'pTokenToXToken');
      const pToken = { type: comment.PTYPE };

      tokenStream.write(pToken);
      tokenStream.read();

      expect(comment.pTokenToXToken).toHaveBeenCalledWith(pToken);
   });

   it('calls elementStart.pTokenToXToken()', () => {
      spyOn(elementStart, 'pTokenToXToken');
      const pToken = { type: elementStart.PTYPE };

      tokenStream.write(pToken);
      tokenStream.read();

      expect(elementStart.pTokenToXToken).toHaveBeenCalledWith(pToken);
   });

   it('calls elementStart.pTokenToXToken() with an empty element', () => {
      spyOn(elementStart, 'pTokenToXToken');
      const pToken = { type: elementStart.EMPTY_TYPE };

      tokenStream.write(pToken);
      tokenStream.read();

      expect(elementStart.pTokenToXToken).toHaveBeenCalledWith(pToken);
   });

   it('calls elementEnd.pTokenToXToken()', () => {
      spyOn(elementEnd, 'pTokenToXToken');
      const pToken = { type: elementEnd.PTYPE };

      tokenStream.write(pToken);
      tokenStream.read();

      expect(elementEnd.pTokenToXToken).toHaveBeenCalledWith(pToken);
   });

   it('calls entityReference.pTokenToXToken() with a parameter entity reference', () => {
      spyOn(entityReference, 'pTokenToXToken');
      const pToken = { type: entityReference.PARAM_PTYPE };

      tokenStream.write(pToken);
      tokenStream.read();

      expect(entityReference.pTokenToXToken).toHaveBeenCalledWith(pToken);
   });

   it('calls entityReference.pTokenToXToken()', () => {
      spyOn(entityReference, 'pTokenToXToken');
      const pToken = { type: entityReference.PTYPE };

      tokenStream.write(pToken);
      tokenStream.read();

      expect(entityReference.pTokenToXToken).toHaveBeenCalledWith(pToken);
   });

   it('calls notationDeclaration.pTokenToXToken()', () => {
      spyOn(notationDeclaration, 'pTokenToXToken');
      const pToken = { type: notationDeclaration.PTYPE };

      tokenStream.write(pToken);
      tokenStream.read();

      expect(notationDeclaration.pTokenToXToken).toHaveBeenCalledWith(pToken);
   });

   it('calls processingInstruction.pTokenToXToken()', () => {
      spyOn(processingInstruction, 'pTokenToXToken');
      const pToken = { type: processingInstruction.PTYPE };

      tokenStream.write(pToken);
      tokenStream.read();

      expect(processingInstruction.pTokenToXToken).toHaveBeenCalledWith(pToken);
   });

   it('calls space.pTokenToXToken()', () => {
      spyOn(space, 'pTokenToXToken');
      const pToken = { type: space.PTYPE };

      tokenStream.write(pToken);
      tokenStream.read();

      expect(space.pTokenToXToken).toHaveBeenCalledWith(pToken);
   });

   it('calls text.pTokenToXToken()', () => {
      spyOn(text, 'makeXToken');
      const pToken = { type: text.PTYPE };

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
