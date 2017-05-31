const EntityMetaData = require('../shared/EntityMetaData.js');

const stream = require('readable-stream');
const chunk = require('../chunk/index.js');
const CallbackParser = require('./02callback.js');

class Parser extends stream.Readable {

   constructor() {
      super({
         objectMode: true
      });

      this._chunkSource = new chunk.ChunkSource(chunk.defaultExtractors, new EntityMetaData());
      this.callbackParser = new CallbackParser();

      this.callbackParser.parseGeneral(this._chunkSource, (result) => {
         this.push(result);
      })
   }

   addText(text) {
      this._chunkSource.addText(text);
   }

   endText() {
      this._chunkSource.endText();
      this.push(null);
   }

}

module.exports = Parser;
