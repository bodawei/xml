/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from '../basic';
import { defaultExtractors, LTokenSource } from '../lToken';
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
} from '../xToken';

import ParsedStream from './ParsedStream.js';

describe('ParsedStream (unit)', () => {
   let parser;

   beforeEach(() => {
      parser = new ParsedStream();
   });

   describe('construction', () => {

      it('passes the provided entity metadata to the underlying token source', () => {
         const entityMetaData = new EntityMetaData();

         const stream = new ParsedStream(entityMetaData);

         expect(stream._lTokenSource.metaData).toBe(entityMetaData);
      });

      it('uses the passed token source', () => {
         const entityMetaData = new EntityMetaData();
         const tokenSource = new LTokenSource(defaultExtractors, entityMetaData);

         const stream = new ParsedStream(tokenSource);

         expect(stream._lTokenSource).toBe(tokenSource);
      });

   });

   describe('weird parse situation', () => {

      it('does not try to parse a close if encountering a "]" but no start was found', () => {
         spyOn(parser, '_parseClose');
         parser.addText(']');
         parser.read();

         expect(parser._parseClose).not.toHaveBeenCalled();
      });

   });

   it('calls charData.parse()', () => {
      spyOn(charData, 'parse');
      parser.addText('asdf</foo>');
      parser.endText();
      parser.read();

      expect(charData.parse.calls.argsFor(0)[0]).toBeInstanceOf(LTokenSource);
      expect(charData.parse.calls.argsFor(0)[1]).toEqual([]);
      expect(charData.parse.calls.argsFor(0)[2]).toBeInstanceOf(Function);
   });

   it('calls charData.parse() in the internal subset', () => {
      spyOn(charData, 'parse');
      parser.addText('<!DOCTYPE foo [ asdf</foo>');
      parser.endText();
      parser.read();
      parser.read();

      expect(charData.parse.calls.argsFor(0)[0]).toBeInstanceOf(LTokenSource);
      expect(charData.parse.calls.argsFor(0)[1]).toEqual([ '%' ]);
      expect(charData.parse.calls.argsFor(0)[2]).toBeInstanceOf(Function);
   });

   it('calls comment.parse()', () => {
      spyOn(comment, 'parse');
      parser.addText('<!--asdf-->');
      parser.endText();
      parser.read();

      expect(comment.parse).toHaveBeenCalled();
   });

   it('calls elementStart.parse()', () => {
      spyOn(elementStart, 'parse');
      parser.addText('<foo>');
      parser.endText();
      parser.read();

      expect(elementStart.parse).toHaveBeenCalled();
   });

   it('calls docTypeStart.parse()', () => {
      spyOn(docTypeStart, 'parse');
      parser.addText('<!DOCTYPE theType>');
      parser.endText();
      parser.read();

      expect(docTypeStart.parse.calls.argsFor(0)[0]).toBeInstanceOf(LTokenSource);
      expect(docTypeStart.parse.calls.argsFor(0)[1].declType.text).toEqual('DOCTYPE');
      expect(docTypeStart.parse.calls.argsFor(0)[2]).toBeInstanceOf(Function);
   });

   it('calls docTypeStart.parse() even when the declType is the wrong case', () => {
      spyOn(docTypeStart, 'parse');
      parser.addText('<!docType theType>');
      parser.endText();
      parser.read();

      expect(docTypeStart.parse.calls.argsFor(0)[0]).toBeInstanceOf(LTokenSource);
      expect(docTypeStart.parse.calls.argsFor(0)[1].declType.text).toEqual('docType');
      expect(docTypeStart.parse.calls.argsFor(0)[2]).toBeInstanceOf(Function);
   });

   it('calls elementEnd.parse()', () => {
      spyOn(elementEnd, 'parse');
      parser.addText('</foo>');
      parser.endText();
      parser.read();

      expect(elementEnd.parse).toHaveBeenCalled();
   });

   it('calls entityDeclaration.parse()', () => {
      spyOn(entityDeclaration, 'parse');
      parser.addText('<!ENTITY something "foo">');
      parser.endText();
      parser.read();

      expect(entityDeclaration.parse.calls.argsFor(0)[0]).toBeInstanceOf(LTokenSource);
      expect(entityDeclaration.parse.calls.argsFor(0)[1].declType.text).toEqual('ENTITY');
      expect(entityDeclaration.parse.calls.argsFor(0)[2]).toBeInstanceOf(Function);
   });

   it('calls entityReference.parse()', () => {
      spyOn(entityReference, 'parse');
      parser.addText('&foo;');
      parser.endText();
      parser.read();

      expect(entityReference.parse.calls.argsFor(0)[0]).toBeInstanceOf(LTokenSource);
      expect(entityReference.parse.calls.argsFor(0)[1]).toBeInstanceOf(Function);
   });

   it('calls entityReference.paramParse()', () => {
      spyOn(entityReference, 'paramParse');
      parser.addText('%foo;');
      parser.endText();
      parser.read();

      expect(entityReference.paramParse.calls.argsFor(0)[0]).toBeInstanceOf(LTokenSource);
      expect(entityReference.paramParse.calls.argsFor(0)[1]).toBeInstanceOf(Function);
   });

   it('calls notationDeclaration.parse()', () => {
      spyOn(notationDeclaration, 'parse');
      parser.addText('<!NOTATION something>');
      parser.endText();
      parser.read();

      expect(notationDeclaration.parse.calls.argsFor(0)[0]).toBeInstanceOf(LTokenSource);
      expect(notationDeclaration.parse.calls.argsFor(0)[1].declType.text).toEqual('NOTATION');
      expect(notationDeclaration.parse.calls.argsFor(0)[2]).toBeInstanceOf(Function);
   });

   it('calls instruction.parse()', () => {
      spyOn(instruction, 'parse');
      parser.addText('<?something foo?>');
      parser.endText();
      parser.read();

      expect(instruction.parse.calls.argsFor(0)[0]).toBeInstanceOf(LTokenSource);
      expect(instruction.parse.calls.argsFor(0)[1].text).toEqual('<?');
      expect(instruction.parse.calls.argsFor(0)[2]).toBeInstanceOf(Function);
   });

   it('calls processingInstruction.parse()', () => {
      spyOn(processingInstruction, 'parse');
      parser.addText('<?something foo?>');
      parser.endText();
      parser.read();

      expect(processingInstruction.parse.calls.argsFor(0)[0]).toBeInstanceOf(LTokenSource);
      expect(processingInstruction.parse.calls.argsFor(0)[1].target.text).toEqual('something');
      expect(processingInstruction.parse.calls.argsFor(0)[2]).toBeInstanceOf(Function);
   });

   it('calls processingInstruction.parse() when there is no target name', () => {
      spyOn(processingInstruction, 'parse');
      parser.addText('<??>');
      parser.endText();
      parser.read();

      expect(processingInstruction.parse.calls.argsFor(0)[0]).toBeInstanceOf(LTokenSource);
      expect(processingInstruction.parse.calls.argsFor(0)[1].target).toBeUndefined();
      expect(processingInstruction.parse.calls.argsFor(0)[2]).toBeInstanceOf(Function);
   });

   it('calls space.parse()', () => {
      spyOn(space, 'parse');
      parser.addText('   x');
      parser.endText();
      parser.read();

      expect(space.parse).toHaveBeenCalled();
   });

   it('calls declaration.parse()', () => {
      spyOn(declaration, 'parse');
      parser.addText('<!FOO >');
      parser.endText();
      parser.read();

      expect(declaration.parse.calls.argsFor(0)[0]).toBeInstanceOf(LTokenSource);
      expect(declaration.parse.calls.argsFor(0)[1].text).toEqual('<!');
      expect(declaration.parse.calls.argsFor(0)[2]).toBeInstanceOf(Function);
   });

   it('returns the undefined declaration if none provided', () => {
      parser.addText('<!');
      parser.endText();
      parser.read(); // ignore entity meta data
      const result = parser.read();

      expect(result.type).toEqual('UNKNOWNDECL');
   });

   it('calls envelope.parse()', () => {
      spyOn(envelope, 'parse');
      parser.addText('<![FOO [');
      parser.endText();
      parser.read();

      expect(envelope.parse.calls.argsFor(0)[0]).toBeInstanceOf(LTokenSource);
      expect(envelope.parse.calls.argsFor(0)[1].text).toEqual('<![');
      expect(envelope.parse.calls.argsFor(0)[2]).toBeInstanceOf(Function);
   });

   it('returns the undefined envelope if none provided', () => {
      parser.addText('<![[');
      parser.endText();
      parser.read(); // ignore entity meta data
      const result = parser.read();

      expect(result.type).toEqual('UNKNOWNENVELOPE');
   });

   it('calls cdata.parse()', () => {
      spyOn(cdata, 'parse');
      parser.addText('<![CDATA[] something]]>');
      parser.endText();
      parser.read();

      expect(cdata.parse.calls.argsFor(0)[0]).toBeInstanceOf(LTokenSource);
      expect(cdata.parse.calls.argsFor(0)[1].envelopeType.text).toEqual('CDATA');
      expect(cdata.parse.calls.argsFor(0)[2]).toBeInstanceOf(Function);
   });

   it('calls xmlDeclaration.parse()', () => {
      spyOn(xmlDeclaration, 'parse');
      parser.addText('<?xml version="1.0"?>');
      parser.endText();
      parser.read();

      expect(xmlDeclaration.parse.calls.argsFor(0)[0]).toBeInstanceOf(LTokenSource);
      expect(xmlDeclaration.parse.calls.argsFor(0)[1].target.text).toEqual('xml');
      expect(xmlDeclaration.parse.calls.argsFor(0)[2]).toBeInstanceOf(Function);
   });

});
