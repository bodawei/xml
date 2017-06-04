const EntityMetaData = require('../shared/EntityMetaData.js');

const stream = require('readable-stream');
const chunk = require('../chunk/index.js');
const CallbackParser = require('./04gentlecallback.js');

class Parser extends stream.Readable {

   constructor() {
      super({
         objectMode: true
      });

      this._chunkSource = new chunk.ChunkSource(chunk.defaultExtractors, new EntityMetaData());
      this.callbackParser = new CallbackParser();
   }

   addText(text) {
      this._chunkSource.addText(text);
   }

   endText() {
      this._chunkSource.endText();
   }

   _read() {
      this.callbackParser.parseGeneral(this._chunkSource, (result) => {
         this.push(result ||null);
      })
   }
}

module.exports = Parser;
