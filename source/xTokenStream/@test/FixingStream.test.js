/* Copyright ® 2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import tokenNs from '../../token';

import FixingStream from '../FixingStream.js';

describe('FixingStream (unit)', () => {
   let fs;

   beforeEach(() => {
      fs = new FixingStream();
   });

   function gatherTokens(stream, cb) {
      const tokens = [];

      stream.on('data', (item) => {
         tokens.push(item);
      });
      stream.on('end', () => {
         cb(tokens);
      });
   }

   it('passes a comment through', (done) => {
      const before = new tokenNs.comment.XToken('elName', {});

      fs.write(before);
      fs.end();

      gatherTokens(fs, (tokens) => {
         expect(tokens[0]).toEqual(before);
         done();
      });
   });

   describe('ATTLIST', () => {

      it('capitalizes a type if it is not capitalized', (done) => {
         const before = new tokenNs.attListDeclaration.XToken('elName', [{
            name: 'one',
            type: 'id'
         }], {});
   
         fs.write(before);
         fs.end();
   
         gatherTokens(fs, (tokens) => {
            expect(tokens[0].attDefs[0].type).toEqual('ID');
            done();
         });
      });
   
      it('replaces an unknown type with CDATA', (done) => {
         const before = new tokenNs.attListDeclaration.XToken('elName', [{
            name: 'one',
            type: 'BOGUS'
         }], {});
   
         fs.write(before);
         fs.end();
   
         gatherTokens(fs, (tokens) => {
            expect(tokens[0].attDefs[0].type).toEqual('CDATA');
            done();
         });
      });
   
      it('replaces a missing type with CDATA', (done) => {
         const before = new tokenNs.attListDeclaration.XToken('elName', [{
            name: 'one',
         }], {});
   
         fs.write(before);
         fs.end();
   
         gatherTokens(fs, (tokens) => {
            expect(tokens[0].attDefs[0].type).toEqual('CDATA');
            done();
         });
      });

      it('capitalizes a default type if it is not capitalized', (done) => {
         const before = new tokenNs.attListDeclaration.XToken('elName', [{
            name: 'one',
            defaultType: '#required'
         }], {});
   
         fs.write(before);
         fs.end();
   
         gatherTokens(fs, (tokens) => {
            expect(tokens[0].attDefs[0].defaultType).toEqual('#REQUIRED');
            done();
         });
      });
   
      it('replaces an unknown type with #IMPLIED', (done) => {
         const before = new tokenNs.attListDeclaration.XToken('elName', [{
            name: 'one',
            defaultType: 'BOGUS'
         }], {});
   
         fs.write(before);
         fs.end();
   
         gatherTokens(fs, (tokens) => {
            expect(tokens[0].attDefs[0].defaultType).toEqual('#IMPLIED');
            done();
         });
      });

   });

});
