/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation, EntityMetaData, Range } from '../basic';

import LToken from './LToken.js';
import LTokenSource from './LTokenSource.js';
import defaultExtractors from './defaultExtractors.js';

describe('LTokenSource (integration)', () => {
   let source;
   let defaultLoc;
   let entityMetaData1dot1;
   let lTokenSpy;

   beforeEach(() => {
      defaultLoc = new EntityLocation();
      entityMetaData1dot1 = new EntityMetaData(EntityMetaData.TYPE.DOCUMENT, 1.1, 2, defaultLoc);
      lTokenSpy = jasmine.createSpy('lTokenSpy');

      source = new LTokenSource(defaultExtractors, entityMetaData1dot1);
   });

   describe('extract("all")', () => {

      it('delivers all the text until the specified terminator', () => {
         source.addText('test of\nall\r\nextractor', new Range(defaultLoc));

         source.extract('all', [ 'or' ], lTokenSpy);

         expect(lTokenSpy).toHaveBeenCalledWith(
            new LToken('test of\nall\nextract', 'test of\nall\r\nextract', new Range(defaultLoc, 0, 0, 0, 20, 2, 7)));
      });

      it('all text to end if no terminators specified', () => {
         source.addText('o', new Range(defaultLoc));
         source.addText('ne');
         source.endText();

         source.extract('all', lTokenSpy);

         expect(lTokenSpy).toHaveBeenCalledWith(new LToken('one', 'one', new Range(defaultLoc, 0, 0, 0, 3, 0, 3)));
      });

      it('delivers no lToken if there are no characters', () => {
         source.extract('all', lTokenSpy);
         source.endText();

         expect(lTokenSpy).toHaveBeenCalledWith();
      });

   });

   describe('extract("char")', () => {

      it('delivers the next character from a segment', () => {
         source.addText('b', new Range(defaultLoc));

         source.extract('char', lTokenSpy);

         expect(lTokenSpy).toHaveBeenCalledWith(new LToken('b', 'b', new Range(defaultLoc, 0, 0, 0, 1, 0, 1)));
      });

      it('delivers a newline from a CRLF across segments', () => {
         source.addText('\r', new Range(defaultLoc));
         source.addText('\nx');

         source.extract('char', lTokenSpy);

         expect(lTokenSpy).toHaveBeenCalledWith(new LToken('\n', '\r\n', new Range(defaultLoc, 0, 0, 0, 2, 1, 0)));
      });

      it('delivers no lToken if there are no characters', () => {
         source.extract('char', lTokenSpy);
         source.endText();

         expect(lTokenSpy).toHaveBeenCalledWith();
      });

   });

   describe('extract("close")', () => {

      it('identifies ]]> as a close', () => {
         source.addText(']]>sdf', new Range(defaultLoc));

         source.extract('close', lTokenSpy);

         expect(lTokenSpy).toHaveBeenCalledWith(new LToken(']]>', ']]>', new Range(defaultLoc, 0, 0, 0, 3, 0, 3)));
      });

      it('identifies ]] as a close', () => {
         source.addText(']foo', new Range(defaultLoc));

         source.extract('close', lTokenSpy);

         expect(lTokenSpy).toHaveBeenCalledWith(new LToken(']', ']', new Range(defaultLoc, 0, 0, 0, 1, 0, 1)));
      });

   });

   describe('extract("digit")', () => {

      it('delivers the next digit from a segment', () => {
         source.addText('123x', new Range(defaultLoc));

         source.extract('digit', lTokenSpy);

         expect(lTokenSpy).toHaveBeenCalledWith(new LToken('123', '123', new Range(defaultLoc, 0, 0, 0, 3, 0, 3)));
      });

      it('delivers no lToken if there are no digits', () => {
         source.extract('digit', lTokenSpy);
         source.endText();

         expect(lTokenSpy).toHaveBeenCalledWith();
      });

   });

   describe('extract("markup")', () => {

      it('delivers the next character from a segment', () => {
         source.addText('<foo', new Range(defaultLoc));

         source.extract('markup', lTokenSpy);

         expect(lTokenSpy).toHaveBeenCalledWith(new LToken('<', '<', new Range(defaultLoc, 0, 0, 0, 1, 0, 1)));
      });

      it('identifies <!-- as markup', () => {
         source.addText('<!--foo', new Range(defaultLoc));

         source.extract('markup', lTokenSpy);

         expect(lTokenSpy).toHaveBeenCalledWith(new LToken('<!--', '<!--', new Range(defaultLoc, 0, 0, 0, 4, 0, 4)));
      });

      it('identifies <! as markup', () => {
         source.addText('<!-foo', new Range(defaultLoc));

         source.extract('markup', lTokenSpy);

         expect(lTokenSpy).toHaveBeenCalledWith(new LToken('<!', '<!', new Range(defaultLoc, 0, 0, 0, 2, 0, 2)));
      });

      it('identifies <? as markup', () => {
         source.addText('<?-foo', new Range(defaultLoc));

         source.extract('markup', lTokenSpy);

         expect(lTokenSpy).toHaveBeenCalledWith(new LToken('<?', '<?', new Range(defaultLoc, 0, 0, 0, 2, 0, 2)));
      });

      it('identifies & as markup', () => {
         source.addText('&foo', new Range(defaultLoc));

         source.extract('markup', lTokenSpy);

         expect(lTokenSpy).toHaveBeenCalledWith(new LToken('&', '&', new Range(defaultLoc, 0, 0, 0, 1, 0, 1)));
      });

      it('identifies </ as markup', () => {
         source.addText('</foo', new Range(defaultLoc));

         source.extract('markup', lTokenSpy);

         expect(lTokenSpy).toHaveBeenCalledWith(new LToken('</', '</', new Range(defaultLoc, 0, 0, 0, 2, 0, 2)));
      });

      it('delivers no lToken if the next chars do not form markup', () => {
         source.addText('foo', new Range(defaultLoc));

         source.extract('markup', lTokenSpy);

         expect(lTokenSpy).toHaveBeenCalledWith();
      });

   });

   describe('extract("match")', () => {

      it('delivers the the matched text', () => {
         source.addText('frogs and toads', new Range(defaultLoc));

         source.extract('match', 'fro', lTokenSpy);

         expect(lTokenSpy).toHaveBeenCalledWith(
            new LToken('fro', 'fro', new Range(defaultLoc, 0, 0, 0, 3, 0, 3)));
      });

      it('delivers no lToken if there is no match', () => {
         source.addText('frogs and toads', new Range(defaultLoc));
         source.extract('match', 'gorilla', lTokenSpy);

         expect(lTokenSpy).toHaveBeenCalledWith();
      });

      it('delivers no lToken if there is no content to match against', () => {
         source.endText();
         source.extract('match', 'gorilla', lTokenSpy);

         expect(lTokenSpy).toHaveBeenCalledWith();
      });

   });

   describe('extract("peekChar")', () => {

      it('delivers the next character from a segment', () => {
         source.addText('b', new Range(defaultLoc));

         source.extract('peekChar', lTokenSpy);
         source.extract('char', lTokenSpy);

         expect(lTokenSpy.calls.argsFor(0)[0]).toEqual(new LToken('b', 'b', new Range(defaultLoc, 0, 0, 0, 1, 0, 1)));
         expect(lTokenSpy.calls.argsFor(1)[0]).toEqual(new LToken('b', 'b', new Range(defaultLoc, 0, 0, 0, 1, 0, 1)));
      });

   });

   describe('extract("peekSpace")', () => {

      it('delivers the next character from a segment', () => {
         source.addText(' \t', new Range(defaultLoc));
         source.endText();

         source.extract('peekSpace', lTokenSpy);
         source.extract('space', lTokenSpy);

         expect(lTokenSpy.calls.argsFor(0)[0]).toEqual(new LToken(' \t', ' \t',
            new Range(defaultLoc, 0, 0, 0, 2, 0, 2)));
         expect(lTokenSpy.calls.argsFor(1)[0]).toEqual(new LToken(' \t', ' \t',
            new Range(defaultLoc, 0, 0, 0, 2, 0, 2)));
      });

   });

   describe('extract("space")', () => {

      it('delivers the a range of space characters', () => {
         source.addText(' \t\n\r\n\rx', new Range(defaultLoc));

         source.extract('space', lTokenSpy);

         expect(lTokenSpy).toHaveBeenCalledWith(
            new LToken(' \t\n\n\n', ' \t\n\r\n\r', new Range(defaultLoc, 0, 0, 0, 6, 3, 0)));
      });

      it('delivers the a range of space characters to end of input if needed', () => {
         source.addText(' \t\n\r\n\r', new Range(defaultLoc));
         source.endText();

         source.extract('space', lTokenSpy);

         expect(lTokenSpy).toHaveBeenCalledWith(
            new LToken(' \t\n\n\n', ' \t\n\r\n\r', new Range(defaultLoc, 0, 0, 0, 6, 3, 0)));
      });

      it('delivers no lToken if there is no space', () => {
         source.extract('space', lTokenSpy);
         source.endText();

         expect(lTokenSpy).toHaveBeenCalledWith();
      });

   });

   describe('extract("word")', () => {

      it('delivers a word terminated by a whitespace', () => {
         source.addText('word1\nx', new Range(defaultLoc));

         source.extract('word', lTokenSpy);

         expect(lTokenSpy).toHaveBeenCalledWith(new LToken('word1', 'word1', new Range(defaultLoc, 0, 0, 0, 5, 0, 5)));
      });

      it('delivers no lToken if there are no characters', () => {
         source.extract('word', lTokenSpy);
         source.endText();

         expect(lTokenSpy).toHaveBeenCalledWith();
      });

   });

});
