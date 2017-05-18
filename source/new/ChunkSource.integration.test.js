
/* Copyright ® 2017 by David John Burrowes. All rights reserved. */

'use strict';

/* eslint-env jasmine */

const CharExtractor = require('./CharExtractor.js');
const Chunk = require('./Chunk.js');
const ChunkSource = require('./ChunkSource.js');
const EntityLocation = require('../shared/EntityLocation.js');
const EntityMetaData = require('../shared/EntityMetaData.js');
const Range = require('./Range.js');

describe('ChunkSource (integration)', () => {
   let source;
   let defaultLoc;
   let entityMetaData1dot1;
   let chunkSpy;

   beforeEach(() => {
      defaultLoc = new EntityLocation();
      entityMetaData1dot1 = new EntityMetaData(EntityMetaData.TYPE.DOCUMENT, 1.1, 2, defaultLoc);
      chunkSpy = jasmine.createSpy('chunkSpy');
      const testExtractors = {
         char: CharExtractor
      };

      source = new ChunkSource(testExtractors, entityMetaData1dot1);
   });

   describe('extract("char")', () => {

      it('delivers the next character from a segment', () => {
         source.addText('b', new Range(defaultLoc));

         source.extract('char', chunkSpy, undefined);

         expect(chunkSpy).toHaveBeenCalledWith(new Chunk('b', 'b', new Range(defaultLoc, 0, 0, 0, 1, 0, 1)));
      });

      it('delivers a newline from a CRLF across segments', () => {
         source.addText('\r', new Range(defaultLoc));
         source.addText('\nx');

         source.extract('char', chunkSpy, undefined);

         expect(chunkSpy).toHaveBeenCalledWith(new Chunk('\n', '\r\n', new Range(defaultLoc, 0, 0, 0, 2, 1, 0)));
      });

   });

});
