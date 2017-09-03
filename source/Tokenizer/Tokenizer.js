const EntityMetaData = require('../shared/EntityMetaData.js');

const stream = require('readable-stream');
const XmlDeclaration = require('../XmlTokens/XmlDeclaration.js');

class Tokenizer extends stream.Transform {

   constructor() {
      super({
         objectMode: true
      });
   }

   _transform(parsed, ignored, done) {
      if (parsed.type === 'xmldecl') {
         this.push(XmlDeclaration.makeToken(parsed));
      } else {
         this.push(parsed);
      }

      done();
   }

}

module.exports = Tokenizer;
