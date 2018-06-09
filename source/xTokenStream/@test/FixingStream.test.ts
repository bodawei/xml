/* Copyright ® 2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import tokenNs from '../../token';
import attListDecl, { AttListPToken } from '../../token/attListDeclaration';
import elementDeclaration, { ElementDeclarationPToken } from '../../token/elementDeclaration';

import FixingStream from '../FixingStream.js';

type XToken = {
   [key: string]: any,
};

describe('FixingStream (unit)', () => {
   let fs: FixingStream;
   let dummyPToken: AttListPToken;
   let dummyElPToken: ElementDeclarationPToken;

   beforeEach(() => {
      fs = new FixingStream();
      dummyPToken = new attListDecl.PToken();
      dummyElPToken = new elementDeclaration.PToken();
   });

   function gatherTokens(stream: FixingStream, cb: (val: Array<XToken>) => void) {
      const tokens: Array<XToken> = [];

      stream.on('data', (item: XToken) => {
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

      gatherTokens(fs, (tokens: Array<XToken>) => {
         expect(tokens[0]).toEqual(before);
         done();
      });
   });

   describe('ATTLIST', () => {

      it('capitalizes a type if it is not capitalized', (done) => {
         const before = new tokenNs.attListDeclaration.XToken('elName', [{
            name: 'one',
            type: 'id',
            defaultType: '#IMPLIED',
            value: [],
         }], dummyPToken);
   
         fs.write(before);
         fs.end();
   
         gatherTokens(fs, (tokens: Array<XToken>) => {
            expect(tokens[0].attDefs[0].type).toEqual('ID');
            done();
         });
      });
   
      it('replaces an unknown type with CDATA', (done) => {
         const before = new tokenNs.attListDeclaration.XToken('elName', [{
            name: 'one',
            type: 'BOGUS',
            defaultType: '#IMPLIED',
            value: [],
         }], dummyPToken);
   
         fs.write(before);
         fs.end();
   
         gatherTokens(fs, (tokens: Array<XToken>) => {
            expect(tokens[0].attDefs[0].type).toEqual('CDATA');
            done();
         });
      });
   
      it('replaces a missing type with CDATA', (done) => {
         const value = {
            name: 'one',
            type: 'work around typescript',
            defaultType: '#IMPLIED',
            value: [],
         };
         delete value.type;
         const before = new tokenNs.attListDeclaration.XToken('elName', [value], dummyPToken);
   
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
            defaultType: '#required',
            type: 'ID',
            value: [],
         }], dummyPToken);
   
         fs.write(before);
         fs.end();
   
         gatherTokens(fs, (tokens: Array<XToken>) => {
            expect(tokens[0].attDefs[0].defaultType).toEqual('#REQUIRED');
            done();
         });
      });
   
      it('replaces an unknown type with #IMPLIED', (done) => {
         const before = new tokenNs.attListDeclaration.XToken('elName', [{
            name: 'one',
            defaultType: 'BOGUS',
            type: 'ID',
            value: [],
         }], dummyPToken);
   
         fs.write(before);
         fs.end();
   
         gatherTokens(fs, (tokens: Array<XToken>) => {
            expect(tokens[0].attDefs[0].defaultType).toEqual('#IMPLIED');
            done();
         });
      });

   });

   describe('ELEMENT', () => {

      it('capitalizes the type if it is not capitalized', (done) => {
         const before = new tokenNs.elementDeclaration.XToken('elName', 'any', undefined, dummyElPToken);
   
         fs.write(before);
         fs.end();
   
         gatherTokens(fs, (tokens: Array<XToken>) => {
            expect(tokens[0].contentSpecType).toEqual('ANY');
            done();
         });
      });

      it('changes a missing type to ANY', (done) => {
         const before = new tokenNs.elementDeclaration.XToken('elName', '', undefined, dummyElPToken);
   
         fs.write(before);
         fs.end();
   
         gatherTokens(fs, (tokens: Array<XToken>) => {
            expect(tokens[0].contentSpecType).toEqual('ANY');
            done();
         });
      });

      it('changes a bad type to ANY', (done) => {
         const before = new tokenNs.elementDeclaration.XToken('elName', 'bogus', undefined, dummyElPToken);
   
         fs.write(before);
         fs.end();
   
         gatherTokens(fs, (tokens: Array<XToken>) => {
            expect(tokens[0].contentSpecType).toEqual('ANY');
            done();
         });
      });

      it('changes a bad type to CHILDREN if there are indeed children', (done) => {
         const before = new tokenNs.elementDeclaration.XToken('elName', 'bogus', {
            names: [],
            listType: 'CHOICE',
            repeat: 'ONE',
         }, dummyElPToken);
   
         fs.write(before);
         fs.end();
   
         gatherTokens(fs, (tokens: Array<XToken>) => {
            expect(tokens[0].contentSpecType).toEqual('CHILDREN');
            done();
         });
      });

      it('removes children if the type is ANY', (done) => {
         const before = new tokenNs.elementDeclaration.XToken('elName', 'ANY', {
            names: [],
            listType: 'CHOICE',
            repeat: 'ONE',
         }, dummyElPToken);
   
         fs.write(before);
         fs.end();
   
         gatherTokens(fs, (tokens: Array<XToken>) => {
            expect(tokens[0].children).toBeUndefined();
            done();
         });
      });

      it('removes children if the type is EMPTY', (done) => {
         const before = new tokenNs.elementDeclaration.XToken('elName', 'EMPTY', {
            names: [],
            listType: 'CHOICE',
            repeat: 'ONE',
         }, dummyElPToken);
   
         fs.write(before);
         fs.end();
   
         gatherTokens(fs, (tokens: Array<XToken>) => {
            expect(tokens[0].children).toBeUndefined();
            done();
         });
      });

      it('capitalizes #PCDATA', (done) => {
         const before = new tokenNs.elementDeclaration.XToken('elName', 'CHILDREN', {
            names: [{
               name: '#pcdata',
               repeat: 'ZEROPLUS'
            }],
            listType: 'CHOICE',
            repeat: 'ONE',
         }, dummyElPToken);
   
         fs.write(before);
         fs.end();
   
         gatherTokens(fs, (tokens: Array<XToken>) => {
            expect(tokens[0].children.names[0]).toEqual({
               name: '#PCDATA',
               repeat: 'ONE'
            });
            done();
         });
      });

      it('moves #PCDATA to the start', (done) => {
         const before = new tokenNs.elementDeclaration.XToken('elName', 'CHILDREN', {
            names: [{
               name: 'one',
               repeat: 'ONEPLUS',
            }, {
               name: '#pcdata',
               repeat: 'ZEROPLUS'
            }],
            listType: 'CHOICE',
            repeat: 'ONE',
         }, dummyElPToken);
   
         fs.write(before);
         fs.end();
   
         gatherTokens(fs, (tokens: Array<XToken>) => {
            expect(tokens[0].children.names[0]).toEqual({
               name: '#PCDATA',
               repeat: 'ONE'
            });
            done();
         });
      });

      it('moves #PCDATA to the start, even if in a sublist', (done) => {
         const before = new tokenNs.elementDeclaration.XToken('elName', 'CHILDREN', {
            names: [{
               name: 'one',
               repeat: 'ONEPLUS',
            }, {
               names: [{
                  name: '#pcdata',
                  repeat: 'ZEROPLUS'
               }],
               listType: 'CHOICE',
               repeat: 'ONE'
            }],
            listType: 'CHOICE',
            repeat: 'ONE',
         }, dummyElPToken);
   
         fs.write(before);
         fs.end();
   
         gatherTokens(fs, (tokens: Array<XToken>) => {
            expect(tokens[0].children.names[0]).toEqual({
               name: '#PCDATA',
               repeat: 'ONE'
            });
            done();
         });
      });

      it('removes duplicate #PCDATA', (done) => {
         const before = new tokenNs.elementDeclaration.XToken('elName', 'CHILDREN', {
            names: [{
               name: '#pcdata',
               repeat: 'ZEROPLUS'
            }, {
               name: 'one',
               repeat: 'ONEPLUS',
            }, {
               name: '#pcdata',
               repeat: 'ZEROPLUS'
            }],
            listType: 'CHOICE',
            repeat: 'ONE',
         }, dummyElPToken);
   
         fs.write(before);
         fs.end();
   
         gatherTokens(fs, (tokens: Array<XToken>) => {
            expect(tokens[0].children.names.length).toEqual(2);
            done();
         });
      });

      it('flattens a Mixed list, removes duplicates and sets repeat correctly', (done) => {
         const before = new tokenNs.elementDeclaration.XToken('elName', 'CHILDREN', {
            names: [{
               name: 'one',
               repeat: 'ONEPLUS',
            }, {
               names: [{
                  name: '#pcdata',
                  repeat: 'ZEROPLUS'
               }, {
                  name: 'two',
                  repeat: 'ONEPLUS',
               }, {
                  names: [{
                     name: 'three',
                     repeat: 'ONEPLUS',
                  }],
                  listType: 'SEQUENCE',
                  repeat: 'ONE'
               }],
               listType: 'SEQUENCE',
               repeat: 'ONE'
            }, {
               name: 'four',
               repeat: 'ONEPLUS',
            }, {
               name: 'one',
               repeat: 'ONEPLUS',
            }],
            listType: 'SEQUENCE',
            repeat: 'ONE',
         }, dummyElPToken);
   
         fs.write(before);
         fs.end();
   
         gatherTokens(fs, (tokens: Array<XToken>) => {
            expect(tokens[0].children.names).toEqual([{
               name: '#PCDATA',
               repeat: 'ONE',
            }, {
               name: 'one',
               repeat: 'ONE',
            }, {
               name: 'two',
               repeat: 'ONE',
            }, {
               name: 'three',
               repeat: 'ONE',
            }, {
               name: 'four',
               repeat: 'ONE',
            }]);
            done();
         });
      });

   });

});
