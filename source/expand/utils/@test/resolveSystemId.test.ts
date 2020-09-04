/* Copyright ® 2016-2020 by 柏大衛. All rights reserved. */

import { EntityLocation } from 'basic';
import { ENTITY_URI, EntityUri } from 'pToken';
import { resolveSystemId } from '../resolveSystemId';

describe('resolveSystemId()', () => {
   it('produces the systemId of the EntityUri if no systemId provided', () => {
      const entityUri: EntityUri = {
         type: ENTITY_URI,
         location: new EntityLocation('system.xml', 'public'),
      };

      expect(resolveSystemId(entityUri)).toEqual('system.xml');
   });

   it('produces the systemId when no systemId provided', () => {
      expect(resolveSystemId(undefined, 'system2.xml')).toEqual('system2.xml');
   });

   it('produces an empty string if no arguments provided', () => {
      expect(resolveSystemId(undefined)).toEqual('');
   });

   it('produces a resolved ID as a combination from http: parent and plain file name child', () => {
      const entityUri: EntityUri = {
         type: ENTITY_URI,
         location: new EntityLocation('http://one.com/two/parent.xml'),
      };

      expect(resolveSystemId(entityUri, 'system.xml')).toEqual('http://one.com/two/system.xml');
   });

   it('produces a resolved ID that is just the child when the child is http://', () => {
      const entityUri: EntityUri = {
         type: ENTITY_URI,
         location: new EntityLocation('http://one.com/two/parent.xml'),
      };

      expect(resolveSystemId(entityUri, 'http://foo.com/system.xml')).toEqual(
         'http://foo.com/system.xml',
      );
   });

   it('produces a resolved ID using the parent protocol when the child is protocol relative', () => {
      const entityUri: EntityUri = {
         type: ENTITY_URI,
         location: new EntityLocation('https://one.com/two/parent.xml'),
      };

      expect(resolveSystemId(entityUri, '//foo.com/system.xml')).toEqual(
         'https://foo.com/system.xml',
      );
   });

   it('produces a resolved ID even when parent, oddly, just points to a directory', () => {
      const entityUri: EntityUri = {
         type: ENTITY_URI,
         location: new EntityLocation('http://one.com/two/'),
      };

      expect(resolveSystemId(entityUri, 'system.xml')).toEqual('http://one.com/two/system.xml');
   });
});
