/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import EntityMetaData, { EntityKind } from '../EntityMetaData';
import EntityLocation from '../EntityLocation';

describe('EntityMetaData', () => {

   describe('construction', () => {

      it('can be constructed without error', () => {
         expect(() => {
            new EntityMetaData();
         }).not.toThrow();
      });

      it('defaults to most conventional values when called with no params', () => {
         const pk = new EntityMetaData();
         expect(pk).toEqual(new EntityMetaData(EntityKind.DOCUMENT, 1.0, 5));
      });

      it('fills in the right revision for 1.1 if none specified', () => {
         const pk = new EntityMetaData(EntityKind.DOCUMENT, 1.1);
         expect(pk.revision).toEqual(2);
      });

      it('sets the location that is passed in', () => {
         const loc = new EntityLocation('http://here.com', '-//what//is//this');
         const pk = new EntityMetaData(EntityKind.DOCUMENT, 1.0, 4, loc);

         expect(pk.location).toEqual(loc);
      });

      it('sets the type', () => {
         const pk = new EntityMetaData(EntityKind.DOCUMENT, 1.0, 4);

         expect(pk.type).toEqual('ENTITY_META_DATA');
      });

   });

   describe('kind', () => {

      it('defaults to document kind', () => {
         const pk = new EntityMetaData();

         expect(pk.kind).toEqual(EntityKind.DOCUMENT);
      });

      it('sets the version to EXTERNAL', () => {
         const pk = new EntityMetaData(EntityKind.EXTERNAL);

         expect(pk.kind).toEqual(EntityKind.EXTERNAL);
      });

      it('sets the version to EXTERNALSUBSET', () => {
         const pk = new EntityMetaData(EntityKind.EXTERNALSUBSET);

         expect(pk.kind).toEqual(EntityKind.EXTERNALSUBSET);
      });

   });

   describe('isDocumentKind', () => {

      it('sets the type', () => {
         const pk = new EntityMetaData(EntityKind.DOCUMENT);

         expect(pk.isDocumentKind).toEqual(true);
      });

   });

   describe('isExternalKind', () => {

      it('sets the type', () => {
         const pk = new EntityMetaData(EntityKind.EXTERNAL);

         expect(pk.isExternalKind).toEqual(true);
      });

   });

   describe('isExternalSubsetKind', () => {

      it('sets the kind', () => {
         const pk = new EntityMetaData(EntityKind.EXTERNALSUBSET);

         expect(pk.isExternalSubsetKind).toEqual(true);
      });

   });

   describe('version', () => {

      it('sets the specified version', () => {
         const pk = new EntityMetaData();
         pk.version = 1.1;

         expect(pk.version).toEqual(1.1);
      });

      it('sets the specified version tp 1.0', () => {
         const pk = new EntityMetaData();
         pk.version = 1.0;

         expect(pk.version).toEqual(1);
      });

      it('changes the revision to 2 when version 1.1 is set', () => {
         const pk = new EntityMetaData();
         pk.version = 1.1;

         expect(pk).toEqual(new EntityMetaData(EntityKind.DOCUMENT, 1.1, 2));
      });

      it('changes the revision to 5 when version 1.0 is set', () => {
         const pk = new EntityMetaData(EntityKind.DOCUMENT, 1.1, 2);
         pk.version = 1.0;

         expect(pk).toEqual(new EntityMetaData(EntityKind.DOCUMENT, 1.0, 5));
      });

   });

   describe('isVersion1dot0', () => {

      it('returns true when is 1.0', () => {
         const pk = new EntityMetaData();

         expect(pk.isVersion1dot0).toEqual(true);
      });

      it('returns false when is 1.1', () => {
         const pk = new EntityMetaData();
         pk.version = 1.1;

         expect(pk.isVersion1dot0).toEqual(false);
      });

   });

   describe('isVersion1dot1', () => {

      it('returns false when is 1.0', () => {
         const pk = new EntityMetaData();

         expect(pk.isVersion1dot1).toEqual(false);
      });

      it('returns true when is 1.1', () => {
         const pk = new EntityMetaData();
         pk.version = 1.1;

         expect(pk.isVersion1dot1).toEqual(true);
      });

   });

   describe('revision', () => {

      it('is set to 5 by default', () => {
         const pk = new EntityMetaData();

         expect(pk.revision).toEqual(5);
      });

      it('sets the specified revision', () => {
         const pk = new EntityMetaData(EntityKind.DOCUMENT, 1.0, 4);

         expect(pk.revision).toEqual(4);
      });

      it('allows a revision of 6 for 1.0', () => {
         const pk = new EntityMetaData(EntityKind.DOCUMENT, 1.0, 6);

         expect(pk.revision).toEqual(6);
      });

      it('sets a revision to 1', () => {
         const pk = new EntityMetaData(EntityKind.DOCUMENT, 1.0, 1);

         expect(pk.revision).toEqual(1);
      });

      it('can change the revision to 1 when 1.1 is set', () => {
         const pk = new EntityMetaData(EntityKind.DOCUMENT, 1.1, 1);

         expect(pk.revision).toEqual(1);
      });

      it('throws an exception when a bad revision is passed in', () => {
         expect(() => {
            new EntityMetaData(EntityKind.DOCUMENT, 1.1, 4);
         }).toThrowError('Version and revision do not match. Got "1.1" and "4".');
      });

   });

});
