/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityKind, EntityLocation, EntityMetaData, Range } from 'basic';
import { defaultExtractors } from 'extractor';

import SToken from '../SToken';
import STokenSource from '../STokenSource';

describe('STokenSource (integration)', () => {
   let source: STokenSource;
   let defaultLoc: EntityLocation;
   let entityMetaData1dot1;
   let sTokenSpy;

   beforeEach(() => {
      defaultLoc = new EntityLocation();
      entityMetaData1dot1 = new EntityMetaData(EntityKind.DOCUMENT, 1.1, 2, defaultLoc);
      sTokenSpy = jasmine.createSpy('sTokenSpy');

      source = new STokenSource(defaultExtractors, entityMetaData1dot1);
   });

   describe('extract("all")', () => {

      it('delivers all the text until the specified terminator', (done) => {
         source.addText('test of\nall\r\nextractor', new Range(defaultLoc));

         source.extract('all', [ 'or' ], (sToken) => {
            expect(sToken).toEqual(
               new SToken('test of\nall\nextract', 'test of\nall\r\nextract', new Range(defaultLoc, 0, 0, 0, 20, 2, 7)));
            done();
         });
      });

      it('all text to end if no terminators specified', (done) => {
         source.addText('o', new Range(defaultLoc));
         source.addText('ne');
         source.endText();

         source.extractNoParams('all', (sToken) => {
            expect(sToken).toEqual(new SToken('one', 'one', new Range(defaultLoc, 0, 0, 0, 3, 0, 3)));
            done();
         });
      });

      it('delivers no SToken if there are no characters', (done) => {
         source.extractNoParams('all', (sToken) => {
            expect(sToken).toBeUndefined();
            done();
         });
         source.endText();
      });

   });

   describe('extract("char")', () => {

      it('delivers the next character from a segment', (done) => {
         source.addText('b', new Range(defaultLoc));

         source.extractNoParams('char', (sToken) => {
            expect(sToken).toEqual(new SToken('b', 'b', new Range(defaultLoc, 0, 0, 0, 1, 0, 1)));
            done();
         });
      });

      it('delivers a newline from a CRLF across segments', (done) => {
         source.addText('\r', new Range(defaultLoc));
         source.addText('\nx');

         source.extractNoParams('char', (sToken) => {
            expect(sToken).toEqual(new SToken('\n', '\r\n', new Range(defaultLoc, 0, 0, 0, 2, 1, 0)));
            done();
         });
      });

      it('delivers no SToken if there are no characters', (done) => {
         source.extractNoParams('char', (sToken) => {
            expect(sToken).toBeUndefined();
            done();
         });
         source.endText();
      });

   });

   describe('extract("close")', () => {

      it('identifies ]]> as a close', (done) => {
         source.addText(']]>sdf', new Range(defaultLoc));

         source.extractNoParams('close', (sToken) => {
            expect(sToken).toEqual(new SToken(']]>', ']]>', new Range(defaultLoc, 0, 0, 0, 3, 0, 3)));
            done();
         });
      });

      it('identifies ]] as a close', (done) => {
         source.addText(']foo', new Range(defaultLoc));

         source.extractNoParams('close', (sToken) => {
            expect(sToken).toEqual(new SToken(']', ']', new Range(defaultLoc, 0, 0, 0, 1, 0, 1)));
            done();
         });
      });

   });

   describe('extract("digit")', () => {

      it('delivers the next digit from a segment', (done) => {
         source.addText('123x', new Range(defaultLoc));

         source.extractNoParams('digit', (sToken) => {
            expect(sToken).toEqual(new SToken('123', '123', new Range(defaultLoc, 0, 0, 0, 3, 0, 3)));
            done();
         });
      });

      it('delivers no SToken if there are no digits', (done) => {
         source.extractNoParams('digit', (sToken) => {
            expect(sToken).toBeUndefined();
            done();
         });
         source.endText();
      });

   });

   describe('extract("markup")', () => {

      it('delivers the next character from a segment', (done) => {
         source.addText('<foo', new Range(defaultLoc));

         source.extractNoParams('markup', (sToken) => {
            expect(sToken).toEqual(new SToken('<', '<', new Range(defaultLoc, 0, 0, 0, 1, 0, 1)));
            done();
         });
      });

      it('identifies <!-- as markup', (done) => {
         source.addText('<!--foo', new Range(defaultLoc));

         source.extractNoParams('markup', (sToken) => {
            expect(sToken).toEqual(new SToken('<!--', '<!--', new Range(defaultLoc, 0, 0, 0, 4, 0, 4)));
            done();
         });
      });

      it('identifies <! as markup', (done) => {
         source.addText('<!-foo', new Range(defaultLoc));

         source.extractNoParams('markup', (sToken) => {
            expect(sToken).toEqual(new SToken('<!', '<!', new Range(defaultLoc, 0, 0, 0, 2, 0, 2)));
            done();
         });
      });

      it('identifies <? as markup', (done) => {
         source.addText('<?-foo', new Range(defaultLoc));

         source.extractNoParams('markup', (sToken) => {
            expect(sToken).toEqual(new SToken('<?', '<?', new Range(defaultLoc, 0, 0, 0, 2, 0, 2)));
            done();
         });
      });

      it('identifies & as markup', (done) => {
         source.addText('&foo', new Range(defaultLoc));

         source.extractNoParams('markup', (sToken) => {
            expect(sToken).toEqual(new SToken('&', '&', new Range(defaultLoc, 0, 0, 0, 1, 0, 1)));
            done();
         });
      });

      it('identifies &# as markup', (done) => {
         source.addText('&#123', new Range(defaultLoc));

         source.extractNoParams('markup', (sToken) => {
            expect(sToken).toEqual(new SToken('&#', '&#', new Range(defaultLoc, 0, 0, 0, 2, 0, 2)));
            done();
         });
      });

      it('identifies </ as markup', (done) => {
         source.addText('</foo', new Range(defaultLoc));

         source.extractNoParams('markup', (sToken) => {
            expect(sToken).toEqual(new SToken('</', '</', new Range(defaultLoc, 0, 0, 0, 2, 0, 2)));
            done();
         });
      });

      it('delivers no SToken if the next chars do not form markup', (done) => {
         source.addText('foo', new Range(defaultLoc));

         source.extractNoParams('markup', (sToken) => {
            expect(sToken).toBeUndefined();
            done();
         });
      });

   });

   describe('extract("match")', () => {

      it('delivers the the matched text', (done) => {
         source.addText('frogs and toads', new Range(defaultLoc));

         source.extract('match', 'fro', (sToken) => {
            expect(sToken).toEqual(new SToken('fro', 'fro', new Range(defaultLoc, 0, 0, 0, 3, 0, 3)));
            done();
         });
      });

      it('delivers no SToken if there is no match', (done) => {
         source.addText('frogs and toads', new Range(defaultLoc));
         source.extract('match', 'gorilla', (sToken) => {
            expect(sToken).toBeUndefined();
            done();
         });
      });

      it('delivers no SToken if there is no content to match against', (done) => {
         source.endText();
         source.extract('match', 'gorilla', (sToken) => {
            expect(sToken).toBeUndefined();
            done();
         });
      });

   });

   describe('extract("peekChar")', () => {

      it('delivers the next character from a segment', (done) => {
         let first: SToken | void;
         source.addText('b', new Range(defaultLoc));

         source.extractNoParams('peekChar', (sToken) => first = sToken);
         source.extractNoParams('char', (sToken) => {
            const expected = new SToken('b', 'b', new Range(defaultLoc, 0, 0, 0, 1, 0, 1));
            expect(first).toEqual(expected);
            expect(sToken).toEqual(expected);
            done();
         });
      });

   });

   describe('extract("peekSpace")', () => {

      it('delivers the next character from a segment', (done) => {
         let first: SToken | void;
         source.addText(' \t', new Range(defaultLoc));
         source.endText();

         source.extractNoParams('peekSpace', (sToken) => first = sToken);
         source.extractNoParams('space', (sToken) => {
            const expected = new SToken(' \t', ' \t', new Range(defaultLoc, 0, 0, 0, 2, 0, 2));
            expect(first).toEqual(expected);
            expect(sToken).toEqual(expected);
            done();
         });
      });

   });

   describe('extract("space")', () => {

      it('delivers the a range of space characters', (done) => {
         source.addText(' \t\n\r\n\rx', new Range(defaultLoc));

         source.extractNoParams('space', (sToken) => {
            expect(sToken).toEqual(new SToken(' \t\n\n\n', ' \t\n\r\n\r', new Range(defaultLoc, 0, 0, 0, 6, 3, 0)));
            done();
         });
      });

      it('delivers the a range of space characters to end of input if needed', (done) => {
         source.addText(' \t\n\r\n\r', new Range(defaultLoc));
         source.endText();

         source.extractNoParams('space', (sToken) => {
            expect(sToken).toEqual(new SToken(' \t\n\n\n', ' \t\n\r\n\r', new Range(defaultLoc, 0, 0, 0, 6, 3, 0)));
            done();
         });
      });

      it('delivers no SToken if there is no space', (done) => {
         source.extractNoParams('space', (sToken) => {
            expect(sToken).toBeUndefined();
            done();
         });
         source.endText();
      });

   });

   describe('extract("word")', () => {

      it('delivers a word terminated by a whitespace', (done) => {
         source.addText('word1\nx', new Range(defaultLoc));

         source.extractNoParams('word', (sToken) => {
            expect(sToken).toEqual(new SToken('word1', 'word1', new Range(defaultLoc, 0, 0, 0, 5, 0, 5)));
            done();
         });
      });

      it('delivers no SToken if there are no characters', (done) => {
         source.extractNoParams('word', (sToken) => {
            expect(sToken).toBeUndefined();
            done();
         });
         source.endText();
      });

   });

});
