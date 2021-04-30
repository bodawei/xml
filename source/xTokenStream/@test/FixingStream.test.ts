/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { gatherStreamResults } from 'basic-test';
import { CommentXToken, AttListDeclarationXToken, AttDefinitionType, AttDefaultType, ContentSpecType, ElementDeclarationXToken, CpRepeat, CpType } from 'xToken';

import FixingStream from '../FixingStream';

type XToken = {
   [key: string]: any,
};

describe('FixingStream (unit)', () => {
   let fs: FixingStream;

   beforeEach(() => {
      fs = new FixingStream();
   });

   it('passes a comment through', (done) => {
      const before = new CommentXToken('elName');

      fs.write(before);
      fs.end();

      gatherStreamResults<XToken>(fs, (tokens) => {
         expect(tokens[0]).toEqual(before);
         done();
      });
   });

   describe('ATTLIST', () => {

      it('capitalizes a type if it is not capitalized', (done) => {
         const before = new AttListDeclarationXToken('elName', [{
            name: 'one',
            type: AttDefinitionType.ID,
            defaultType: AttDefaultType.IMPLIED,
            value: [],
         }]);

         fs.write(before);
         fs.end();

         gatherStreamResults<XToken>(fs, (tokens: Array<XToken>) => {
            expect(tokens[0].attDefs[0].type).toEqual('ID');
            done();
         });
      });


      it('replaces an unknown type with #IMPLIED', (done) => {
         const before = new AttListDeclarationXToken('elName', [{
            name: 'one',
            defaultType: AttDefaultType.IMPLIED,
            type: AttDefinitionType.ID,
            value: [],
         }]);

         fs.write(before);
         fs.end();

         gatherStreamResults<XToken>(fs, (tokens: Array<XToken>) => {
            expect(tokens[0].attDefs[0].defaultType).toEqual('#IMPLIED');
            done();
         });
      });

   });

   describe('ELEMENT', () => {

      it('capitalizes the type if it is not capitalized', (done) => {
         const before = new ElementDeclarationXToken('elName', ContentSpecType.ANY, undefined);

         fs.write(before);
         fs.end();

         gatherStreamResults<XToken>(fs, (tokens: Array<XToken>) => {
            expect(tokens[0].contentSpec).toEqual('ANY');
            done();
         });
      });

      it('changes a missing type to ANY', (done) => {
         const before = new ElementDeclarationXToken('elName', undefined, undefined);

         fs.write(before);
         fs.end();

         gatherStreamResults<XToken>(fs, (tokens: Array<XToken>) => {
            expect(tokens[0].contentSpec).toEqual('ANY');
            done();
         });
      });

      it('changes a bad type to ANY', (done) => {
         const before = new ElementDeclarationXToken('elName', undefined, undefined);

         fs.write(before);
         fs.end();

         gatherStreamResults<XToken>(fs, (tokens: Array<XToken>) => {
            expect(tokens[0].contentSpec).toEqual('ANY');
            done();
         });
      });

      it('changes a bad type to ELEMENT if there are indeed children', (done) => {
         const before = new ElementDeclarationXToken('elName', undefined, {
            particles: [],
            listType: CpType.CHOICE,
            repeat: CpRepeat.ONE,
         });

         fs.write(before);
         fs.end();

         gatherStreamResults<XToken>(fs, (tokens: Array<XToken>) => {
            expect(tokens[0].contentSpec).toEqual(ContentSpecType.ELEMENT);
            done();
         });
      });

      // These are obsolete.
      // it('removes contentModel if the type is ANY', (done) => {
      //    const before = new ElementDeclarationXToken('elName', ContentSpecType.ANY, {
      //       particles: [],
      //       listType: CpType.CHOICE,
      //       repeat: CpRepeat.ONE,
      //    });

      //    fs.write(before);
      //    fs.end();

      //    gatherStreamResults<XToken>(fs, (tokens: Array<XToken>) => {
      //       expect(tokens[0].contentModel).toBeUndefined();
      //       done();
      //    });
      // });

      // it('removes contentModel if the type is EMPTY', (done) => {
      //    const before = new ElementDeclarationXToken('elName', ContentSpecType.EMPTY, {
      //       particles: [],
      //       listType: CpType.CHOICE,
      //       repeat: CpRepeat.ONE,
      //    });

      //    fs.write(before);
      //    fs.end();

      //    gatherStreamResults<XToken>(fs, (tokens: Array<XToken>) => {
      //       expect(tokens[0].contentModel).toBeUndefined();
      //       done();
      //    });
      // });

      it('capitalizes #PCDATA', (done) => {
         const before = new ElementDeclarationXToken('elName', ContentSpecType.ELEMENT, {
            particles: [{
               name: '#pcdata',
               repeat: CpRepeat.ZEROPLUS
            }],
            listType: CpType.CHOICE,
            repeat: CpRepeat.ONE,
         });

         fs.write(before);
         fs.end();

         gatherStreamResults<XToken>(fs, (tokens: Array<XToken>) => {
            expect(tokens[0].contentModel.particles[0]).toEqual({
               name: '#PCDATA',
               repeat: CpRepeat.ONE
            });
            done();
         });
      });

      it('moves #PCDATA to the start', (done) => {
         const before = new ElementDeclarationXToken('elName', ContentSpecType.ELEMENT, {
            particles: [{
               name: 'one',
               repeat: CpRepeat.ONEPLUS,
            }, {
               name: '#pcdata',
               repeat: CpRepeat.ZEROPLUS
            }],
            listType: CpType.CHOICE,
            repeat: CpRepeat.ONE,
         });

         fs.write(before);
         fs.end();

         gatherStreamResults<XToken>(fs, (tokens: Array<XToken>) => {
            expect(tokens[0].contentModel.particles[0]).toEqual({
               name: '#PCDATA',
               repeat: CpRepeat.ONE
            });
            done();
         });
      });

      it('moves #PCDATA to the start, even if in a sublist', (done) => {
         const before = new ElementDeclarationXToken('elName', ContentSpecType.ELEMENT, {
            particles: [{
               name: 'one',
               repeat: CpRepeat.ONEPLUS,
            }, {
               particles: [{
                  name: '#pcdata',
                  repeat: CpRepeat.ZEROPLUS
               }],
               listType: CpType.CHOICE,
               repeat: CpRepeat.ONE
            }],
            listType: CpType.CHOICE,
            repeat: CpRepeat.ONE,
         });

         fs.write(before);
         fs.end();

         gatherStreamResults<XToken>(fs, (tokens: Array<XToken>) => {
            expect(tokens[0].contentModel.particles[0]).toEqual({
               name: '#PCDATA',
               repeat: CpRepeat.ONE
            });
            done();
         });
      });

      it('removes duplicate #PCDATA', (done) => {
         const before = new ElementDeclarationXToken('elName', ContentSpecType.ELEMENT, {
            particles: [{
               name: '#pcdata',
               repeat: CpRepeat.ZEROPLUS
            }, {
               name: 'one',
               repeat: CpRepeat.ONEPLUS,
            }, {
               name: '#pcdata',
               repeat: CpRepeat.ZEROPLUS
            }],
            listType: CpType.CHOICE,
            repeat: CpRepeat.ONE,
         });

         fs.write(before);
         fs.end();

         gatherStreamResults<XToken>(fs, (tokens: Array<XToken>) => {
            expect(tokens[0].contentModel.particles.length).toEqual(2);
            done();
         });
      });

      it('flattens a Mixed list, removes duplicates and sets repeat correctly', (done) => {
         const before = new ElementDeclarationXToken('elName', ContentSpecType.ELEMENT, {
            particles: [{
               name: 'one',
               repeat: CpRepeat.ONEPLUS,
            }, {
               particles: [{
                  name: '#pcdata',
                  repeat: CpRepeat.ZEROPLUS
               }, {
                  name: 'two',
                  repeat: CpRepeat.ONEPLUS,
               }, {
                  particles: [{
                     name: 'three',
                     repeat: CpRepeat.ONEPLUS,
                  }],
                  listType: CpType.SEQUENCE,
                  repeat: CpRepeat.ONE
               }],
               listType: CpType.SEQUENCE,
               repeat: CpRepeat.ONE
            }, {
               name: 'four',
               repeat: CpRepeat.ONEPLUS,
            }, {
               name: 'one',
               repeat: CpRepeat.ONEPLUS,
            }],
            listType: CpType.SEQUENCE,
            repeat: CpRepeat.ONE,
         });

         fs.write(before);
         fs.end();

         gatherStreamResults<XToken>(fs, (tokens: Array<XToken>) => {
            expect(tokens[0].contentModel.particles).toEqual([{
               name: '#PCDATA',
               repeat: CpRepeat.ONE,
            }, {
               name: 'one',
               repeat: CpRepeat.ONEPLUS,
            }, {
               name: 'two',
               repeat: CpRepeat.ONEPLUS,
            }, {
               name: 'three',
               repeat: CpRepeat.ONEPLUS,
            }, {
               name: 'four',
               repeat: CpRepeat.ONEPLUS,
            }]);
            done();
         });
      });

   });

});
