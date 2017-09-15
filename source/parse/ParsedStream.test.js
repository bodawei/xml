/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from '../basic';
import { defaultExtractors, LTokenSource } from '../lToken';
import {
   charData,
   elementEnd,
   elementStart,
   entityReference,
   instruction,
   processingInstruction,
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

      expect(charData.parse).toHaveBeenCalled();
   });

   it('calls elementStart.parse()', () => {
      spyOn(elementStart, 'parse');
      parser.addText('<foo>');
      parser.endText();
      parser.read();

      expect(elementStart.parse).toHaveBeenCalled();
   });

   it('calls elementEnd.parse()', () => {
      spyOn(elementEnd, 'parse');
      parser.addText('</foo>');
      parser.endText();
      parser.read();

      expect(elementEnd.parse).toHaveBeenCalled();
   });

   it('calls entityReference.parse()', () => {
      spyOn(entityReference, 'parse');
      parser.addText('&foo;');
      parser.endText();
      parser.read();

      expect(entityReference.parse.calls.argsFor(0)[0] instanceof LTokenSource).toEqual(true);
      expect(entityReference.parse.calls.argsFor(0)[1] instanceof Function).toEqual(true);
   });

   it('calls instruction.parse()', () => {
      spyOn(instruction, 'parse');
      parser.addText('<?something foo?>');
      parser.endText();
      parser.read();

      expect(instruction.parse.calls.argsFor(0)[0] instanceof LTokenSource).toEqual(true);
      expect(instruction.parse.calls.argsFor(0)[1].text).toEqual('<?');
      expect(instruction.parse.calls.argsFor(0)[2] instanceof Function).toEqual(true);
   });

   it('calls processingInstruction.parse()', () => {
      spyOn(processingInstruction, 'parse');
      parser.addText('<?something foo?>');
      parser.endText();
      parser.read();

      expect(processingInstruction.parse.calls.argsFor(0)[0] instanceof LTokenSource).toEqual(true);
      expect(processingInstruction.parse.calls.argsFor(0)[1].target.text).toEqual('something');
      expect(processingInstruction.parse.calls.argsFor(0)[2] instanceof Function).toEqual(true);
   });

   it('calls processingInstruction.parse() when there is no target name', () => {
      spyOn(processingInstruction, 'parse');
      parser.addText('<??>');
      parser.endText();
      parser.read();

      expect(processingInstruction.parse.calls.argsFor(0)[0] instanceof LTokenSource).toEqual(true);
      expect(processingInstruction.parse.calls.argsFor(0)[1].target).toBeUndefined();
      expect(processingInstruction.parse.calls.argsFor(0)[2] instanceof Function).toEqual(true);
   });

   it('calls xmlDeclaration.parse()', () => {
      spyOn(xmlDeclaration, 'parse');
      parser.addText('<?xml version="1.0"?>');
      parser.endText();
      parser.read();

      expect(xmlDeclaration.parse.calls.argsFor(0)[0] instanceof LTokenSource).toEqual(true);
      expect(xmlDeclaration.parse.calls.argsFor(0)[1].target.text).toEqual('xml');
      expect(xmlDeclaration.parse.calls.argsFor(0)[2] instanceof Function).toEqual(true);
   });

});
