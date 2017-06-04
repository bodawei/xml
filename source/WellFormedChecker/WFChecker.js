const EntityMetaData = require('../shared/EntityMetaData.js');

const stream = require('readable-stream');
const XmlDeclaration = require('../XmlTokens/XmlDeclaration.js');

class WFChecker extends stream.Transform {

   constructor() {
      super({
         objectMode: true
      });
      console.log('constructing');
   }

   _transform(parsed, ignored, callback) {
   console.log('transform');
      if (parsed.type === 'xmldecl') {
         const errors = XmlDeclaration.checkWellFormed(parsed, true, 1.0);
         errors.forEach(error => this.push(error));
      }

      this.push(parsed);
      callback();
   }

}

module.exports = WFChecker;
