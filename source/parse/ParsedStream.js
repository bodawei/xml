/* Copyright ® 2017 by 柏大衛. All rights reserved. */

import stream from 'readable-stream';

import { EntityMetaData } from '../basic';
import { ChunkSource, defaultExtractors } from '../chunk';

import Parser from './Parser.js';

class ParsedStream extends stream.Readable {

   constructor() {
      super({
         objectMode: true,
      });

      this._chunkSource = new ChunkSource(defaultExtractors, new EntityMetaData());
      this.parser = new Parser();
   }

   addText(text) {
      this._chunkSource.addText(text);
   }

   endText() {
      this._chunkSource.endText();
   }

   _read() {
      this.parser.parseGeneral(this._chunkSource, (result) => {
         this.push(result || null);
      });
   }
}

module.exports = ParsedStream;
