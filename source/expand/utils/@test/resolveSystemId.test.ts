/* Copyright ® 2016-2020 by 柏大衛. All rights reserved. */

import { EntityId } from 'pToken';
import { resolveSystemId } from '../resolveSystemId';

describe('resolveSystemId()', () => {
   it('produces the systemId of the EntityUri if no systemId provided', () => {
      const entityId = new EntityId('system.xml', 'public');

      expect(resolveSystemId(entityId)).toEqual('system.xml');
   });

   it('produces the systemId when no systemId provided', () => {
      expect(resolveSystemId(undefined, new EntityId('system2.xml'))).toEqual('system2.xml');
   });

   it('produces an empty string if no arguments provided', () => {
      expect(resolveSystemId(undefined)).toEqual('');
   });

   it('produces a resolved ID as a combination from http: parent and plain file name child', () => {
      const entityId = new EntityId('http://one.com/two/parent.xml');

      expect(resolveSystemId(entityId, new EntityId('system.xml'))).toEqual(
         'http://one.com/two/system.xml',
      );
   });

   it('produces a resolved ID that is just the child when the child is http://', () => {
      const entityId = new EntityId('http://one.com/two/parent.xml');

      expect(resolveSystemId(entityId, new EntityId('http://foo.com/system.xml'))).toEqual(
         'http://foo.com/system.xml',
      );
   });

   it('produces a resolved ID using the parent protocol when the child is protocol relative', () => {
      const entityId = new EntityId('https://one.com/two/parent.xml');

      expect(resolveSystemId(entityId, new EntityId('//foo.com/system.xml'))).toEqual(
         'https://foo.com/system.xml',
      );
   });

   it('produces a resolved ID even when parent, oddly, just points to a directory', () => {
      const entityId = new EntityId('http://one.com/two/');

      expect(resolveSystemId(entityId, new EntityId('system.xml'))).toEqual(
         'http://one.com/two/system.xml',
      );
   });
});
