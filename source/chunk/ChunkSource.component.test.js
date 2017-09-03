/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

/* eslint-env jasmine */

const EntityLocation = require('../basic/EntityLocation.js');
const EntityMetaData = require('../basic/EntityMetaData.js');
const Range = require('../basic/Range.js');

const Chunk = require('./Chunk.js');
const ChunkSource = require('./ChunkSource.js');
const defaultExtractors = require('./defaultExtractors.js');

describe('ChunkSource (integration)', () => {
   let source;
   let defaultLoc;
   let entityMetaData1dot1;
   let chunkSpy;

   beforeEach(() => {
      defaultLoc = new EntityLocation();
      entityMetaData1dot1 = new EntityMetaData(EntityMetaData.TYPE.DOCUMENT, 1.1, 2, defaultLoc);
      chunkSpy = jasmine.createSpy('chunkSpy');

      source = new ChunkSource(defaultExtractors, entityMetaData1dot1);
   });

   describe('extract("all")', () => {

      it('delivers all the text until the specified terminator', () => {
         source.addText('test of\nall\r\nextractor', new Range(defaultLoc));

         source.extract('all', [ 'or' ], chunkSpy);

         expect(chunkSpy).toHaveBeenCalledWith(
            new Chunk('test of\nall\nextract', 'test of\nall\r\nextract', new Range(defaultLoc, 0, 0, 0, 20, 2, 7)));
      });

      it('all text to end if no terminators specified', () => {
         source.addText('o', new Range(defaultLoc));
         source.addText('ne');
         source.endText();

         source.extract('all', chunkSpy);

         expect(chunkSpy).toHaveBeenCalledWith(new Chunk('one', 'one', new Range(defaultLoc, 0, 0, 0, 3, 0, 3)));
      });

      it('delivers no chunk if there are no characters', () => {
         source.extract('all', chunkSpy);
         source.endText();

         expect(chunkSpy).toHaveBeenCalledWith();
      });

   });

   describe('extract("char")', () => {

      it('delivers the next character from a segment', () => {
         source.addText('b', new Range(defaultLoc));

         source.extract('char', chunkSpy);

         expect(chunkSpy).toHaveBeenCalledWith(new Chunk('b', 'b', new Range(defaultLoc, 0, 0, 0, 1, 0, 1)));
      });

      it('delivers a newline from a CRLF across segments', () => {
         source.addText('\r', new Range(defaultLoc));
         source.addText('\nx');

         source.extract('char', chunkSpy);

         expect(chunkSpy).toHaveBeenCalledWith(new Chunk('\n', '\r\n', new Range(defaultLoc, 0, 0, 0, 2, 1, 0)));
      });

      it('delivers no chunk if there are no characters', () => {
         source.extract('char', chunkSpy);
         source.endText();

         expect(chunkSpy).toHaveBeenCalledWith();
      });

   });

   describe('extract("close")', () => {

      it('identifies ]]> as a close', () => {
         source.addText(']]>sdf', new Range(defaultLoc));

         source.extract('close', chunkSpy);

         expect(chunkSpy).toHaveBeenCalledWith(new Chunk(']]>', ']]>', new Range(defaultLoc, 0, 0, 0, 3, 0, 3)));
      });

      it('identifies ]] as a close', () => {
         source.addText(']foo', new Range(defaultLoc));

         source.extract('close', chunkSpy);

         expect(chunkSpy).toHaveBeenCalledWith(new Chunk(']', ']', new Range(defaultLoc, 0, 0, 0, 1, 0, 1)));
      });

   });

   describe('extract("digit")', () => {

      it('delivers the next digit from a segment', () => {
         source.addText('123x', new Range(defaultLoc));

         source.extract('digit', chunkSpy);

         expect(chunkSpy).toHaveBeenCalledWith(new Chunk('123', '123', new Range(defaultLoc, 0, 0, 0, 3, 0, 3)));
      });

      it('delivers no chunk if there are no digits', () => {
         source.extract('digit', chunkSpy);
         source.endText();

         expect(chunkSpy).toHaveBeenCalledWith();
      });

   });

   describe('extract("markup")', () => {

      it('delivers the next character from a segment', () => {
         source.addText('<foo', new Range(defaultLoc));

         source.extract('markup', chunkSpy);

         expect(chunkSpy).toHaveBeenCalledWith(new Chunk('<', '<', new Range(defaultLoc, 0, 0, 0, 1, 0, 1)));
      });

      it('identifies <!-- as markup', () => {
         source.addText('<!--foo', new Range(defaultLoc));

         source.extract('markup', chunkSpy);

         expect(chunkSpy).toHaveBeenCalledWith(new Chunk('<!--', '<!--', new Range(defaultLoc, 0, 0, 0, 4, 0, 4)));
      });

      it('identifies <! as markup', () => {
         source.addText('<!-foo', new Range(defaultLoc));

         source.extract('markup', chunkSpy);

         expect(chunkSpy).toHaveBeenCalledWith(new Chunk('<!', '<!', new Range(defaultLoc, 0, 0, 0, 2, 0, 2)));
      });

      it('identifies <? as markup', () => {
         source.addText('<?-foo', new Range(defaultLoc));

         source.extract('markup', chunkSpy);

         expect(chunkSpy).toHaveBeenCalledWith(new Chunk('<?', '<?', new Range(defaultLoc, 0, 0, 0, 2, 0, 2)));
      });

      it('identifies & as markup', () => {
         source.addText('&foo', new Range(defaultLoc));

         source.extract('markup', chunkSpy);

         expect(chunkSpy).toHaveBeenCalledWith(new Chunk('&', '&', new Range(defaultLoc, 0, 0, 0, 1, 0, 1)));
      });

      it('identifies </ as markup', () => {
         source.addText('</foo', new Range(defaultLoc));

         source.extract('markup', chunkSpy);

         expect(chunkSpy).toHaveBeenCalledWith(new Chunk('</', '</', new Range(defaultLoc, 0, 0, 0, 2, 0, 2)));
      });

      it('delivers no chunk if the next chars do not form markup', () => {
         source.addText('foo', new Range(defaultLoc));

         source.extract('markup', chunkSpy);

         expect(chunkSpy).toHaveBeenCalledWith();
      });

   });

   describe('extract("match")', () => {

      it('delivers the the matched text', () => {
         source.addText('frogs and toads', new Range(defaultLoc));

         source.extract('match', 'fro', chunkSpy);

         expect(chunkSpy).toHaveBeenCalledWith(
            new Chunk('fro', 'fro', new Range(defaultLoc, 0, 0, 0, 3, 0, 3)));
      });

      it('delivers no chunk if there is no match', () => {
         source.addText('frogs and toads', new Range(defaultLoc));
         source.extract('match', 'gorilla', chunkSpy);

         expect(chunkSpy).toHaveBeenCalledWith();
      });

      it('delivers no chunk if there is no content to match against', () => {
         source.endText();
         source.extract('match', 'gorilla', chunkSpy);

         expect(chunkSpy).toHaveBeenCalledWith();
      });

   });

   describe('extract("peekChar")', () => {

      it('delivers the next character from a segment', () => {
         source.addText('b', new Range(defaultLoc));

         source.extract('peekChar', chunkSpy);
         source.extract('char', chunkSpy);

         expect(chunkSpy.calls.argsFor(0)[0]).toEqual(new Chunk('b', 'b', new Range(defaultLoc, 0, 0, 0, 1, 0, 1)));
         expect(chunkSpy.calls.argsFor(1)[0]).toEqual(new Chunk('b', 'b', new Range(defaultLoc, 0, 0, 0, 1, 0, 1)));
      });

   });

   describe('extract("peekSpace")', () => {

      it('delivers the next character from a segment', () => {
         source.addText(' \t', new Range(defaultLoc));
         source.endText();

         source.extract('peekSpace', chunkSpy);
         source.extract('space', chunkSpy);

         expect(chunkSpy.calls.argsFor(0)[0]).toEqual(new Chunk(' \t', ' \t', new Range(defaultLoc, 0, 0, 0, 2, 0, 2)));
         expect(chunkSpy.calls.argsFor(1)[0]).toEqual(new Chunk(' \t', ' \t', new Range(defaultLoc, 0, 0, 0, 2, 0, 2)));
      });

   });

   describe('extract("space")', () => {

      it('delivers the a range of space characters', () => {
         source.addText(' \t\n\r\n\rx', new Range(defaultLoc));

         source.extract('space', chunkSpy);

         expect(chunkSpy).toHaveBeenCalledWith(
            new Chunk(' \t\n\n\n', ' \t\n\r\n\r', new Range(defaultLoc, 0, 0, 0, 6, 3, 0)));
      });

      it('delivers the a range of space characters to end of input if needed', () => {
         source.addText(' \t\n\r\n\r', new Range(defaultLoc));
         source.endText();

         source.extract('space', chunkSpy);

         expect(chunkSpy).toHaveBeenCalledWith(
            new Chunk(' \t\n\n\n', ' \t\n\r\n\r', new Range(defaultLoc, 0, 0, 0, 6, 3, 0)));
      });

      it('delivers no chunk if there is no space', () => {
         source.extract('space', chunkSpy);
         source.endText();

         expect(chunkSpy).toHaveBeenCalledWith();
      });

   });

   describe('extract("word")', () => {

      it('delivers a word terminated by a whitespace', () => {
         source.addText('word1\nx', new Range(defaultLoc));

         source.extract('word', chunkSpy);

         expect(chunkSpy).toHaveBeenCalledWith(new Chunk('word1', 'word1', new Range(defaultLoc, 0, 0, 0, 5, 0, 5)));
      });

      it('delivers no chunk if there are no characters', () => {
         source.extract('word', chunkSpy);
         source.endText();

         expect(chunkSpy).toHaveBeenCalledWith();
      });

   });

});
