/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation, EntityMetaData, Range } from '../../basic';
import { defaultExtractors } from '../../extractor';
import { SToken, STokenSource } from '../../sToken';
import {
   declaration,
   envelope,
   instruction,

   attListDeclaration,
   cdata,
   charData,
   charRef,
   comment,
   docTypeStart,
   elementEnd,
   elementStart,
   elementDeclaration,
   entityDeclaration,
   entityReference,
   notationDeclaration,
   space,
   xmlDeclaration,
} from '../../token';
import processingInstruction from '../../token/processingInstruction';

import PTokenStream from '../PTokenStream.js';

describe('PTokenStream (unit)', () => {
   let pTokenStream;

   beforeEach(() => {
      pTokenStream = new PTokenStream();
   });

   function gatherPTokens(pTokenStream, deliverResults) {
      const pTokens = [];

      pTokenStream.on('data', (pToken) => pTokens.push(pToken));
      pTokenStream.on('end', () => deliverResults(pTokens));
   }

   describe('construction', () => {

      it('passes the provided entity metadata to the underlying token source', () => {
         const entityMetaData = new EntityMetaData();

         const stream = new PTokenStream(entityMetaData);

         expect(stream._sTokenSource.metaData).toBe(entityMetaData);
      });

      it('uses the passed token source', () => {
         const entityMetaData = new EntityMetaData();
         const tokenSource = new STokenSource(defaultExtractors, entityMetaData);

         const stream = new PTokenStream(tokenSource);

         expect(stream._sTokenSource).toBe(tokenSource);
      });

   });

   describe('unusual read() situation', () => {

      it('ignores a second _read() if one is already in progress', () => {
         spyOn(pTokenStream, '_parseGeneral');
         pTokenStream.addText(']');
         pTokenStream.endText();

         pTokenStream._read();
         pTokenStream._read();

         expect(pTokenStream._parseGeneral.calls.count()).toEqual(1);
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

   it('calls attListDeclaration.parse()', (done) => {
      spyOn(attListDeclaration, 'parse').and.callThrough();
      pTokenStream.addText('<!ATTLIST something bar CDATA #REQUIRED>');
      pTokenStream.endText();

      gatherPTokens(pTokenStream, () => {
         expect(attListDeclaration.parse.calls.argsFor(0)[0]).toBeInstanceOf(STokenSource);
         expect(attListDeclaration.parse.calls.argsFor(0)[1].declType.str).toEqual('ATTLIST');
         expect(attListDeclaration.parse.calls.argsFor(0)[2]).toBeInstanceOf(Function);
         done();
      });
   });

   it('calls charRef.parse()', (done) => {
      spyOn(charRef, 'parse').and.callThrough();
      pTokenStream.addText('&#foo;');
      pTokenStream.endText();

      gatherPTokens(pTokenStream, () => {
         expect(charRef.parse.calls.argsFor(0)[0]).toBeInstanceOf(STokenSource);
         expect(charRef.parse.calls.argsFor(0)[1]).toBeInstanceOf(SToken);
         expect(charRef.parse.calls.argsFor(0)[2]).toBeInstanceOf(Function);
         done();
      });
   });

   it('calls charData.parse()', (done) => {
      spyOn(charData, 'parse').and.callThrough();
      pTokenStream.addText('asdf</foo>');
      pTokenStream.endText();

      gatherPTokens(pTokenStream, () => {
         expect(charData.parse.calls.argsFor(0)[0]).toBeInstanceOf(STokenSource);
         expect(charData.parse.calls.argsFor(0)[1]).toEqual([]);
         expect(charData.parse.calls.argsFor(0)[2]).toBeInstanceOf(Function);
         done();
      });
   });

   it('calls charData.parse() in the internal subset', (done) => {
      spyOn(charData, 'parse').and.callThrough();
      pTokenStream.addText('<!DOCTYPE foo [ asdf</foo>');
      pTokenStream.endText();

      gatherPTokens(pTokenStream, () => {
         expect(charData.parse.calls.argsFor(0)[0]).toBeInstanceOf(STokenSource);
         expect(charData.parse.calls.argsFor(0)[1]).toEqual([ '%' ]);
         expect(charData.parse.calls.argsFor(0)[2]).toBeInstanceOf(Function);
         done();
      });
   });

   it('calls comment.parse()', (done) => {
      spyOn(comment, 'parse').and.callThrough();
      pTokenStream.addText('<!--asdf-->');
      pTokenStream.endText();

      gatherPTokens(pTokenStream, () => {
         expect(comment.parse).toHaveBeenCalled();
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

   it('calls docTypeStart.parse()', (done) => {
      spyOn(docTypeStart, 'parse').and.callThrough();
      pTokenStream.addText('<!DOCTYPE theType>');
      pTokenStream.endText();

      gatherPTokens(pTokenStream, () => {
         expect(docTypeStart.parse.calls.argsFor(0)[0]).toBeInstanceOf(STokenSource);
         expect(docTypeStart.parse.calls.argsFor(0)[1].declType.str).toEqual('DOCTYPE');
         expect(docTypeStart.parse.calls.argsFor(0)[2]).toBeInstanceOf(Function);
         done();
      });
   });

   it('calls docTypeStart.parse() even when the declType is the wrong case', (done) => {
      spyOn(docTypeStart, 'parse').and.callThrough();
      pTokenStream.addText('<!docType theType>');
      pTokenStream.endText();

      gatherPTokens(pTokenStream, () => {
         expect(docTypeStart.parse.calls.argsFor(0)[0]).toBeInstanceOf(STokenSource);
         expect(docTypeStart.parse.calls.argsFor(0)[1].declType.str).toEqual('docType');
         expect(docTypeStart.parse.calls.argsFor(0)[2]).toBeInstanceOf(Function);
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

   it('calls elementDeclaration.parse()', (done) => {
      spyOn(elementDeclaration, 'parse').and.callThrough();
      pTokenStream.addText('<!ELEMENT something (one+)>');
      pTokenStream.endText();

      gatherPTokens(pTokenStream, () => {
         expect(elementDeclaration.parse.calls.argsFor(0)[0]).toBeInstanceOf(STokenSource);
         expect(elementDeclaration.parse.calls.argsFor(0)[1].declType.str).toEqual('ELEMENT');
         expect(elementDeclaration.parse.calls.argsFor(0)[2]).toBeInstanceOf(Function);
         done();
      });
   });

   it('calls entityDeclaration.parse()', (done) => {
      spyOn(entityDeclaration, 'parse').and.callThrough();
      pTokenStream.addText('<!ENTITY something "foo">');
      pTokenStream.endText();

      gatherPTokens(pTokenStream, () => {
         expect(entityDeclaration.parse.calls.argsFor(0)[0]).toBeInstanceOf(STokenSource);
         expect(entityDeclaration.parse.calls.argsFor(0)[1].declType.str).toEqual('ENTITY');
         expect(entityDeclaration.parse.calls.argsFor(0)[2]).toBeInstanceOf(Function);
         done();
      });
   });

   it('calls entityReference.parse()', (done) => {
      spyOn(entityReference, 'parse').and.callThrough();
      pTokenStream.addText('&foo;');
      pTokenStream.endText();

      gatherPTokens(pTokenStream, () => {
         expect(entityReference.parse.calls.argsFor(0)[0]).toBeInstanceOf(STokenSource);
         expect(entityReference.parse.calls.argsFor(0)[1]).toEqual(new SToken('&', '&', new Range(new EntityLocation(), 0, 0, 0, 1, 0, 1)));
         expect(entityReference.parse.calls.argsFor(0)[2]).toBeInstanceOf(Function);
         done();
      });
   });

   it('calls entityReference.paramParse()', (done) => {
      spyOn(entityReference, 'paramParse').and.callThrough();
      pTokenStream.addText('%foo;');
      pTokenStream.endText();

      gatherPTokens(pTokenStream, () => {
         expect(entityReference.paramParse.calls.argsFor(0)[0]).toBeInstanceOf(STokenSource);
         expect(entityReference.paramParse.calls.argsFor(0)[1]).toBeInstanceOf(Function);
         done();
      });
   });

   it('calls notationDeclaration.parse()', (done) => {
      spyOn(notationDeclaration, 'parse').and.callThrough();
      pTokenStream.addText('<!NOTATION something>');
      pTokenStream.endText();

      gatherPTokens(pTokenStream, () => {
         expect(notationDeclaration.parse.calls.argsFor(0)[0]).toBeInstanceOf(STokenSource);
         expect(notationDeclaration.parse.calls.argsFor(0)[1].declType.str).toEqual('NOTATION');
         expect(notationDeclaration.parse.calls.argsFor(0)[2]).toBeInstanceOf(Function);
         done();
      });
   });

   it('calls instruction.parse()', (done) => {
      spyOn(instruction, 'parse').and.callThrough();
      pTokenStream.addText('<?something foo?>');
      pTokenStream.endText();

      gatherPTokens(pTokenStream, () => {
         expect(instruction.parse.calls.argsFor(0)[0]).toBeInstanceOf(STokenSource);
         expect(instruction.parse.calls.argsFor(0)[1].str).toEqual('<?');
         expect(instruction.parse.calls.argsFor(0)[2]).toBeInstanceOf(Function);
         done();
      });
   });

   it('calls parseProcessingInstruction()', (done) => {
      spyOn(processingInstruction, 'parseProcessingInstruction').and.callThrough();
      pTokenStream.addText('<?something foo?>');
      pTokenStream.endText();

      gatherPTokens(pTokenStream, () => {
         expect(processingInstruction.parseProcessingInstruction.calls.argsFor(0)[0]).toBeInstanceOf(STokenSource);
         expect(processingInstruction.parseProcessingInstruction.calls.argsFor(0)[1].target.str).toEqual('something');
         expect(processingInstruction.parseProcessingInstruction.calls.argsFor(0)[2]).toBeInstanceOf(Function);
         done();
      });
   });

   it('calls processingInstruction.parse() when there is no target name', (done) => {
      spyOn(processingInstruction, 'parseProcessingInstruction').and.callThrough();
      pTokenStream.addText('<??>');
      pTokenStream.endText();

      gatherPTokens(pTokenStream, () => {
         expect(processingInstruction.parseProcessingInstruction.calls.argsFor(0)[0]).toBeInstanceOf(STokenSource);
         expect(processingInstruction.parseProcessingInstruction.calls.argsFor(0)[1].target).toBeUndefined();
         expect(processingInstruction.parseProcessingInstruction.calls.argsFor(0)[2]).toBeInstanceOf(Function);
         done();
      });
   });

   it('calls space.parse()', (done) => {
      spyOn(space, 'parse').and.callThrough();
      pTokenStream.addText('   x');
      pTokenStream.endText();

      gatherPTokens(pTokenStream, () => {
         expect(space.parse).toHaveBeenCalled();
         done();
      });
   });

   it('calls declaration.parse()', (done) => {
      spyOn(declaration, 'parse').and.callThrough();
      pTokenStream.addText('<!FOO >');
      pTokenStream.endText();

      gatherPTokens(pTokenStream, () => {
         expect(declaration.parse.calls.argsFor(0)[0]).toBeInstanceOf(STokenSource);
         expect(declaration.parse.calls.argsFor(0)[1].str).toEqual('<!');
         expect(declaration.parse.calls.argsFor(0)[2]).toBeInstanceOf(Function);
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

   it('calls envelope.parse()', (done) => {
      spyOn(envelope, 'parse').and.callThrough();;
      pTokenStream.addText('<![FOO [');
      pTokenStream.endText();

      gatherPTokens(pTokenStream, () => {
         expect(envelope.parse.calls.argsFor(0)[0]).toBeInstanceOf(STokenSource);
         expect(envelope.parse.calls.argsFor(0)[1].str).toEqual('<![');
         expect(envelope.parse.calls.argsFor(0)[2]).toBeInstanceOf(Function);
         done();
      });
   });

   it('returns the undefined envelope if none provided', (done) => {
      pTokenStream.addText('<![[');
      pTokenStream.endText();

      gatherPTokens(pTokenStream, (pTokens) => {
         // 0 is entitymetadata
         expect(pTokens[1].type).toEqual('UNKNOWNENVELOPE');
         done();
      });
   });

   it('calls cdata.parse()', (done) => {
      spyOn(cdata, 'parse').and.callThrough();
      pTokenStream.addText('<![CDATA[] something]]>');
      pTokenStream.endText();

      gatherPTokens(pTokenStream, () => {
         expect(cdata.parse.calls.argsFor(0)[0]).toBeInstanceOf(STokenSource);
         expect(cdata.parse.calls.argsFor(0)[1].envelopeType.str).toEqual('CDATA');
         expect(cdata.parse.calls.argsFor(0)[2]).toBeInstanceOf(Function);
         done();
      });
   });

   it('calls xmlDeclaration.parse()', (done) => {
      spyOn(xmlDeclaration, 'parse').and.callThrough();
      pTokenStream.addText('<?xml version="1.0"?>');
      pTokenStream.endText();

      gatherPTokens(pTokenStream, () => {
         expect(xmlDeclaration.parse.calls.argsFor(0)[0]).toBeInstanceOf(STokenSource);
         expect(xmlDeclaration.parse.calls.argsFor(0)[1].target.str).toEqual('xml');
         expect(xmlDeclaration.parse.calls.argsFor(0)[2]).toBeInstanceOf(Function);
         done();
      });
   });

   it('parses a single "]" as a charData', (done) => {
      pTokenStream.addText('<?xml version="1.0"?><one>]</one>');
      pTokenStream.endText();

      gatherPTokens(pTokenStream, (pTokens) => {
         // pTokens 0-2 are metadata, xmldecl, and "one" element open
         expect(pTokens[3].text.str).toEqual(']');
         done();
      });
   });

});
