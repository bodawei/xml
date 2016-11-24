/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

/* eslint-env jasmine */

const EntityInfo = require('./EntityInfo.js');

describe('EntityInfo', () => {

   describe('construction', () => {

      it('can be constructed without error', () => {
         expect(() => {
            new EntityInfo();
         }).not.toThrow();
      });

      it('defaults to most conventional values when called with no params', () => {
         const pk = new EntityInfo();
         expect(pk).toEqual(new EntityInfo('DOCUMENT_ENTITY', '1.0', 'R5'));
      });
   });

   describe('setVersion()', () => {

      it('sets the specified version', () => {
         const pk = new EntityInfo();
         pk.setVersion(EntityInfo.VERSION['1.1']);

         expect(pk.version).toEqual('1.1');
      });

      it('sets the specified version', () => {
         const pk = new EntityInfo();
         pk.setVersion(EntityInfo.VERSION['1.1']);

         expect(pk.version).toEqual('1.1');
      });

      it('changes the revision to R2 when version 1.1 is set', () => {
         const pk = new EntityInfo();
         pk.setVersion('1.1');

         expect(pk).toEqual(new EntityInfo('DOCUMENT_ENTITY', '1.1', 'R2'));
      });

      it('changes the revision to R5 when version 1.0 is set', () => {
         const pk = new EntityInfo('DOCUMENT_ENTITY', '1.1', 'R2');
         pk.setVersion('1.0');

         expect(pk).toEqual(new EntityInfo('DOCUMENT_ENTITY', '1.0', 'R5'));
      });

      it('throws an exception when a bad version is passed in', () => {
         const pk = new EntityInfo();

         expect(() => {
            pk.setVersion(32);
         }).toThrowError('Unknown version passed to EntityInfo.setVersion().  Got "32".');
      });

   });

});
