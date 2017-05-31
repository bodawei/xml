/* Copyright ® 2017 by David John Burrowes. All rights reserved. */

'use strict';

class Extractor {

   constructor(version) {
      this._version = version;
      this._matches = [];
      this._originals = [];
      this._segmentInfo = [];
      this.state = Extractor.STATE.WORKING;
   }

   process() {}

   done() {}

}

Extractor.STATE = {
   WORKING: 'WORKING',
   SUCCESS: 'SUCCESS',
   FAILURE: 'FAILURE'
};


module.exports = Extractor;
