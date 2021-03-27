/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { ConformanceVersion } from 'basic';
import { GeneralEntityReferencePToken, ParameterEntityReferencePToken,  } from 'pToken';
import { SToken } from 'sToken';
import {
   declaration,

   CdataPToken,
   CharDataPToken,
   ElementEndPToken,
   
   ParameterEntityEndPToken,
   ParameterEntityStartPToken,
   InternalSubsetStartToken,
   InternalSubsetEndToken,
   ExternalSubsetEndToken,
   ExternalSubsetStartToken,
   CommentPToken,
   GeneralEntityStartPToken,
   GeneralEntityEndPToken,
} from 'token';

import PToXTokenStream from '../PToXTokenStream';

describe('PToXTokenStream (unit)', () => {
   let tokenStream: PToXTokenStream;

   beforeEach(() => {
      tokenStream = new PToXTokenStream();
   });

   it('calls declaration.pTokenToXToken()', () => {
      spyOn(declaration, 'pTokenToXToken');
      const pToken: any = { type: declaration.PTYPE };

      tokenStream.write(pToken);
      tokenStream.read();

      expect(declaration.pTokenToXToken).toHaveBeenCalledWith(pToken);
   });

   // it('calls attListDeclaration.pTokenToXToken()', () => {
   //    spyOn(attListDeclaration, 'pTokenToXToken');
   //    const pToken: any = { type: attListDeclaration.PTYPE };

   //    tokenStream.write(pToken);
   //    tokenStream.read();

   //    expect(attListDeclaration.pTokenToXToken).toHaveBeenCalledWith(pToken);
   // });

   it('calls cdata.pTokenToXToken()', () => {
      const pToken = new CdataPToken({ open: SToken.fromString('<![') });
      spyOn(pToken, 'toXToken');

      tokenStream.write(pToken);
      tokenStream.read();

      expect(pToken.toXToken).toHaveBeenCalledWith();
   });

   it('calls charData.toXToken()', () => {
      const pToken = new CharDataPToken({ text: SToken.fromString('x') });
      spyOn(pToken, 'toXToken');

      tokenStream.write(pToken);
      tokenStream.read();

      expect(pToken.toXToken).toHaveBeenCalledWith();
   });

   // it('calls charRef.toXToken()', () => {
   //    const pToken = new CharRefPToken({ open: SToken.fromString('&#') });
   //    spyOn(pToken, 'toXToken');

   //    tokenStream.write(pToken);
   //    tokenStream.read();

   //    expect(pToken.toXToken).toHaveBeenCalledWith();
   // });

   it('calls comment.toXToken()', () => {
      const pToken = new CommentPToken({ open: SToken.fromString('<!--') });
      spyOn(pToken, 'toXToken');

      tokenStream.write(pToken);
      tokenStream.read();

      expect(pToken.toXToken).toHaveBeenCalledWith();
   });

   // it('calls conditional.toXToken()', () => {
   //    const pToken = new ConditionalPToken({ open: SToken.fromString('<[') });
   //    const convertSpy = spyOn(xTokenStuff, 'conditionalSectionPTokenToXToken');

   //    tokenStream.write(pToken);
   //    tokenStream.read();

   //    expect(convertSpy).toHaveBeenCalledWith(pToken);
   // });

   // it('calls conditionalClose.toXToken()', () => {
   //    const pToken = new ConditionalClosePToken({ open: SToken.fromString(']]>') });
   //    const convertSpy = spyOn(xTokenStuff, 'conditionalClosePTokenToXToken');

   //    tokenStream.write(pToken);
   //    tokenStream.read();

   //    expect(convertSpy).toHaveBeenCalledWith(pToken);
   // });

   // it('calls ElementStartPToken.toXToken()', () => {
   //    const pToken = new ElementStartPToken({ open: SToken.fromString('<') });
   //    spyOn(pToken, 'toXToken');

   //    tokenStream.write(pToken);
   //    tokenStream.read();

   //    expect(pToken.toXToken).toHaveBeenCalledWith();
   // });

   // it('calls pToken.toXToken() with an empty element', () => {
   //    const pToken = new ElementEmptyPToken({ open: SToken.fromString('<') });
   //    spyOn(pToken, 'toXToken');

   //    tokenStream.write(pToken);
   //    tokenStream.read();

   //    expect(pToken.toXToken).toHaveBeenCalledWith();
   // });

   it('calls elementEnd.toXToken()', () => {
      const pToken = new ElementEndPToken({ open: SToken.fromString('<') });
      spyOn(pToken, 'toXToken');

      tokenStream.write(pToken);
      tokenStream.read();

      expect(pToken.toXToken).toHaveBeenCalledWith();
   });

   // it('calls elementDeclaration.pTokenToXToken()', () => {
   //    spyOn(elementDeclaration, 'pTokenToXToken');
   //    const pToken: any = { type: elementDeclaration.PTYPE };

   //    tokenStream.write(pToken);
   //    tokenStream.read();

   //    expect(elementDeclaration.pTokenToXToken).toHaveBeenCalledWith(pToken);
   // });

   it('calls peStart.toXToken() with a parameter entity reference', () => {
      const pToken = new ParameterEntityStartPToken(new ParameterEntityReferencePToken({ open: SToken.fromString('&') }));
      spyOn(pToken, 'toXToken');

      tokenStream.write(pToken);
      tokenStream.read();

      expect(pToken.toXToken).toHaveBeenCalledWith();
   });

   it('calls peEnd.toXToken() with a parameter entity reference', () => {
      const pToken = new ParameterEntityEndPToken(new ParameterEntityReferencePToken({ open: SToken.fromString('&') }));
      spyOn(pToken, 'toXToken');

      tokenStream.write(pToken);
      tokenStream.read();

      expect(pToken.toXToken).toHaveBeenCalledWith();
   });

   // it('calls peRef.toXToken() with a parameter entity reference', () => {
   //    const pToken = new ParameterEntityReferencePToken({ open: SToken.fromString('&') });
   //    spyOn(pToken, 'toXToken');

   //    tokenStream.write(pToken);
   //    tokenStream.read();

   //    expect(pToken.toXToken).toHaveBeenCalledWith();
   // });

   // it('calls geRef.toXToken()', () => {
   //    const pToken = new GeneralEntityReferencePToken({ open: SToken.fromString('&') });
   //    spyOn(pToken, 'toXToken');

   //    tokenStream.write(pToken);
   //    tokenStream.read();

   //    expect(pToken.toXToken).toHaveBeenCalledWith();
   // });

   it('calls geStart.toXToken()', () => {
      const pToken = new GeneralEntityStartPToken(new GeneralEntityReferencePToken({ open: SToken.fromString('&') }));
      spyOn(pToken, 'toXToken');

      tokenStream.write(pToken);
      tokenStream.read();

      expect(pToken.toXToken).toHaveBeenCalledWith();
   });

   it('calls geEnd.toXToken()', () => {
      const pToken = new GeneralEntityEndPToken(new GeneralEntityReferencePToken({ open: SToken.fromString('&') }));
      spyOn(pToken, 'toXToken');

      tokenStream.write(pToken);
      tokenStream.read();

      expect(pToken.toXToken).toHaveBeenCalledWith();
   });

   // it('calls notationDeclaration.pTokenToXToken()', () => {
   //    const pToken = new NotationDeclarationPToken({ open: SToken.fromString('<') });
   //    spyOn(pToken, 'toXToken');

   //    tokenStream.write(pToken);
   //    tokenStream.read();

   //    expect(pToken.toXToken).toHaveBeenCalledWith();
   // });

   // it('calls processingInstruction.toXToken()', () => {
   //    const pToken = new ProcessingInstructionPToken({ open: SToken.fromString('') });
   //    spyOn(pToken, 'toXToken');

   //    tokenStream.write(pToken);
   //    tokenStream.read();

   //    expect(pToken.toXToken).toHaveBeenCalledWith();
   // });

   // it('calls spacePToken.toXToken()', () => {
   //    const pToken = new SpacePToken({ text: SToken.fromString(' ') });
   //    spyOn(pToken, 'toXToken');

   //    tokenStream.write(pToken);
   //    tokenStream.read();

   //    expect(pToken.toXToken).toHaveBeenCalled();
   // });

   // it('calls text.toXToken()', () => {
   //    const pToken = new TextPToken({ text: SToken.fromString('x') });
   //    spyOn(pToken, 'toXToken');

   //    tokenStream.write(pToken);
   //    tokenStream.read();

   //    expect(pToken.toXToken).toHaveBeenCalledWith();
   // });

   it('passes ConformanceVersion through', () => {
      tokenStream.write(new ConformanceVersion());

      const result = tokenStream.read();

      expect(result).toEqual(new ConformanceVersion());
   });

   it('passes InternalSubsetStart through', () => {
      tokenStream.write(new InternalSubsetStartToken());

      const result = tokenStream.read();

      expect(result).toEqual(new InternalSubsetStartToken());
   });

   it('passes InternalSubsetEnd through', () => {
      tokenStream.write(new InternalSubsetEndToken());

      const result = tokenStream.read();

      expect(result).toEqual(new InternalSubsetEndToken());
   });

   it('passes ExternalSubsetStart through', () => {
      tokenStream.write(new ExternalSubsetStartToken());

      const result = tokenStream.read();

      expect(result).toEqual(new ExternalSubsetStartToken());
   });

   it('passes ExternalSubsetEnd through', () => {
      tokenStream.write(new ExternalSubsetEndToken());

      const result = tokenStream.read();

      expect(result).toEqual(new ExternalSubsetEndToken());
   });

   it('passes unknown tokens through with no changes', () => {
      tokenStream.write({ type: 'BOGUS' });

      const token = tokenStream.read();

      expect(token).toEqual({ type: 'BOGUS' });
   });

});
