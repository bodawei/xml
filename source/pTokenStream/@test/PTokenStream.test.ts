/* Copyright ® 2017-2019 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation, EntityMetaData, Range, EntityKind } from 'basic';
import { SToken, STokenSource } from 'sToken';
import * as token from 'token';
import {
   elementEnd,
   elementStart,
} from 'token';
import * as tokenStuff from 'token';
import * as instruction from 'token';

import PTokenStream from '../PTokenStream';

type Token = { type: string };
type TokenArray = Array<Token>;

describe('PTokenStream (unit)', () => {
   let pTokenStream: PTokenStream;

   beforeEach(() => {
      pTokenStream = new PTokenStream(new EntityMetaData(EntityKind.DOCUMENT));
   });

   function gatherPTokens(pTokenStream: PTokenStream, deliverResults: (result: TokenArray) => void) {
      const pTokens: TokenArray = [];

      pTokenStream.on('data', (pToken: Token) => pTokens.push(pToken));
      pTokenStream.on('end', () => deliverResults(pTokens));
   }

   describe('unusual read() situation', () => {

      it('ignores a second _read() if one is already in progress', () => {
         const parseSpy = spyOn(pTokenStream, '_parseGeneral');
         pTokenStream.addText(']');
         pTokenStream.endText();

         pTokenStream._read();
         pTokenStream._read();

         expect(parseSpy.calls.count()).toEqual(1);
      });

   });

   describe('weird parse situation', () => {

      it('does not try to parse a close if encountering a "]" but no start was found', (done) => {
         spyOn(pTokenStream, '_parseClose').and.callThrough();
         pTokenStream.addText(']');
         pTokenStream.endText();

         gatherPTokens(pTokenStream, () => {
            expect(pTokenStream._parseClose).not.toHaveBeenCalled();
            done();
         });
      });

   });

   it('calls parseDeclaration() when encountering an ATTLIST', (done) => {
      const parseSpy = spyOn(token, 'parseDeclaration').and.callThrough();
      pTokenStream.addText('<!ATTLIST something bar CDATA #REQUIRED>');
      pTokenStream.endText();

      gatherPTokens(pTokenStream, () => {
         expect(parseSpy.calls.argsFor(0)[0]).toBeInstanceOf(STokenSource);
         expect(parseSpy.calls.argsFor(0)[1].str).toEqual('<!');
         expect(parseSpy.calls.argsFor(0)[2]).toBeInstanceOf(EntityMetaData);
         expect(parseSpy.calls.argsFor(0)[3]).toBeInstanceOf(Function);
         done();
      });
   });

   it('calls charRef.parse()', (done) => {
      const parseSpy = spyOn(tokenStuff, 'parseCharRef').and.callThrough();
      pTokenStream.addText('&#foo;');
      pTokenStream.endText();

      gatherPTokens(pTokenStream, () => {
         expect(parseSpy.calls.argsFor(0)[0]).toBeInstanceOf(STokenSource);
         expect(parseSpy.calls.argsFor(0)[1]).toBeInstanceOf(SToken);
         expect(parseSpy.calls.argsFor(0)[2]).toBeInstanceOf(Function);
         done();
      });
   });

   it('calls charData.parse()', (done) => {
      const parseSpy = spyOn(token, 'parseCharData').and.callThrough();
      pTokenStream.addText('asdf</foo>');
      pTokenStream.endText();

      gatherPTokens(pTokenStream, () => {
         expect(parseSpy.calls.argsFor(0)[0]).toBeInstanceOf(STokenSource);
         expect(parseSpy.calls.argsFor(0)[1]).toEqual([]);
         expect(parseSpy.calls.argsFor(0)[2]).toBeInstanceOf(Function);
         done();
      });
   });

   it('calls charData.parse() in the internal subset', (done) => {
      const parseSpy = spyOn(token, 'parseCharData').and.callThrough();
      pTokenStream.addText('<!DOCTYPE foo [ asdf</foo>');
      pTokenStream.endText();

      gatherPTokens(pTokenStream, () => {
         expect(parseSpy.calls.argsFor(0)[0]).toBeInstanceOf(STokenSource);
         expect(parseSpy.calls.argsFor(0)[1]).toEqual([ '%' ]);
         expect(parseSpy.calls.argsFor(0)[2]).toBeInstanceOf(Function);
         done();
      });
   });

   it('calls comment.parse()', (done) => {
      spyOn(tokenStuff, 'parseComment').and.callThrough();
      pTokenStream.addText('<!--asdf-->');
      pTokenStream.endText();

      gatherPTokens(pTokenStream, () => {
         expect(tokenStuff.parseComment).toHaveBeenCalled();
         done();
      });
   });

   it('calls elementStart.parse()', (done) => {
      spyOn(elementStart, 'parse').and.callThrough();
      pTokenStream.addText('<foo>');
      pTokenStream.endText();

      gatherPTokens(pTokenStream, () => {
         expect(elementStart.parse).toHaveBeenCalled();
         done();
      });
   });

   it('calls parseDeclaration() when encountering a DOCTYPE', (done) => {
      const parseSpy = spyOn(token, 'parseDeclaration').and.callThrough();
      pTokenStream.addText('<!DOCTYPE theType>');
      pTokenStream.endText();

      gatherPTokens(pTokenStream, () => {
         expect(parseSpy.calls.argsFor(0)[0]).toBeInstanceOf(STokenSource);
         expect(parseSpy.calls.argsFor(0)[1].str).toEqual('<!');
         expect(parseSpy.calls.argsFor(0)[2]).toBeInstanceOf(EntityMetaData);
         expect(parseSpy.calls.argsFor(0)[3]).toBeInstanceOf(Function);
         done();
      });
   });

   it('calls parseDeclaration() when encountering a DOCTYPE', (done) => {
      const parseSpy = spyOn(token, 'parseDeclaration').and.callThrough();
      pTokenStream.addText('<!docType theType>');
      pTokenStream.endText();

      gatherPTokens(pTokenStream, () => {
         expect(parseSpy.calls.argsFor(0)[0]).toBeInstanceOf(STokenSource);
         expect(parseSpy.calls.argsFor(0)[1].str).toEqual('<!');
         expect(parseSpy.calls.argsFor(0)[2]).toBeInstanceOf(EntityMetaData);
         expect(parseSpy.calls.argsFor(0)[3]).toBeInstanceOf(Function);
         done();
      });
   });

   it('calls elementEnd.parse()', (done) => {
      spyOn(elementEnd, 'parse').and.callThrough();
      pTokenStream.addText('</foo>');
      pTokenStream.endText();

      gatherPTokens(pTokenStream, () => {
         expect(elementEnd.parse).toHaveBeenCalled();
         done();
      });
   });

   it('calls parseDeclaration() when encountering an ELEMENT', (done) => {
      const parseSpy = spyOn(token, 'parseDeclaration').and.callThrough();
      pTokenStream.addText('<!ELEMENT something "foo">');
      pTokenStream.endText();

      gatherPTokens(pTokenStream, () => {
         expect(parseSpy.calls.argsFor(0)[0]).toBeInstanceOf(STokenSource);
         expect(parseSpy.calls.argsFor(0)[1].str).toEqual('<!');
         expect(parseSpy.calls.argsFor(0)[2]).toBeInstanceOf(EntityMetaData);
         expect(parseSpy.calls.argsFor(0)[3]).toBeInstanceOf(Function);
         done();
      });
   });

   it('calls parseDeclaration() when encountering an ENTITY', (done) => {
      const parseSpy = spyOn(token, 'parseDeclaration').and.callThrough();
      pTokenStream.addText('<!ENTITY something "foo">');
      pTokenStream.endText();

      gatherPTokens(pTokenStream, () => {
         expect(parseSpy.calls.argsFor(0)[0]).toBeInstanceOf(STokenSource);
         expect(parseSpy.calls.argsFor(0)[1].str).toEqual('<!');
         expect(parseSpy.calls.argsFor(0)[2]).toBeInstanceOf(EntityMetaData);
         expect(parseSpy.calls.argsFor(0)[3]).toBeInstanceOf(Function);
         done();
      });
   });

   it('calls parseGeneralEntityReference()', (done) => {
      const parseSpy = spyOn(tokenStuff, 'parseGeneralEntityReference').and.callThrough();
      pTokenStream.addText('&foo;');
      pTokenStream.endText();

      gatherPTokens(pTokenStream, () => {
         expect(parseSpy.calls.argsFor(0)[0]).toBeInstanceOf(STokenSource);
         expect(parseSpy.calls.argsFor(0)[1]).toEqual(new SToken('&', '&', new Range(new EntityLocation(), 0, 0, 0, 1, 0, 1)));
         expect(parseSpy.calls.argsFor(0)[2]).toBeInstanceOf(Function);
         done();
      });
   });

   it('calls parseParameterEntityReference()', (done) => {
      const parseSpy = spyOn(tokenStuff, 'parseParameterEntityReference').and.callThrough();
      pTokenStream.addText('%foo;');
      pTokenStream.endText();

      gatherPTokens(pTokenStream, () => {
         expect(parseSpy.calls.argsFor(0)[0]).toBeInstanceOf(STokenSource);
         expect(parseSpy.calls.argsFor(0)[1]).toBeInstanceOf(Function);
         done();
      });
   });

   it('calls parseDeclaration() when encountering a notation', (done) => {
      const parseSpy = spyOn(token, 'parseDeclaration').and.callThrough();
      pTokenStream.addText('<!NOTATION something>');
      pTokenStream.endText();

      gatherPTokens(pTokenStream, () => {
         expect(parseSpy.calls.argsFor(0)[0]).toBeInstanceOf(STokenSource);
         expect(parseSpy.calls.argsFor(0)[1].str).toEqual('<!');
         expect(parseSpy.calls.argsFor(0)[2]).toBeInstanceOf(EntityMetaData);
         expect(parseSpy.calls.argsFor(0)[3]).toBeInstanceOf(Function);
         done();
      });
   });

   it('calls parseInstruction()', (done) => {
      const parseSpy = spyOn(instruction, 'parseInstruction').and.callThrough();
      pTokenStream.addText('<?something foo?>');
      pTokenStream.endText();

      gatherPTokens(pTokenStream, () => {
         expect(parseSpy.calls.argsFor(0)[0]).toBeInstanceOf(STokenSource);
         expect(parseSpy.calls.argsFor(0)[1].str).toEqual('<?');
         expect(parseSpy.calls.argsFor(0)[2]).toEqual(new EntityMetaData(EntityKind.DOCUMENT));
         expect(parseSpy.calls.argsFor(0)[3]).toBeInstanceOf(Function);
         done();
      });
   });

   it('calls space.parse()', (done) => {
      spyOn(tokenStuff, 'parseSpace').and.callThrough();
      pTokenStream.addText('   x');
      pTokenStream.endText();

      gatherPTokens(pTokenStream, () => {
         expect(tokenStuff.parseSpace).toHaveBeenCalled();
         done();
      });
   });

   it('does not call space.parse() if an element start has been found (whitebox)', (done) => {
      const parseSpy = spyOn(tokenStuff, 'parseSpace').and.callThrough();
      pTokenStream.addText('<foo>   ');
      pTokenStream.endText();

      gatherPTokens(pTokenStream, () => {
         expect(parseSpy.calls.count()).toEqual(1);
         done();
      });
   });

   it('call space.parse() after the topmost element start and end have been found (whitebox)', (done) => {
      const parseSpy = spyOn(tokenStuff, 'parseSpace').and.callThrough();
      pTokenStream.addText('<foo></foo>   ');
      pTokenStream.endText();

      gatherPTokens(pTokenStream, () => {
         expect(parseSpy.calls.count()).toEqual(3);
         done();
      });
   });

   it('call space.parse() after nameless start and end have been found (whitebox)', (done) => {
      const parseSpy = spyOn(tokenStuff, 'parseSpace').and.callThrough();
      pTokenStream.addText('<></>   ');
      pTokenStream.endText();

      gatherPTokens(pTokenStream, () => {
         expect(parseSpy.calls.count()).toEqual(3);
         done();
      });
   });

   it('call space.parse() after a misbalaned end has been found (whitebox)', (done) => {
      const parseSpy = spyOn(tokenStuff, 'parseSpace').and.callThrough();
      pTokenStream.addText('<foo></bar></foo>   ');
      pTokenStream.endText();

      gatherPTokens(pTokenStream, () => {
         expect(parseSpy.calls.count()).toEqual(3);
         done();
      });
   });

   it('calls parseDeclaration() when encountering an unknown declaration', (done) => {
      const parseSpy = spyOn(token, 'parseDeclaration').and.callThrough();
      pTokenStream.addText('<!FOO >');
      pTokenStream.endText();

      gatherPTokens(pTokenStream, () => {
         expect(parseSpy.calls.argsFor(0)[0]).toBeInstanceOf(STokenSource);
         expect(parseSpy.calls.argsFor(0)[1].str).toEqual('<!');
         expect(parseSpy.calls.argsFor(0)[2]).toBeInstanceOf(EntityMetaData);
         expect(parseSpy.calls.argsFor(0)[3]).toBeInstanceOf(Function);
         done();
      });
   });

   it('returns the undefined declaration if none provided', (done) => {
      pTokenStream.addText('<!');
      pTokenStream.endText();

      gatherPTokens(pTokenStream, (pTokens) => {
         // 0 is entitymetadata
         expect(pTokens[1].type).toEqual('UNKNOWNDECL');
         done();
      });
   });

   it('calls parseSection()', (done) => {
      const parseSpy = spyOn(token, 'parseSection').and.callThrough();;
      pTokenStream.addText('<![FOO [');
      pTokenStream.endText();

      gatherPTokens(pTokenStream, () => {
         expect(parseSpy.calls.argsFor(0)[0]).toBeInstanceOf(STokenSource);
         expect(parseSpy.calls.argsFor(0)[1].str).toEqual('<![');
         expect(parseSpy.calls.argsFor(0)[2]).toBeInstanceOf(Function);
         done();
      });
   });

   it('parses a single "]" as a charData', (done) => {
      pTokenStream.addText('<?xml version="1.0"?><one>]</one>');
      pTokenStream.endText();

      gatherPTokens(pTokenStream, (pTokens) => {
         // pTokens 0-2 are metadata, xmldecl, and "one" element open
         expect((pTokens[3] as any).text.str).toEqual(']'); // typeHack
         done();
      });
   });

});
