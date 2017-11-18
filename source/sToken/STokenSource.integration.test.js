/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation, EntityMetaData, Range } from '../basic';

import SToken from './SToken.js';
import STokenSource from './STokenSource.js';
import { defaultExtractors } from '../extractor';

describe('STokenSource (integration)', () => {
   let source;
   let defaultLoc;
   let entityMetaData1dot1;
   let sTokenSpy;

   beforeEach(() => {
      defaultLoc = new EntityLocation();
      entityMetaData1dot1 = new EntityMetaData(EntityMetaData.PTYPE.DOCUMENT, 1.1, 2, defaultLoc);
      sTokenSpy = jasmine.createSpy('sTokenSpy');

      source = new STokenSource(defaultExtractors, entityMetaData1dot1);
   });

   describe('extract("all")', () => {

      it('delivers all the text until the specified terminator', () => {
         source.addText('test of\nall\r\nextractor', new Range(defaultLoc));

         source.extract('all', [ 'or' ], sTokenSpy);

         expect(sTokenSpy).toHaveBeenCalledWith(
            new SToken('test of\nall\nextract', 'test of\nall\r\nextract', new Range(defaultLoc, 0, 0, 0, 20, 2, 7)));
      });

      it('all text to end if no terminators specified', () => {
         source.addText('o', new Range(defaultLoc));
         source.addText('ne');
         source.endText();

         source.extract('all', sTokenSpy);

         expect(sTokenSpy).toHaveBeenCalledWith(new SToken('one', 'one', new Range(defaultLoc, 0, 0, 0, 3, 0, 3)));
      });

      it('delivers no SToken if there are no characters', () => {
         source.extract('all', sTokenSpy);
         source.endText();

         expect(sTokenSpy).toHaveBeenCalledWith();
      });

   });

   describe('extract("char")', () => {

      it('delivers the next character from a segment', () => {
         source.addText('b', new Range(defaultLoc));

         source.extract('char', sTokenSpy);

         expect(sTokenSpy).toHaveBeenCalledWith(new SToken('b', 'b', new Range(defaultLoc, 0, 0, 0, 1, 0, 1)));
      });

      it('delivers a newline from a CRLF across segments', () => {
         source.addText('\r', new Range(defaultLoc));
         source.addText('\nx');

         source.extract('char', sTokenSpy);

         expect(sTokenSpy).toHaveBeenCalledWith(new SToken('\n', '\r\n', new Range(defaultLoc, 0, 0, 0, 2, 1, 0)));
      });

      it('delivers no SToken if there are no characters', () => {
         source.extract('char', sTokenSpy);
         source.endText();

         expect(sTokenSpy).toHaveBeenCalledWith();
      });

   });

   describe('extract("close")', () => {

      it('identifies ]]> as a close', () => {
         source.addText(']]>sdf', new Range(defaultLoc));

         source.extract('close', sTokenSpy);

         expect(sTokenSpy).toHaveBeenCalledWith(new SToken(']]>', ']]>', new Range(defaultLoc, 0, 0, 0, 3, 0, 3)));
      });

      it('identifies ]] as a close', () => {
         source.addText(']foo', new Range(defaultLoc));

         source.extract('close', sTokenSpy);

         expect(sTokenSpy).toHaveBeenCalledWith(new SToken(']', ']', new Range(defaultLoc, 0, 0, 0, 1, 0, 1)));
      });

   });

   describe('extract("digit")', () => {

      it('delivers the next digit from a segment', () => {
         source.addText('123x', new Range(defaultLoc));

         source.extract('digit', sTokenSpy);

         expect(sTokenSpy).toHaveBeenCalledWith(new SToken('123', '123', new Range(defaultLoc, 0, 0, 0, 3, 0, 3)));
      });

      it('delivers no SToken if there are no digits', () => {
         source.extract('digit', sTokenSpy);
         source.endText();

         expect(sTokenSpy).toHaveBeenCalledWith();
      });

   });

   describe('extract("markup")', () => {

      it('delivers the next character from a segment', () => {
         source.addText('<foo', new Range(defaultLoc));

         source.extract('markup', sTokenSpy);

         expect(sTokenSpy).toHaveBeenCalledWith(new SToken('<', '<', new Range(defaultLoc, 0, 0, 0, 1, 0, 1)));
      });

      it('identifies <!-- as markup', () => {
         source.addText('<!--foo', new Range(defaultLoc));

         source.extract('markup', sTokenSpy);

         expect(sTokenSpy).toHaveBeenCalledWith(new SToken('<!--', '<!--', new Range(defaultLoc, 0, 0, 0, 4, 0, 4)));
      });

      it('identifies <! as markup', () => {
         source.addText('<!-foo', new Range(defaultLoc));

         source.extract('markup', sTokenSpy);

         expect(sTokenSpy).toHaveBeenCalledWith(new SToken('<!', '<!', new Range(defaultLoc, 0, 0, 0, 2, 0, 2)));
      });

      it('identifies <? as markup', () => {
         source.addText('<?-foo', new Range(defaultLoc));

         source.extract('markup', sTokenSpy);

         expect(sTokenSpy).toHaveBeenCalledWith(new SToken('<?', '<?', new Range(defaultLoc, 0, 0, 0, 2, 0, 2)));
      });

      it('identifies & as markup', () => {
         source.addText('&foo', new Range(defaultLoc));

         source.extract('markup', sTokenSpy);

         expect(sTokenSpy).toHaveBeenCalledWith(new SToken('&', '&', new Range(defaultLoc, 0, 0, 0, 1, 0, 1)));
      });

      it('identifies </ as markup', () => {
         source.addText('</foo', new Range(defaultLoc));

         source.extract('markup', sTokenSpy);

         expect(sTokenSpy).toHaveBeenCalledWith(new SToken('</', '</', new Range(defaultLoc, 0, 0, 0, 2, 0, 2)));
      });

      it('delivers no SToken if the next chars do not form markup', () => {
         source.addText('foo', new Range(defaultLoc));

         source.extract('markup', sTokenSpy);

         expect(sTokenSpy).toHaveBeenCalledWith();
      });

   });

   describe('extract("match")', () => {

      it('delivers the the matched text', () => {
         source.addText('frogs and toads', new Range(defaultLoc));

         source.extract('match', 'fro', sTokenSpy);

         expect(sTokenSpy).toHaveBeenCalledWith(
            new SToken('fro', 'fro', new Range(defaultLoc, 0, 0, 0, 3, 0, 3)));
      });

      it('delivers no SToken if there is no match', () => {
         source.addText('frogs and toads', new Range(defaultLoc));
         source.extract('match', 'gorilla', sTokenSpy);

         expect(sTokenSpy).toHaveBeenCalledWith();
      });

      it('delivers no SToken if there is no content to match against', () => {
         source.endText();
         source.extract('match', 'gorilla', sTokenSpy);

         expect(sTokenSpy).toHaveBeenCalledWith();
      });

   });

   describe('extract("peekChar")', () => {

      it('delivers the next character from a segment', () => {
         source.addText('b', new Range(defaultLoc));

         source.extract('peekChar', sTokenSpy);
         source.extract('char', sTokenSpy);

         expect(sTokenSpy.calls.argsFor(0)[0]).toEqual(new SToken('b', 'b', new Range(defaultLoc, 0, 0, 0, 1, 0, 1)));
         expect(sTokenSpy.calls.argsFor(1)[0]).toEqual(new SToken('b', 'b', new Range(defaultLoc, 0, 0, 0, 1, 0, 1)));
      });

   });

   describe('extract("peekSpace")', () => {

      it('delivers the next character from a segment', () => {
         source.addText(' \t', new Range(defaultLoc));
         source.endText();

         source.extract('peekSpace', sTokenSpy);
         source.extract('space', sTokenSpy);

         expect(sTokenSpy.calls.argsFor(0)[0]).toEqual(new SToken(' \t', ' \t',
            new Range(defaultLoc, 0, 0, 0, 2, 0, 2)));
         expect(sTokenSpy.calls.argsFor(1)[0]).toEqual(new SToken(' \t', ' \t',
            new Range(defaultLoc, 0, 0, 0, 2, 0, 2)));
      });

   });

   describe('extract("space")', () => {

      it('delivers the a range of space characters', () => {
         source.addText(' \t\n\r\n\rx', new Range(defaultLoc));

         source.extract('space', sTokenSpy);

         expect(sTokenSpy).toHaveBeenCalledWith(
            new SToken(' \t\n\n\n', ' \t\n\r\n\r', new Range(defaultLoc, 0, 0, 0, 6, 3, 0)));
      });

      it('delivers the a range of space characters to end of input if needed', () => {
         source.addText(' \t\n\r\n\r', new Range(defaultLoc));
         source.endText();

         source.extract('space', sTokenSpy);

         expect(sTokenSpy).toHaveBeenCalledWith(
            new SToken(' \t\n\n\n', ' \t\n\r\n\r', new Range(defaultLoc, 0, 0, 0, 6, 3, 0)));
      });

      it('delivers no SToken if there is no space', () => {
         source.extract('space', sTokenSpy);
         source.endText();

         expect(sTokenSpy).toHaveBeenCalledWith();
      });

   });

   describe('extract("word")', () => {

      it('delivers a word terminated by a whitespace', () => {
         source.addText('word1\nx', new Range(defaultLoc));

         source.extract('word', sTokenSpy);

         expect(sTokenSpy).toHaveBeenCalledWith(new SToken('word1', 'word1', new Range(defaultLoc, 0, 0, 0, 5, 0, 5)));
      });

      it('delivers no SToken if there are no characters', () => {
         source.extract('word', sTokenSpy);
         source.endText();

         expect(sTokenSpy).toHaveBeenCalledWith();
      });

   });

});
