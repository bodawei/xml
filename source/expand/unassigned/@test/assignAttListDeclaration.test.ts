/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import {
   AttListPToken,
   AttDefPToken,
   UnassignedArray,
   wordFromSToken,
   WordListPToken,
   WordListType,
   UnassignedType,
} from 'token';
import { toSToken } from 'sToken';

import * as assignToProps from '../assignToProps';
import * as assignWordList from '../assignWordList';

import { assignAttListDeclaration } from '../assignAttListDeclaration';

describe('assignAttListDeclaration() (unit)', () => {
   let assignToPropsSpy: jasmine.Spy;
   let assignWordListSpy: jasmine.Spy;
   let simpleUnassigned: UnassignedArray;

   beforeEach(() => {
      assignToPropsSpy = spyOn(assignToProps, 'assignToProps');
      assignWordListSpy = spyOn(assignWordList, 'assignWordList');

      simpleUnassigned = [wordFromSToken(toSToken('foo'))];
   });

   it('does not call assignToProps() if there is no unassigned', () => {
      assignAttListDeclaration(
         undefined,
         new AttListPToken({
            open: toSToken('<!'),
         }),
      );

      expect(assignToPropsSpy).not.toHaveBeenCalled();
   });

   it('deletes the unassigned property if it is empty', () => {
      const alPToken = new AttListPToken({
         open: toSToken('<!'),
         nextPropName: 'elementName',
      });

      assignAttListDeclaration([], alPToken);
   });

   it('does not call assignToProps() if there is still an unexpanded param ref', () => {
      const alPToken = new AttListPToken({
         open: toSToken('<!'),
      });

      assignAttListDeclaration(
         [
            {
               type: UnassignedType.REFERENCE,
            },
         ] as any,
         alPToken,
      );

      expect(assignToPropsSpy).not.toHaveBeenCalled();
   });

   describe('unassigned in elementName', () => {
      it('calls unassigned.assignToProps() when the match is in the el name', () => {
         const declPToken = new AttListPToken({
            open: toSToken('<!'),
            nextPropName: 'elementName',
         });

         assignAttListDeclaration(simpleUnassigned, declPToken);

         expect(assignToPropsSpy).toHaveBeenCalledWith(
            simpleUnassigned,
            declPToken,
            'elementName',
            [
               { name: 'declTypeSpace', type: 'space' },
               { name: 'elementName', type: 'word' },
               { name: 'postElementNameSpace', type: 'space' },
            ],
         );
      });
   });

   describe('unassigned in attribute name', () => {
      it('calls unassigned.assignToProps() with "xtra" if missing is name', () => {
         const declPToken = new AttListPToken({
            open: toSToken('<!'),
            nextPropName: 'name',
         });

         assignAttListDeclaration(simpleUnassigned, declPToken);

         expect(assignToPropsSpy).toHaveBeenCalledWith(simpleUnassigned, {}, 'name', [
            { name: 'xtra', type: 'space' },
            { name: 'name', type: 'word' },
            { name: 'postNameSpace', type: 'space' },
            { name: 'type', type: 'word', allowed: /^[^#(].*/i },
            { name: 'postTypeSpace', type: 'space' },
         ]);

         expect(assignToPropsSpy).toHaveBeenCalledWith(simpleUnassigned, {}, 'defaultType', [
            { name: 'defaultType', type: 'word', allowed: /^[#].*/i },
            { name: 'postDefaultTypeSpace', type: 'space' },
            { name: 'value', type: 'literal' },
            { name: 'postValueSpace', type: 'space' },
         ]);
      });

      it('adds a space before the first attribute to the postElementNameSpace', () => {
         assignToPropsSpy.and.callFake((unassigned: UnassignedArray, pToken: AttDefPToken) => {
            unassigned.pop();
            pToken.xtra = toSToken('\t');
         });
         const declPToken = new AttListPToken({
            open: toSToken('<!'),
            nextPropName: 'name',
         });

         assignAttListDeclaration(simpleUnassigned, declPToken);

         expect(declPToken).toEqual(
            new AttListPToken({
               open: toSToken('<!'),
               postElementNameSpace: toSToken('\t'),
               attDefs: [{} as any],
               nextPropName: 'name',
               extra: [],
            }),
         );
      });

      it('appends a space before the first attribute to the postElementNameSpace', () => {
         assignToPropsSpy.and.callFake((unassigned: UnassignedArray, pToken: AttDefPToken) => {
            unassigned.pop();
            pToken.xtra = toSToken('\t');
         });
         const declPToken = new AttListPToken({
            open: toSToken('<!'),
            postElementNameSpace: toSToken(' '),
            nextPropName: 'name',
         });

         assignAttListDeclaration(simpleUnassigned, declPToken);

         expect(declPToken).toEqual(
            new AttListPToken({
               open: toSToken('<!'),
               postElementNameSpace: toSToken(' \t'),
               attDefs: [{}] as any,
               nextPropName: 'name',
               extra: [],
            }),
         );
      });

      it('adds a space to the previous postNameSpace', () => {
         assignToPropsSpy.and.callFake((unassigned: UnassignedArray, pToken: AttDefPToken) => {
            unassigned.pop();
            pToken.xtra = toSToken('\t');
         });
         const declPToken = new AttListPToken({
            open: toSToken('<!'),
            attDefs: [{}] as any,
            nextPropName: 'name',
         });

         assignAttListDeclaration(simpleUnassigned, declPToken);

         expect(declPToken).toEqual(
            new AttListPToken({
               open: toSToken('<!'),
               attDefs: [
                  {
                     postNameSpace: toSToken('\t'),
                  },
                  {},
               ] as any,
               nextPropName: 'name',
               extra: [],
            }),
         );
      });

      it('merges a space into the previous postNameSpace', () => {
         assignToPropsSpy.and.callFake((unassigned: UnassignedArray, pToken: AttDefPToken) => {
            unassigned.pop();
            pToken.xtra = toSToken('\t');
         });
         const declPToken = new AttListPToken({
            open: toSToken('<!'),
            attDefs: [
               {
                  postNameSpace: toSToken(' '),
               },
            ] as any,
            nextPropName: 'name',
         });

         assignAttListDeclaration(simpleUnassigned, declPToken);

         expect(declPToken).toEqual(
            new AttListPToken({
               open: toSToken('<!'),
               attDefs: [
                  {
                     postNameSpace: toSToken(' \t'),
                  },
                  {},
               ] as any,
               nextPropName: 'name',
               extra: [],
            }),
         );
      });

      it('adds a space to the previous postTypeSpace', () => {
         assignToPropsSpy.and.callFake((unassigned: UnassignedArray, pToken: AttDefPToken) => {
            unassigned.pop();
            pToken.xtra = toSToken('\t');
         });
         const declPToken = new AttListPToken({
            open: toSToken('<!'),
            attDefs: [
               {
                  name: toSToken('foo'),
                  type: toSToken('lala'),
               },
            ] as any,
            nextPropName: 'name',
         });

         assignAttListDeclaration(simpleUnassigned, declPToken);

         expect(declPToken).toEqual(
            new AttListPToken({
               open: toSToken('<!'),
               attDefs: [
                  {
                     name: toSToken('foo'),
                     type: toSToken('lala'),
                     postTypeSpace: toSToken('\t'),
                  },
                  {},
               ] as any,
               nextPropName: 'name',
               extra: [],
            }),
         );
      });

      it('merges a space into the previous postTypeSpace', () => {
         assignToPropsSpy.and.callFake((unassigned: UnassignedArray, pToken: AttDefPToken) => {
            unassigned.pop();
            pToken.xtra = toSToken('\t');
         });
         const declPToken = new AttListPToken({
            open: toSToken('<!'),
            attDefs: [
               {
                  type: toSToken('lala'),
                  postTypeSpace: toSToken(' '),
               },
            ] as any,
            nextPropName: 'name',
         });

         assignAttListDeclaration(simpleUnassigned, declPToken);

         expect(declPToken).toEqual(
            new AttListPToken({
               open: toSToken('<!'),
               attDefs: [
                  {
                     type: toSToken('lala'),
                     postTypeSpace: toSToken(' \t'),
                  },
                  {},
               ] as any,
               nextPropName: 'name',
               extra: [],
            }),
         );
      });

      it('adds a space to the previous postDefaultTypeSpace', () => {
         assignToPropsSpy.and.callFake((unassigned: UnassignedArray, pToken: AttDefPToken) => {
            unassigned.pop();
            pToken.xtra = toSToken('\t');
         });
         const declPToken = new AttListPToken({
            open: toSToken('<!'),
            attDefs: [
               {
                  defaultType: toSToken('lala'),
               },
            ] as any,
            nextPropName: 'name',
         });

         assignAttListDeclaration(simpleUnassigned, declPToken);

         expect(declPToken).toEqual(
            new AttListPToken({
               open: toSToken('<!'),
               attDefs: [
                  {
                     defaultType: toSToken('lala'),
                     postDefaultTypeSpace: toSToken('\t'),
                  },
                  {},
               ] as any,
               nextPropName: 'name',
               extra: [],
            }),
         );
      });

      it('merges a space into the previous postDefaultTypeSpace', () => {
         assignToPropsSpy.and.callFake((unassigned: UnassignedArray, pToken: AttDefPToken) => {
            unassigned.pop();
            pToken.xtra = toSToken('\t');
         });
         const declPToken = new AttListPToken({
            open: toSToken('<!'),
            attDefs: [
               {
                  defaultType: toSToken('lala'),
                  postDefaultTypeSpace: toSToken(' '),
               },
            ] as any,
            nextPropName: 'name',
         });

         assignAttListDeclaration(simpleUnassigned, declPToken);

         expect(declPToken).toEqual(
            new AttListPToken({
               open: toSToken('<!'),
               attDefs: [
                  {
                     defaultType: toSToken('lala'),
                     postDefaultTypeSpace: toSToken(' \t'),
                  },
                  {},
               ] as any,
               nextPropName: 'name',
               extra: [],
            }),
         );
      });

      it('adds a space to the previous postValueSpace', () => {
         assignToPropsSpy.and.callFake((unassigned: UnassignedArray, pToken: AttDefPToken) => {
            unassigned.pop();
            pToken.xtra = toSToken('\t');
         });
         const declPToken = new AttListPToken({
            open: toSToken('<!'),
            attDefs: [
               {
                  value: {},
               },
            ] as any,
            nextPropName: 'name',
         });

         assignAttListDeclaration(simpleUnassigned, declPToken);

         expect(declPToken).toEqual(
            new AttListPToken({
               open: toSToken('<!'),
               attDefs: [
                  {
                     value: {},
                     postValueSpace: toSToken('\t'),
                  },
                  {},
               ] as any,
               nextPropName: 'name',
               extra: [],
            }),
         );
      });

      it('merges a space into the previous postValueSpace', () => {
         assignToPropsSpy.and.callFake((unassigned: UnassignedArray, pToken: AttDefPToken) => {
            unassigned.pop();
            pToken.xtra = toSToken('\t');
         });
         const declPToken = new AttListPToken({
            open: toSToken('<!'),
            attDefs: [
               {
                  value: {},
                  postValueSpace: toSToken(' '),
               },
            ] as any,
            nextPropName: 'name',
         });

         assignAttListDeclaration(simpleUnassigned, declPToken);

         expect(declPToken).toEqual(
            new AttListPToken({
               open: toSToken('<!'),
               attDefs: [
                  {
                     value: {},
                     postValueSpace: toSToken(' \t'),
                  },
                  {},
               ] as any,
               nextPropName: 'name',
               extra: [],
            }),
         );
      });

      it('copes with attribute definitions not having xtra spaces', () => {
         assignToPropsSpy.and.callFake((unassigned: UnassignedArray, pToken: AttDefPToken) => {
            unassigned.pop();
            // pToken.xtra = toSToken('\t');
         });
         const declPToken = new AttListPToken({
            open: toSToken('<!'),
            attDefs: [
               {
                  value: {},
                  postValueSpace: toSToken(' '),
               },
            ] as any,
            nextPropName: 'name',
         });

         assignAttListDeclaration(simpleUnassigned, declPToken);

         expect(declPToken).toEqual(
            new AttListPToken({
               open: toSToken('<!'),
               attDefs: [
                  {
                     value: {},
                     postValueSpace: toSToken(' '),
                  },
                  {},
               ] as any,
               nextPropName: 'name',
               extra: [],
            }),
         );
      });
   });

   describe('unassigned in attribute type', () => {
      it('calls unassigned.assignToProps() with no "xtra" if missing is type', () => {
         const declPToken = new AttListPToken({
            open: toSToken('<!'),
            nextPropName: 'type',
            attDefs: [{}] as any,
         });

         assignAttListDeclaration(simpleUnassigned, declPToken);

         expect(assignToPropsSpy.calls.argsFor(0)).toEqual([
            simpleUnassigned,
            {},
            'type',
            [
               { name: 'name', type: 'word' },
               { name: 'postNameSpace', type: 'space' },
               { name: 'type', type: 'word', allowed: /^[^#(].*/i },
               { name: 'postTypeSpace', type: 'space' },
            ],
         ]);

         expect(assignToPropsSpy.calls.argsFor(1)).toEqual([
            simpleUnassigned,
            {},
            'defaultType',
            [
               { name: 'defaultType', type: 'word', allowed: /^[#].*/i },
               { name: 'postDefaultTypeSpace', type: 'space' },
               { name: 'value', type: 'literal' },
               { name: 'postValueSpace', type: 'space' },
            ],
         ]);
      });

      it('assigns a enumeration if there is no type', () => {
         const declPToken = new AttListPToken({
            open: toSToken('<!'),
            nextPropName: 'type',
            attDefs: [{}] as any,
         });
         // consume one unassigned value, so the system thinks we got a nameList
         assignWordListSpy.and.callFake((unassignedVals: Array<any>, list: any) =>
            unassignedVals.pop(),
         );

         assignAttListDeclaration(simpleUnassigned, declPToken);

         expect(declPToken.attDefs[0].enumeration).not.toBeUndefined();
      });

      it('assigns a nameList if type is ""', () => {
         const declPToken = new AttListPToken({
            open: toSToken('<!'),
            nextPropName: 'defaultType',
            attDefs: [
               {
                  type: toSToken(''),
               },
            ] as any,
         });
         // consume one unassigned value, so the system thinks we got an enumeration
         assignWordListSpy.and.callFake((unassignedVals: Array<any>, list: any) =>
            unassignedVals.pop(),
         );

         assignAttListDeclaration(simpleUnassigned, declPToken);

         expect(declPToken.attDefs[0].enumeration).not.toBeUndefined();
      });

      it('assigns a nameList if type is NOTATION', () => {
         const declPToken = new AttListPToken({
            open: toSToken('<!'),
            nextPropName: 'defaultType',
            attDefs: [
               {
                  type: toSToken('NOTATION'),
               },
            ] as any,
         });
         // consume one unassigned value, so the system thinks we got an enumeration
         assignWordListSpy.and.callFake((unassignedVals: Array<any>, list: any) =>
            unassignedVals.pop(),
         );

         assignAttListDeclaration(simpleUnassigned, declPToken);

         expect(declPToken.attDefs[0].enumeration).not.toBeUndefined();
      });

      it('assigns no enumeration if enumeration.assignUnassigned consumes no tokens', () => {
         const declPToken = new AttListPToken({
            open: toSToken('<!'),
            nextPropName: 'type',
            attDefs: [{}] as any,
         });

         assignAttListDeclaration(simpleUnassigned, declPToken);

         expect(declPToken.attDefs[0].enumeration).toBeUndefined();
      });

      it('calls unassigned.assignToProps() with a postTypeSpace descriptor if this left off on a defaultType', () => {
         const attDef = {
            type: toSToken('CDATA'),
         };
         const declPToken = new AttListPToken({
            open: toSToken('<!'),
            nextPropName: 'defaultType',
            attDefs: [attDef] as any,
         });

         assignAttListDeclaration(simpleUnassigned, declPToken);

         expect(assignToPropsSpy.calls.argsFor(0)).toEqual([
            simpleUnassigned,
            attDef,
            'defaultType',
            [
               { name: 'name', type: 'word' },
               { name: 'postNameSpace', type: 'space' },
               { name: 'type', type: 'word', allowed: /^[^#(].*/i },
               { name: 'postTypeSpace', type: 'space' },
            ],
         ]);

         expect(assignToPropsSpy.calls.argsFor(1)).toEqual([
            simpleUnassigned,
            attDef,
            'defaultType',
            [
               { name: 'postTypeSpace', type: 'space' },
               { name: 'defaultType', type: 'word', allowed: /^[#].*/i },
               { name: 'postDefaultTypeSpace', type: 'space' },
               { name: 'value', type: 'literal' },
               { name: 'postValueSpace', type: 'space' },
            ],
         ]);
      });
   });

   describe('unassigned in enumeration', () => {
      it('builds on the attribute definitions enumeration if that is already in play', () => {
         const enumeration = new WordListPToken(WordListType.ENUMERATION, {
            open: toSToken('('),
         });
         const expectedEnumeration = new WordListPToken(WordListType.ENUMERATION, {
            open: toSToken('('),
            close: toSToken(')'),
         });
         const declPToken = new AttListPToken({
            open: toSToken('<!'),
            nextPropName: 'defaultType',
            attDefs: [
               {
                  name: toSToken('name'),
                  enumeration,
                  value: [],
               },
            ],
         });
         assignWordListSpy.and.callFake((un, token) => {
            token.close = expectedEnumeration.close;
         });
         const expected: AttDefPToken = {
            name: toSToken('name'),
            enumeration: expectedEnumeration,
            value: [],
         };
         // consume one unassigned value, so the system thinks we got a nameList
         assignWordListSpy.and.callFake((unassignedVals: Array<any>, list: any) => {
            unassignedVals.pop();
            list.close = expectedEnumeration.close;
         });

         assignAttListDeclaration(simpleUnassigned, declPToken);

         expect(declPToken.attDefs[0]).toEqual(expected);
      });
   });

   describe('unassigned in value', () => {
      it('does not call nameList.assignUnassigned() if the next property is value', () => {
         const declPToken = new AttListPToken({
            open: toSToken('<!'),
            unassigned: simpleUnassigned,
            nextPropName: 'value',
            attDefs: [{}] as any,
         });

         assignAttListDeclaration(simpleUnassigned, declPToken);

         expect(assignWordListSpy).not.toHaveBeenCalled();
      });
   });
});
