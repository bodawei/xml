/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

const EntityMetaData = require('./EntityMetaData.js');
const EntityLocation = require('./EntityLocation.js');

describe('EntityMetaData', () => {

   describe('construction', () => {

      it('can be constructed without error', () => {
         expect(() => {
            new EntityMetaData();
         }).not.toThrow();
      });

      it('defaults to most conventional values when called with no params', () => {
         const pk = new EntityMetaData();
         expect(pk).toEqual(new EntityMetaData('DOCUMENT', 1.0, 5));
      });

      it('fills in the right revision for 1.1 if none specified', () => {
         const pk = new EntityMetaData('DOCUMENT', 1.1);
         expect(pk.revision).toEqual(2);
      });

      it('sets the location that is passed in', () => {
         const loc = new EntityLocation('http://here.com', '-//what//is//this');
         const pk = new EntityMetaData('DOCUMENT', 1.0, 4, loc);

         expect(pk.location).toEqual(loc);
      });

      it('throws an error if the version and revision do not match', () => {
         expect(() => {
            new EntityMetaData(EntityMetaData.TYPE.DOCUMENT, 1.1, 5);
         }).toThrowError('Version and revision do not match. Got "1.1" and "5".');
      });

   });

   describe('type', () => {

      it('defaults to document type', () => {
         const pk = new EntityMetaData();

         expect(pk.type).toEqual(EntityMetaData.TYPE.DOCUMENT);
      });

      it('sets the version to EXTERNAL', () => {
         const pk = new EntityMetaData(EntityMetaData.TYPE.EXTERNAL);

         expect(pk.type).toEqual(EntityMetaData.TYPE.EXTERNAL);
      });

      it('sets the version to EXTERNALSUBSET', () => {
         const pk = new EntityMetaData(EntityMetaData.TYPE.EXTERNALSUBSET);

         expect(pk.type).toEqual(EntityMetaData.TYPE.EXTERNALSUBSET);
      });

      it('throws an exception when a bad type is passed in', () => {
         expect(() => {
            new EntityMetaData('document');
         }).toThrowError('Unknown type passed to EntityMetaData.type.  Got "document".');
      });

   });

   describe('isTypeDocument', () => {

      it('sets the type', () => {
         const pk = new EntityMetaData(EntityMetaData.TYPE.DOCUMENT);

         expect(pk.isTypeDocument).toEqual(true);
      });

   });

   describe('isTypeExternal', () => {

      it('sets the type', () => {
         const pk = new EntityMetaData(EntityMetaData.TYPE.EXTERNAL);

         expect(pk.isTypeExternal).toEqual(true);
      });

   });

   describe('isTypeExternalSubset', () => {

      it('sets the type', () => {
         const pk = new EntityMetaData(EntityMetaData.TYPE.EXTERNALSUBSET);

         expect(pk.isTypeExternalSubset).toEqual(true);
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

         expect(pk).toEqual(new EntityMetaData('DOCUMENT', 1.1, 2));
      });

      it('changes the revision to 5 when version 1.0 is set', () => {
         const pk = new EntityMetaData('DOCUMENT', 1.1, 2);
         pk.version = 1.0;

         expect(pk).toEqual(new EntityMetaData('DOCUMENT', 1.0, 5));
      });

      it('throws an exception when a bad version is passed in', () => {
         const pk = new EntityMetaData();

         expect(() => {
            pk.version = 32;
         }).toThrowError('Unknown version passed to EntityMetaData.version.  Got "32".');
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
         const pk = new EntityMetaData(EntityMetaData.TYPE.DOCUMENT, 1.0, 4);

         expect(pk.revision).toEqual(4);
      });

      it('sets a revision to 1', () => {
         const pk = new EntityMetaData(EntityMetaData.TYPE.DOCUMENT, 1.0, 1);

         expect(pk.revision).toEqual(1);
      });

      it('can change the revision to 1 when 1.1 is set', () => {
         const pk = new EntityMetaData(EntityMetaData.TYPE.DOCUMENT, 1.1, 1);

         expect(pk.revision).toEqual(1);
      });

      it('throws an exception when a bad revision is passed in', () => {
         expect(() => {
            new EntityMetaData(EntityMetaData.TYPE.DOCUMENT, 1.0, 6);
         }).toThrowError('Version and revision do not match. Got "1" and "6".');
      });

   });

});
