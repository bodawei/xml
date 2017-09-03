/* Copyright ® 2017 by 柏大衛. All rights reserved. */

const EntityMetaData = require('../basic/EntityMetaData.js');

const stream = require('readable-stream');
const chunk = require('../chunk/index.js');
const Parser = require('./Parser.js');

class ParsedStream extends stream.Readable {

   constructor() {
      super({
         objectMode: true,
      });

      this._chunkSource = new chunk.ChunkSource(chunk.defaultExtractors, new EntityMetaData());
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
