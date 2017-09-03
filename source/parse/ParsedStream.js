/* Copyright ® 2017 by 柏大衛. All rights reserved. */

import stream from 'readable-stream';

import { EntityMetaData } from '../basic';
import { LTokenSource, defaultExtractors } from '../lToken';

import Parser from './Parser.js';

class ParsedStream extends stream.Readable {

   constructor() {
      super({
         objectMode: true,
      });

      this._lTokenSource = new LTokenSource(defaultExtractors, new EntityMetaData());
      this.parser = new Parser();
   }

   addText(text) {
      this._lTokenSource.addText(text);
   }

   endText() {
      this._lTokenSource.endText();
   }

   _read() {
      this.parser.parseGeneral(this._lTokenSource, (result) => {
         this.push(result || null);
      });
   }
}

export default ParsedStream;
