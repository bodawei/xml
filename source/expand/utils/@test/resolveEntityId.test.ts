/* Copyright ® 2020-2026 by 柏大衛. All rights reserved. */

import { EntityId } from 'basic';

import { resolveEntityId } from '../resolveEntityId';

describe('resolveEntityId()', () => {
   it('produces a resolved ID as a combination from http: parent and plain file name child', () => {
      const entityId = new EntityId('http://one.com/two/parent.xml');

      expect(resolveEntityId(entityId, new EntityId('system.xml'))).toEqual(
         'http://one.com/two/system.xml',
      );
   });

   it('produces a resolved ID that is just the child when the child is http://', () => {
      const entityId = new EntityId('http://one.com/two/parent.xml');

      expect(resolveEntityId(entityId, new EntityId('http://foo.com/system.xml'))).toEqual(
         'http://foo.com/system.xml',
      );
   });

   it('produces a resolved ID using the parent protocol when the child is protocol relative', () => {
      const entityId = new EntityId('https://one.com/two/parent.xml');

      expect(resolveEntityId(entityId, new EntityId('//foo.com/system.xml'))).toEqual(
         'https://foo.com/system.xml',
      );
   });

   it('produces a resolved ID even when parent, oddly, just points to a directory', () => {
      const entityId = new EntityId('http://one.com/two/');

      expect(resolveEntityId(entityId, new EntityId('system.xml'))).toEqual(
         'http://one.com/two/system.xml',
      );
   });

   it('produces a resolved ID as a combination from http: parent string and plain file name child', () => {
      expect(resolveEntityId('http://one.com/two/parent.xml', new EntityId('system.xml'))).toEqual(
         'http://one.com/two/system.xml',
      );
   });

   it('produces a resolved ID that is just the child when the child is http:// and the parent is a string', () => {
      expect(
         resolveEntityId(
            'http://one.com/two/parent.xml',
            new EntityId('http://foo.com/system.xml'),
         ),
      ).toEqual('http://foo.com/system.xml');
   });

   it('produces a resolved ID using the parent protocol when the child is protocol relative and the parent is a string', () => {
      expect(
         resolveEntityId('https://one.com/two/parent.xml', new EntityId('//foo.com/system.xml')),
      ).toEqual('https://foo.com/system.xml');
   });

   it('produces a resolved ID even when parent, oddly, just points to a directory (string parent)', () => {
      expect(resolveEntityId('http://one.com/two/', new EntityId('system.xml'))).toEqual(
         'http://one.com/two/system.xml',
      );
   });
});
