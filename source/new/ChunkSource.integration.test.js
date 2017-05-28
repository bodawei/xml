
/* Copyright ® 2017 by David John Burrowes. All rights reserved. */

'use strict';

/* eslint-env jasmine */

const Chunk = require('./Chunk.js');
const ChunkSource = require('./ChunkSource.js');
const defaultExtractors = require('./defaultExtractors.js');
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

      source = new ChunkSource(defaultExtractors, entityMetaData1dot1);
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

   describe('extract("peekChar")', () => {

      it('delivers the next character from a segment', () => {
         source.addText('b', new Range(defaultLoc));

         source.extract('peekChar', chunkSpy);
         source.extract('char', chunkSpy);

         expect(chunkSpy.calls.argsFor(0)[0]).toEqual(new Chunk('b', 'b', new Range(defaultLoc, 0, 0, 0, 1, 0, 1)));
         expect(chunkSpy.calls.argsFor(1)[0]).toEqual(new Chunk('b', 'b', new Range(defaultLoc, 0, 0, 0, 1, 0, 1)));
      });

   });

   describe('extract("markup")', () => {

      it('delivers the next character from a segment', () => {
         source.addText('<foo', new Range(defaultLoc));

         source.extract('markup', chunkSpy);

         expect(chunkSpy).toHaveBeenCalledWith(new Chunk('<', '<', new Range(defaultLoc, 0, 0, 0, 1, 0, 1)));
      });

   });

});
