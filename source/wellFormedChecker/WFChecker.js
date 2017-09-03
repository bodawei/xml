/* Copyright ® 2017 by 柏大衛. All rights reserved. */

const stream = require('readable-stream');

const token = require('../xmlToken');

class WFChecker extends stream.Transform {

   constructor() {
      super({
         objectMode: true,
      });
   }

   _transform(parsed, ignored, callback) {
      let errorCollector;

      switch (parsed.type) {
         case 'xmldecl':
            errorCollector = token.XmlDeclaration.checkWellFormed(parsed, true, 1.0);
            errorCollector.getErrors().forEach(error => this.push(error));
            break;
         case 'DOCTYPE_START':
            errorCollector = token.docTypeStart.checkWellFormed(parsed, true, 1.0, 5);
            errorCollector.getErrors().forEach(error => this.push(error));
            break;
      }

      this.push(parsed);
      callback();
   }

}

module.exports = WFChecker;
