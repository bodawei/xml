/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from '../basic';
import { defaultExtractors } from '../extractor';
import { STokenSource } from '../sToken';
import {
   declaration,
   envelope,
   instruction,

   cdata,
   charData,
   comment,
   docTypeStart,
   elementEnd,
   elementStart,
   entityDeclaration,
   entityReference,
   notationDeclaration,
   processingInstruction,
   space,
   xmlDeclaration,
} from '../token';

import PTokenStream from './PTokenStream.js';

describe('PTokenStream (unit)', () => {
   let pTokenStream;

   beforeEach(() => {
      pTokenStream = new PTokenStream();
   });

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

   describe('weird parse situation', () => {

      it('does not try to parse a close if encountering a "]" but no start was found', () => {
         spyOn(pTokenStream, '_parseClose');
         pTokenStream.addText(']');
         pTokenStream.read();

         expect(pTokenStream._parseClose).not.toHaveBeenCalled();
      });

   });

   it('calls charData.parse()', () => {
      spyOn(charData, 'parse');
      pTokenStream.addText('asdf</foo>');
      pTokenStream.endText();
      pTokenStream.read();

      expect(charData.parse.calls.argsFor(0)[0]).toBeInstanceOf(STokenSource);
      expect(charData.parse.calls.argsFor(0)[1]).toEqual([]);
      expect(charData.parse.calls.argsFor(0)[2]).toBeInstanceOf(Function);
   });

   it('calls charData.parse() in the internal subset', () => {
      spyOn(charData, 'parse');
      pTokenStream.addText('<!DOCTYPE foo [ asdf</foo>');
      pTokenStream.endText();
      pTokenStream.read();
      pTokenStream.read();

      expect(charData.parse.calls.argsFor(0)[0]).toBeInstanceOf(STokenSource);
      expect(charData.parse.calls.argsFor(0)[1]).toEqual([ '%' ]);
      expect(charData.parse.calls.argsFor(0)[2]).toBeInstanceOf(Function);
   });

   it('calls comment.parse()', () => {
      spyOn(comment, 'parse');
      pTokenStream.addText('<!--asdf-->');
      pTokenStream.endText();
      pTokenStream.read();

      expect(comment.parse).toHaveBeenCalled();
   });

   it('calls elementStart.parse()', () => {
      spyOn(elementStart, 'parse');
      pTokenStream.addText('<foo>');
      pTokenStream.endText();
      pTokenStream.read();

      expect(elementStart.parse).toHaveBeenCalled();
   });

   it('calls docTypeStart.parse()', () => {
      spyOn(docTypeStart, 'parse');
      pTokenStream.addText('<!DOCTYPE theType>');
      pTokenStream.endText();
      pTokenStream.read();

      expect(docTypeStart.parse.calls.argsFor(0)[0]).toBeInstanceOf(STokenSource);
      expect(docTypeStart.parse.calls.argsFor(0)[1].declType.text).toEqual('DOCTYPE');
      expect(docTypeStart.parse.calls.argsFor(0)[2]).toBeInstanceOf(Function);
   });

   it('calls docTypeStart.parse() even when the declType is the wrong case', () => {
      spyOn(docTypeStart, 'parse');
      pTokenStream.addText('<!docType theType>');
      pTokenStream.endText();
      pTokenStream.read();

      expect(docTypeStart.parse.calls.argsFor(0)[0]).toBeInstanceOf(STokenSource);
      expect(docTypeStart.parse.calls.argsFor(0)[1].declType.text).toEqual('docType');
      expect(docTypeStart.parse.calls.argsFor(0)[2]).toBeInstanceOf(Function);
   });

   it('calls elementEnd.parse()', () => {
      spyOn(elementEnd, 'parse');
      pTokenStream.addText('</foo>');
      pTokenStream.endText();
      pTokenStream.read();

      expect(elementEnd.parse).toHaveBeenCalled();
   });

   it('calls entityDeclaration.parse()', () => {
      spyOn(entityDeclaration, 'parse');
      pTokenStream.addText('<!ENTITY something "foo">');
      pTokenStream.endText();
      pTokenStream.read();

      expect(entityDeclaration.parse.calls.argsFor(0)[0]).toBeInstanceOf(STokenSource);
      expect(entityDeclaration.parse.calls.argsFor(0)[1].declType.text).toEqual('ENTITY');
      expect(entityDeclaration.parse.calls.argsFor(0)[2]).toBeInstanceOf(Function);
   });

   it('calls entityReference.parse()', () => {
      spyOn(entityReference, 'parse');
      pTokenStream.addText('&foo;');
      pTokenStream.endText();
      pTokenStream.read();

      expect(entityReference.parse.calls.argsFor(0)[0]).toBeInstanceOf(STokenSource);
      expect(entityReference.parse.calls.argsFor(0)[1]).toBeInstanceOf(Function);
   });

   it('calls entityReference.paramParse()', () => {
      spyOn(entityReference, 'paramParse');
      pTokenStream.addText('%foo;');
      pTokenStream.endText();
      pTokenStream.read();

      expect(entityReference.paramParse.calls.argsFor(0)[0]).toBeInstanceOf(STokenSource);
      expect(entityReference.paramParse.calls.argsFor(0)[1]).toBeInstanceOf(Function);
   });

   it('calls notationDeclaration.parse()', () => {
      spyOn(notationDeclaration, 'parse');
      pTokenStream.addText('<!NOTATION something>');
      pTokenStream.endText();
      pTokenStream.read();

      expect(notationDeclaration.parse.calls.argsFor(0)[0]).toBeInstanceOf(STokenSource);
      expect(notationDeclaration.parse.calls.argsFor(0)[1].declType.text).toEqual('NOTATION');
      expect(notationDeclaration.parse.calls.argsFor(0)[2]).toBeInstanceOf(Function);
   });

   it('calls instruction.parse()', () => {
      spyOn(instruction, 'parse');
      pTokenStream.addText('<?something foo?>');
      pTokenStream.endText();
      pTokenStream.read();

      expect(instruction.parse.calls.argsFor(0)[0]).toBeInstanceOf(STokenSource);
      expect(instruction.parse.calls.argsFor(0)[1].text).toEqual('<?');
      expect(instruction.parse.calls.argsFor(0)[2]).toBeInstanceOf(Function);
   });

   it('calls processingInstruction.parse()', () => {
      spyOn(processingInstruction, 'parse');
      pTokenStream.addText('<?something foo?>');
      pTokenStream.endText();
      pTokenStream.read();

      expect(processingInstruction.parse.calls.argsFor(0)[0]).toBeInstanceOf(STokenSource);
      expect(processingInstruction.parse.calls.argsFor(0)[1].target.text).toEqual('something');
      expect(processingInstruction.parse.calls.argsFor(0)[2]).toBeInstanceOf(Function);
   });

   it('calls processingInstruction.parse() when there is no target name', () => {
      spyOn(processingInstruction, 'parse');
      pTokenStream.addText('<??>');
      pTokenStream.endText();
      pTokenStream.read();

      expect(processingInstruction.parse.calls.argsFor(0)[0]).toBeInstanceOf(STokenSource);
      expect(processingInstruction.parse.calls.argsFor(0)[1].target).toBeUndefined();
      expect(processingInstruction.parse.calls.argsFor(0)[2]).toBeInstanceOf(Function);
   });

   it('calls space.parse()', () => {
      spyOn(space, 'parse');
      pTokenStream.addText('   x');
      pTokenStream.endText();
      pTokenStream.read();

      expect(space.parse).toHaveBeenCalled();
   });

   it('calls declaration.parse()', () => {
      spyOn(declaration, 'parse');
      pTokenStream.addText('<!FOO >');
      pTokenStream.endText();
      pTokenStream.read();

      expect(declaration.parse.calls.argsFor(0)[0]).toBeInstanceOf(STokenSource);
      expect(declaration.parse.calls.argsFor(0)[1].text).toEqual('<!');
      expect(declaration.parse.calls.argsFor(0)[2]).toBeInstanceOf(Function);
   });

   it('returns the undefined declaration if none provided', () => {
      pTokenStream.addText('<!');
      pTokenStream.endText();
      pTokenStream.read(); // ignore entity meta data
      const result = pTokenStream.read();

      expect(result.type).toEqual('UNKNOWNDECL');
   });

   it('calls envelope.parse()', () => {
      spyOn(envelope, 'parse');
      pTokenStream.addText('<![FOO [');
      pTokenStream.endText();
      pTokenStream.read();

      expect(envelope.parse.calls.argsFor(0)[0]).toBeInstanceOf(STokenSource);
      expect(envelope.parse.calls.argsFor(0)[1].text).toEqual('<![');
      expect(envelope.parse.calls.argsFor(0)[2]).toBeInstanceOf(Function);
   });

   it('returns the undefined envelope if none provided', () => {
      pTokenStream.addText('<![[');
      pTokenStream.endText();
      pTokenStream.read(); // ignore entity meta data
      const result = pTokenStream.read();

      expect(result.type).toEqual('UNKNOWNENVELOPE');
   });

   it('calls cdata.parse()', () => {
      spyOn(cdata, 'parse');
      pTokenStream.addText('<![CDATA[] something]]>');
      pTokenStream.endText();
      pTokenStream.read();

      expect(cdata.parse.calls.argsFor(0)[0]).toBeInstanceOf(STokenSource);
      expect(cdata.parse.calls.argsFor(0)[1].envelopeType.text).toEqual('CDATA');
      expect(cdata.parse.calls.argsFor(0)[2]).toBeInstanceOf(Function);
   });

   it('calls xmlDeclaration.parse()', () => {
      spyOn(xmlDeclaration, 'parse');
      pTokenStream.addText('<?xml version="1.0"?>');
      pTokenStream.endText();
      pTokenStream.read();

      expect(xmlDeclaration.parse.calls.argsFor(0)[0]).toBeInstanceOf(STokenSource);
      expect(xmlDeclaration.parse.calls.argsFor(0)[1].target.text).toEqual('xml');
      expect(xmlDeclaration.parse.calls.argsFor(0)[2]).toBeInstanceOf(Function);
   });

   it('parses a single "]" as a charData', () => {
      pTokenStream.addText('<?xml version="1.0"?><one>]</one>');
      pTokenStream.endText();
      pTokenStream.read(); // metadata
      pTokenStream.read(); // xml declaration
      pTokenStream.read(); // "one" element open
      const result = pTokenStream.read();

      expect(result.text.text).toEqual(']');
   });

});
