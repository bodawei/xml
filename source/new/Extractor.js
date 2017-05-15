/* Copyright ® 2017 by David John Burrowes. All rights reserved. */

'use strict';

class Extractor {

   constructor(version) {
      this._version = version;
      this._text = [];
      this._segInfo = [];
      this.state = Extractor.STATE.WORKING;
   }

   process() {}

   done() {}

   getExtraction() {}

}

Extractor.STATE = {
   WORKING: 'WORKING',
   SUCCESS: 'SUCCESS',
   FAILURE: 'FAILURE'
};

module.exports = Extractor;
