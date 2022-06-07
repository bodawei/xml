/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { ConformanceVersion } from 'basic';
import { ParamCollector } from 'basic-test';
import { toSToken } from 'sToken';

import { nameXmlCheck } from '../nameXmlCheck';
import { warningCodes } from '../../error/warningCodes';

const WID = warningCodes.id;

describe('nameXmlCheck()', () => {
   let WARN1: string;
   let WARN2: string;
   let confVer: ConformanceVersion;
   let collector: ParamCollector;

   beforeEach(() => {
      collector = new ParamCollector();
      confVer = new ConformanceVersion();
      WARN1 = WID.ENTITYDECL_XRA_DECLARATION;
      WARN2 = WID.ELEMENT_NAME_XMLCOLON_RESERVED;
   });

   it('adds no errors if a name is not passed in', () => {
      nameXmlCheck(undefined, collector, confVer, 'ELEMENT', WARN1, WARN2);

      // @ts-expect-error 2329/matchers
      expect(collector).not.toHaveAnyProblems();
   });

   it('reports no errors if the name does not start with "xml" (§3.0.0)', () => {
      nameXmlCheck(
         toSToken('foo'),
         collector,
         new ConformanceVersion(1, 5),
         'ELEMENT',
         WARN1,
         WARN2,
      );

      // @ts-expect-error 2329/matchers
      expect(collector).not.toHaveAnyProblems();
   });

   it('reports a warning if the name starts with "xml" (§3.0.0)', () => {
      nameXmlCheck(
         toSToken('xmlblah'),
         collector,
         new ConformanceVersion(1, 5),
         'ELEMENT',
         WARN1,
         WARN2,
      );

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWFWarning({
         id: WARN2,
         params: ['xmlblah'],
         position: undefined,
      });
   });

   it('reports no errors if this is an xml:lang attriute', () => {
      nameXmlCheck(
         toSToken('xml:lang'),
         collector,
         new ConformanceVersion(1, 5),
         'ATTRIBUTE',
         WARN1,
         WARN2,
      );

      // @ts-expect-error 2329/matchers
      expect(collector).not.toHaveAnyProblems();
   });

   it('reports no errors if this is an xml:space attriute', () => {
      nameXmlCheck(
         toSToken('xml:space'),
         collector,
         new ConformanceVersion(1, 5),
         'ATTRIBUTE',
         WARN1,
         WARN2,
      );

      // @ts-expect-error 2329/matchers
      expect(collector).not.toHaveAnyProblems();
   });

   it('reports a warning if XML:LANG is provided', () => {
      nameXmlCheck(
         toSToken('XML:LANG'),
         collector,
         new ConformanceVersion(1, 5),
         'ATTRIBUTE',
         WARN1,
         WARN2,
      );

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWFWarning({
         id: WARN2,
         params: ['XML:LANG'],
         position: undefined,
      });
   });

   it('reports no warning if the version is 1.0/6, and the element name starts with "xml" (§3.0.0)', () => {
      nameXmlCheck(
         toSToken('xmlFoo'),
         collector,
         new ConformanceVersion(1, 6),
         'ELEMENT',
         WARN1,
         WARN2,
      );

      // @ts-expect-error 2329/matchers
      expect(collector).not.toHaveAnyProblems();
   });

   it('reports a warning if the version is 1.0/6, and the PI name starts with "xml-"', () => {
      nameXmlCheck(
         toSToken('xml-Foo'),
         collector,
         new ConformanceVersion(1, 6),
         'PI',
         WARN1,
         WARN2,
      );

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWFWarning({
         id: WARN1,
         params: ['xml-Foo'],
         position: undefined,
      });
   });

   it('reports a warning if the version is 1.0/6, and the element or attr name starts with "xml:"', () => {
      nameXmlCheck(
         toSToken('xml:Foo'),
         collector,
         new ConformanceVersion(1, 6),
         'ATTRIBUTE',
         WARN1,
         WARN2,
      );

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWFWarning({
         id: WARN1,
         params: ['xml:Foo'],
         position: undefined,
      });
   });

   it('reports no warning if the version is 1.0/6, and the element name starts with "xml" (§3.0.0)', () => {
      nameXmlCheck(
         toSToken('xmlFoo'),
         collector,
         new ConformanceVersion(1, 6),
         'ELEMENT',
         WARN1,
         WARN2,
      );

      // @ts-expect-error 2329/matchers
      expect(collector).not.toHaveAnyProblems();
   });

   it('reports no warning if the version is 1.0/6, and the entity name starts with "xml"', () => {
      nameXmlCheck(
         toSToken('xmlFoo'),
         collector,
         new ConformanceVersion(1, 6),
         'ENTITY',
         WARN1,
         WARN2,
      );

      // @ts-expect-error 2329/matchers
      expect(collector).not.toHaveAnyProblems();
   });

   it('reports no warning if the version is 1.0/6, and the PI name starts with "xml"', () => {
      nameXmlCheck(toSToken('xmlFoo'), collector, new ConformanceVersion(1, 6), 'PI', WARN1, WARN2);

      // @ts-expect-error 2329/matchers
      expect(collector).not.toHaveAnyProblems();
   });

   it('reports a warning if the version is 1.0/5, and the name starts with "xml"', () => {
      nameXmlCheck(
         toSToken('xmlFoo'),
         collector,
         new ConformanceVersion(1, 5),
         'ENTITY',
         WARN1,
         WARN2,
      );

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWFWarning({
         id: WARN2,
         params: ['xmlFoo'],
         position: undefined,
      });
   });

   it('reports a warning if the version is 1.0/5, and the PI name starts with "xml-"', () => {
      nameXmlCheck(
         toSToken('xml-Foo'),
         collector,
         new ConformanceVersion(1, 5),
         'PI',
         WARN1,
         WARN2,
      );

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWFWarning({
         id: WARN2,
         params: ['xml-Foo'],
         position: undefined,
      });
   });

   it('reports a warning if the version is 1.0/5, and the element name starts with "xml:" (§3.0.0)', () => {
      nameXmlCheck(
         toSToken('xml:Foo'),
         collector,
         new ConformanceVersion(1, 5),
         'ELEMENT',
         WARN1,
         WARN2,
      );

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWFWarning({
         id: WARN2,
         params: ['xml:Foo'],
         position: undefined,
      });
   });
});
