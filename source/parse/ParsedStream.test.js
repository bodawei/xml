/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from '../basic';
import {
   charData,
   elementEnd,
   elementStart,
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

   });

   describe('weird parse situation', () => {

      it('does not try to parse a close if encountering a "]" but no start was found', () => {
         spyOn(parser, '_parseClose');
         parser.addText(']');
         parser.read();

         expect(parser._parseClose).not.toHaveBeenCalled();
      });

   });

   describe('element start', () => {

      it('calls elementStart.parse()', () => {
         spyOn(elementStart, 'parse');
         parser.addText('<foo>');
         parser.endText();
         parser.read();

         expect(elementStart.parse).toHaveBeenCalled();
      });

   });

   describe('element end', () => {

      it('calls elementEnd.parse()', () => {
         spyOn(elementEnd, 'parse');
         parser.addText('</foo>');
         parser.endText();
         parser.read();

         expect(elementEnd.parse).toHaveBeenCalled();
      });

   });

   describe('charData', () => {

      it('calls charData.parse()', () => {
         spyOn(charData, 'parse');
         parser.addText('asdf</foo>');
         parser.endText();
         parser.read();

         expect(charData.parse).toHaveBeenCalled();
      });

   });

});
