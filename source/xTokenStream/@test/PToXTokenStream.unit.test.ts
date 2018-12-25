/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { SToken } from 'sToken';
import {
   declaration,

   attListDeclaration,
   charData,
   comment,
   elementEnd,
   elementStart,
   elementDeclaration,
   space,
   text,

   CdataPToken,
   ProcessingInstructionPToken,
   XmlDeclarationPToken,
   TextDeclarationPToken,
   GeneralEntityReferencePToken,
   ParameterEntityReferencePToken,
   NotationDeclarationPToken,
   InternalSubsetStartXToken,
   InternalSubsetEndXToken,
   ExternalSubsetEndXToken,
   ExternalSubsetStartXToken,
} from '../../token';

import PToXTokenStream from '../PToXTokenStream';
import { EntityMetaData } from 'basic';
import { WellFormedError } from 'error';

describe('PToXTokenStream (unit)', () => {
   let tokenStream: PToXTokenStream;

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

   it('calls attListDeclaration.pTokenToXToken()', () => {
      spyOn(attListDeclaration, 'pTokenToXToken');
      const pToken = { type: attListDeclaration.PTYPE };

      tokenStream.write(pToken);
      tokenStream.read();

      expect(attListDeclaration.pTokenToXToken).toHaveBeenCalledWith(pToken);
   });

   it('calls cdata.pTokenToXToken()', () => {
      const pToken = new CdataPToken({ open: SToken.fromString('<![') });
      spyOn(pToken, 'toXToken');

      tokenStream.write(pToken);
      tokenStream.read();

      expect(pToken.toXToken).toHaveBeenCalledWith();
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

   it('calls elementDeclaration.pTokenToXToken()', () => {
      spyOn(elementDeclaration, 'pTokenToXToken');
      const pToken = { type: elementDeclaration.PTYPE };

      tokenStream.write(pToken);
      tokenStream.read();

      expect(elementDeclaration.pTokenToXToken).toHaveBeenCalledWith(pToken);
   });

   it('calls peRef.toXToken() with a parameter entity reference', () => {
      const pToken = new ParameterEntityReferencePToken({ open: SToken.fromString('&') });
      spyOn(pToken, 'toXToken');

      tokenStream.write(pToken);
      tokenStream.read();

      expect(pToken.toXToken).toHaveBeenCalledWith();
   });

   it('calls geRef.toXToken()', () => {
      const pToken = new GeneralEntityReferencePToken({ open: SToken.fromString('&') });
      spyOn(pToken, 'toXToken');

      tokenStream.write(pToken);
      tokenStream.read();

      expect(pToken.toXToken).toHaveBeenCalledWith();
   });

   it('calls notationDeclaration.pTokenToXToken()', () => {
      const pToken = new NotationDeclarationPToken({ open: SToken.fromString('<') });
      spyOn(pToken, 'toXToken');

      tokenStream.write(pToken);
      tokenStream.read();

      expect(pToken.toXToken).toHaveBeenCalledWith();
   });

   it('calls processingInstruction.toXToken()', () => {
      const pToken = new ProcessingInstructionPToken({ open: SToken.fromString('') });
      spyOn(pToken, 'toXToken');

      tokenStream.write(pToken);
      tokenStream.read();

      expect(pToken.toXToken).toHaveBeenCalledWith();
   });

   it('calls textDeclaration.toXToken()', () => {
      const pToken = new TextDeclarationPToken({ open: SToken.fromString('') });
      spyOn(pToken, 'toXToken');

      tokenStream.write(pToken);
      tokenStream.read();

      expect(pToken.toXToken).toHaveBeenCalledWith();
   });

   it('calls xmlDeclaration.toXToken()', () => {
      const pToken = new XmlDeclarationPToken({ open: SToken.fromString('') });
      spyOn(pToken, 'toXToken');

      tokenStream.write(pToken);
      tokenStream.read();

      expect(pToken.toXToken).toHaveBeenCalledWith();
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

   it('passes EntityMetaData through', () => {
      tokenStream.write(new EntityMetaData());

      const result = tokenStream.read();

      expect(result).toEqual(new EntityMetaData());
   });

   it('passes InternalSubsetStart through', () => {
      tokenStream.write(new InternalSubsetStartXToken());

      const result = tokenStream.read();

      expect(result).toEqual(new InternalSubsetStartXToken());
   });

   it('passes InternalSubsetEnd through', () => {
      tokenStream.write(new InternalSubsetEndXToken());

      const result = tokenStream.read();

      expect(result).toEqual(new InternalSubsetEndXToken());
   });

   it('passes ExternalSubsetStart through', () => {
      tokenStream.write(new ExternalSubsetStartXToken());

      const result = tokenStream.read();

      expect(result).toEqual(new ExternalSubsetStartXToken());
   });

   it('passes ExternalSubsetEnd through', () => {
      tokenStream.write(new ExternalSubsetEndXToken());

      const result = tokenStream.read();

      expect(result).toEqual(new ExternalSubsetEndXToken());
   });

   it('throws an error if asked to deal with an unknown pToken type', () => {
      tokenStream.write({ type: 'BOGUS' });

      const error = tokenStream.read();
      const token = tokenStream.read();

      expect(error).toEqual(new WellFormedError(WellFormedError.ID.INTERNAL_ERROR, [ `Unknown PToken type "BOGUS" encountered.` ]));
      expect(token).toEqual({ type: 'BOGUS' });
   });

});
