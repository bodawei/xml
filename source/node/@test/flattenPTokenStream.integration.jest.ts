/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { Transform } from 'stream';

import { ConformanceVersion, XmlEdition, XmlVersion } from 'basic';
import { gatherStreamResults } from 'basic-test';
import { ContextType, ParseToken } from 'pToken';
import { PTokenStream } from '../../pTokenStream';
import { SToken, STokenSource } from 'sToken';


import { FlattenPTokenStream } from '../flattenPTokenStream';

import { TestDoc } from './data/flatDocsTypes';
import documents from './data/flatDocs.json';

class STokenToOriginalStringStream extends Transform {
   constructor() {
      super({ objectMode: true });
   }

   _transform(stoken: SToken, _: string, done: () => void): void {
      this.push(stoken.originalStr);
      done();
   }
}

describe('flat (integration)', () => {
   const allDetails = documents as Array<TestDoc>;

   allDetails.forEach((testData) => {
      const ver = testData.version ? (Number.parseFloat(testData.version) as XmlVersion) : 1.0;
      const defaultEdition: XmlEdition = ver === 1.0 ? 5 : 2;
      const editionString = testData.edition ? testData.edition : String(defaultEdition);
      const hasEdition = !!testData.edition;
      const allEditions = editionString
         .split(/ +/)
         .map((ver) => Number.parseInt(ver, 10) as XmlEdition);

      allEditions.forEach((edition) => {
         it(`does a "roundtrip" with ${testData.id} (${ver}/${edition})`, (done) => {
            const verToUse = hasEdition ? ver : undefined;
            const editionToUse = hasEdition ? edition : undefined;
            const sTokenSource = new STokenSource();
            const pTokenStream = new PTokenStream(sTokenSource, {
               context: ContextType.DOCUMENT,
               confVer: verToUse && editionToUse ? new ConformanceVersion(verToUse, editionToUse) : undefined,
            });
            const flat = new FlattenPTokenStream();
            const toString = new STokenToOriginalStringStream();
            pTokenStream.pipe(flat).pipe(toString);
      
            sTokenSource.addText(testData.doc || '');
            sTokenSource.endText();
         
            gatherStreamResults<ParseToken>(toString, (results) => {
               const textChunks = results.join('');

               expect(textChunks).toEqual(testData.doc);
               done?.();
            });
         });
      });
   });
});
