/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import EntityLocation from '../EntityLocation.js';

describe('EntityLocation', () => {

   describe('construction', () => {

      it('does not throw an exception', () => {
         expect(() => {
            new EntityLocation();
         }).not.toThrow();
      });

   });

   describe('systemId', () => {

      it('is set from construction', () => {
         expect(new EntityLocation('system').systemId).toEqual('system');
      });

      it('is set to "" if no parameter is specified', () => {
         expect(new EntityLocation().systemId).toEqual('');
      });

   });

   describe('publicId', () => {

      it('is set from construction', () => {
         expect(new EntityLocation('system', 'public').publicId).toEqual('public');
      });

      it('is set to undefined if no parameter is specified', () => {
         expect(new EntityLocation().publicId).toBeUndefined();
      });

   });

   describe('.equals()', () => {

      it('returns false if not passed anything', () => {
         expect(new EntityLocation('y', 'x').equals()).toEqual(false);
      });

   });

   describe('.resolve()', () => {

      it('produces a resolved ID as a combination from http: parent and plain file name child', () => {
         const parent = new EntityLocation('http://one.com/two/parent.xml');
         const child = new EntityLocation('system.xml', 'public');
         child.setBaseLocation(parent);

         expect(child.resolvedSystemId).toEqual('http://one.com/two/system.xml');
      });

      it('produces a resolved ID that is just the child when the child is http://', () => {
         const parent = new EntityLocation('http://one.com/two/parent.xml');
         const child = new EntityLocation('http://foo.com/system.xml', 'public');
         child.setBaseLocation(parent);

         expect(child.resolvedSystemId).toEqual('http://foo.com/system.xml');
      });

      it('produces a resolved ID using the parent protocol when the child is protocol relative', () => {
         const parent = new EntityLocation('https://one.com/two/parent.xml');
         const child = new EntityLocation('//foo.com/system.xml', 'public');
         child.setBaseLocation(parent);

         expect(child.resolvedSystemId).toEqual('https://foo.com/system.xml');
      });

      it('produces a resolved ID even when parent, oddly, just points to a directory', () => {
         const parent = new EntityLocation('http://one.com/two/');
         const child = new EntityLocation('system.xml', 'public');
         child.setBaseLocation(parent);

         expect(child.resolvedSystemId).toEqual('http://one.com/two/system.xml');
      });

   });

});
