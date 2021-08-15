/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { ConformanceVersion, warning } from 'basic';
import { MockErrorCollector } from 'basic-test';
import { toSToken } from 'sToken';

import { nameXmlCheck } from '../nameXmlCheck';

describe('nameXmlCheck()', () => {
   let WARN1: string;
   let WARN2: string;
   let confVer: ConformanceVersion;
   let ec: MockErrorCollector;

   beforeEach(() => {
      ec = new MockErrorCollector();
      confVer = new ConformanceVersion();
      WARN1 = warning.id.ENTITYDECL_XRA_DECLARATION;
      WARN2 = warning.id.ELEMENT_START_USED_FOR_EMPTY_DECL;
   });

   it('adds no errors if a name is not passed in', () => {
      nameXmlCheck(undefined, ec, confVer, 'ELEMENT', WARN1, WARN2);

      expect(ec.errors).toEqual([]);
   });

   it('reports no errors if the name does not start with "xml" (§3.0.0)', () => {
      nameXmlCheck(toSToken('foo'), ec, new ConformanceVersion(1, 5), 'ELEMENT', WARN1, WARN2);

      expect(ec.errors).toEqual([]);
   });

   it('reports a warning if the name starts with "xml" (§3.0.0)', () => {
      nameXmlCheck(toSToken('xmlblah'), ec, new ConformanceVersion(1, 5), 'ELEMENT', WARN1, WARN2);

      expect(ec).toReportWarning({
         id: WARN2,
         params: ['xmlblah'],
         position: undefined,
      });
   });

   it('reports no errors if this is an xml:lang attriute', () => {
      nameXmlCheck(
         toSToken('xml:lang'),
         ec,
         new ConformanceVersion(1, 5),
         'ATTRIBUTE',
         WARN1,
         WARN2,
      );

      expect(ec.errors).toEqual([]);
   });

   it('reports no errors if this is an xml:space attriute', () => {
      nameXmlCheck(
         toSToken('xml:space'),
         ec,
         new ConformanceVersion(1, 5),
         'ATTRIBUTE',
         WARN1,
         WARN2,
      );

      expect(ec.errors).toEqual([]);
   });

   it('reports a warning if XML:LANG is provided', () => {
      nameXmlCheck(
         toSToken('XML:LANG'),
         ec,
         new ConformanceVersion(1, 5),
         'ATTRIBUTE',
         WARN1,
         WARN2,
      );

      expect(ec).toReportWarning({
         id: WARN2,
         params: ['XML:LANG'],
         position: undefined,
      });
   });

   it('reports no warning if the version is 1.0/6, and the element name starts with "xml" (§3.0.0)', () => {
      nameXmlCheck(toSToken('xmlFoo'), ec, new ConformanceVersion(1, 6), 'ELEMENT', WARN1, WARN2);

      expect(ec.errors).toEqual([]);
   });

   it('reports a warning if the version is 1.0/6, and the PI name starts with "xml-"', () => {
      nameXmlCheck(toSToken('xml-Foo'), ec, new ConformanceVersion(1, 6), 'PI', WARN1, WARN2);

      expect(ec).toReportWarning({
         id: WARN1,
         params: ['xml-Foo'],
         position: undefined,
      });
   });

   it('reports a warning if the version is 1.0/6, and the element or attr name starts with "xml:"', () => {
      nameXmlCheck(
         toSToken('xml:Foo'),
         ec,
         new ConformanceVersion(1, 6),
         'ATTRIBUTE',
         WARN1,
         WARN2,
      );

      expect(ec).toReportWarning({
         id: WARN1,
         params: ['xml:Foo'],
         position: undefined,
      });
   });

   it('reports no warning if the version is 1.0/6, and the element name starts with "xml" (§3.0.0)', () => {
      nameXmlCheck(toSToken('xmlFoo'), ec, new ConformanceVersion(1, 6), 'ELEMENT', WARN1, WARN2);

      expect(ec.errors).toEqual([]);
   });

   it('reports no warning if the version is 1.0/6, and the entity name starts with "xml"', () => {
      nameXmlCheck(toSToken('xmlFoo'), ec, new ConformanceVersion(1, 6), 'ENTITY', WARN1, WARN2);

      expect(ec.errors).toEqual([]);
   });

   it('reports no warning if the version is 1.0/6, and the PI name starts with "xml"', () => {
      nameXmlCheck(toSToken('xmlFoo'), ec, new ConformanceVersion(1, 6), 'PI', WARN1, WARN2);

      expect(ec.errors).toEqual([]);
   });

   it('reports a warning if the version is 1.0/5, and the name starts with "xml"', () => {
      nameXmlCheck(toSToken('xmlFoo'), ec, new ConformanceVersion(1, 5), 'ENTITY', WARN1, WARN2);

      expect(ec).toReportWarning({
         id: WARN2,
         params: ['xmlFoo'],
         position: undefined,
      });
   });

   it('reports a warning if the version is 1.0/5, and the PI name starts with "xml-"', () => {
      nameXmlCheck(toSToken('xml-Foo'), ec, new ConformanceVersion(1, 5), 'PI', WARN1, WARN2);

      expect(ec).toReportWarning({
         id: WARN2,
         params: ['xml-Foo'],
         position: undefined,
      });
   });

   it('reports a warning if the version is 1.0/5, and the element name starts with "xml:" (§3.0.0)', () => {
      nameXmlCheck(toSToken('xml:Foo'), ec, new ConformanceVersion(1, 5), 'ELEMENT', WARN1, WARN2);

      expect(ec).toReportWarning({
         id: WARN2,
         params: ['xml:Foo'],
         position: undefined,
      });
   });
});
