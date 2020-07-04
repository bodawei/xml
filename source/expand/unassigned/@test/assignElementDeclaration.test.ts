/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { toSToken } from 'sToken';
import {
   ElementDeclarationPToken,
   NameListPToken,
   ParameterEntityReferencePToken,
   UnassignedType,
   UnassignedArray,
   wordFromSToken,
} from 'token';

import * as assignToProps from '../assignToProps';
import * as nameList from '../assignNameList';

import { assignElementDeclaration } from '../assignElementDeclaration';

describe('assignElementDeclaration()', () => {
   let elementPToken: ElementDeclarationPToken;
   let testUnassigned: UnassignedArray;
   let unassignedAssignSpy: jasmine.Spy;

   beforeEach(() => {
      elementPToken = new ElementDeclarationPToken({
         open: toSToken('<!'),
         postOpenSpace: undefined,
         declType: toSToken('ELEMENT'),
         postDeclTypeSpace: toSToken(' '),
         name: toSToken('elementName'),
         postNameSpace: toSToken(' '),
         contentSpec: toSToken('ANY'),
         postContentSpecSpace: toSToken(' '),
         close: toSToken('>'),
      });
      testUnassigned = [wordFromSToken(toSToken('foo'))];

      unassignedAssignSpy = spyOn(assignToProps, 'assignToProps');
   });

   it('does not call assignToProps() if there is no unassigned', () => {
      assignElementDeclaration(undefined, elementPToken);

      expect(unassignedAssignSpy).not.toHaveBeenCalled();
   });

   it('does not change the nextPropName', () => {
      elementPToken.nextPropName = 'name';

      assignElementDeclaration([], elementPToken);

      expect(elementPToken.nextPropName).toEqual('name');
   });

   it('does not call assignToProps() if there is still an unexpanded param ref', () => {
      const unassigned: UnassignedArray = [
         {
            type: UnassignedType.REFERENCE,
            token: new ParameterEntityReferencePToken({ open: toSToken('%') }),
         },
      ];

      assignElementDeclaration(unassigned, elementPToken);

      expect(unassignedAssignSpy).not.toHaveBeenCalled();
   });

   it('calls unassigned.assignToProps() if the nextPropName is "name"', () => {
      elementPToken = new ElementDeclarationPToken({
         nextPropName: 'name',
      });

      assignElementDeclaration(testUnassigned, elementPToken);

      expect(unassignedAssignSpy).toHaveBeenCalledWith(testUnassigned, elementPToken, 'name', [
         { name: 'postDeclTypeSpace', type: 'space' },
         { name: 'name', type: 'word' },
         { name: 'postNameSpace', type: 'space' },
      ]);
   });

   it('calls unassigned.assignToProps() with the contentSpec if the nextPropName is "name"', () => {
      elementPToken = new ElementDeclarationPToken({
         nextPropName: 'name',
      });

      assignElementDeclaration(testUnassigned, elementPToken);

      expect(unassignedAssignSpy).toHaveBeenCalledWith(
         testUnassigned,
         elementPToken,
         'contentSpec',
         [
            { name: 'contentSpec', type: 'word' },
            { name: 'postContentSpecSpace', type: 'space' },
         ],
      );
   });

   it('calls unassigned.assignToProps() with only a space if the nextPropName is "contentSpec"', () => {
      elementPToken = new ElementDeclarationPToken({
         nextPropName: 'contentSpec',
      });

      assignElementDeclaration(testUnassigned, elementPToken);

      expect(unassignedAssignSpy).toHaveBeenCalledWith(
         testUnassigned,
         elementPToken,
         'postNameSpace',
         [{ name: 'postNameSpace', type: 'space' }],
      );
   });

   it('calls unassigned.assignToProps() with the contentSpec if the nextPropName is "contentSpec"', () => {
      elementPToken = new ElementDeclarationPToken({
         nextPropName: 'contentSpec',
      });

      assignElementDeclaration(testUnassigned, elementPToken);

      expect(unassignedAssignSpy).toHaveBeenCalledWith(
         testUnassigned,
         elementPToken,
         'contentSpec',
         [
            { name: 'contentSpec', type: 'word' },
            { name: 'postContentSpecSpace', type: 'space' },
         ],
      );
   });

   it('calls nameList.assignToProps() if we are mid-contentSpec', () => {
      const nlSpy = spyOn(nameList, 'assignNameList');
      elementPToken = new ElementDeclarationPToken({
         children: new NameListPToken(),
         nextPropName: 'midContentSpec',
      });

      assignElementDeclaration(testUnassigned, elementPToken);

      expect(nlSpy).toHaveBeenCalledWith(elementPToken.children!, testUnassigned);
   });

   it('calls nameList.assignToProps() if we left off with a contentSpec, and the first value is "("', () => {
      spyOn(nameList, 'assignNameList');
      const unassignedValues: UnassignedArray = [wordFromSToken(toSToken('('))];
      elementPToken = new ElementDeclarationPToken({
         nextPropName: 'contentSpec',
      });

      assignElementDeclaration(unassignedValues, elementPToken);

      // Adds the missing children.
      expect(elementPToken.children).toEqual(new NameListPToken());
      expect(nameList.assignNameList).toHaveBeenCalledWith(
         elementPToken.children!,
         unassignedValues,
      );
   });

   it('adds an "extra" property if the unassigned values are not consumed', () => {
      elementPToken = new ElementDeclarationPToken({
         nextPropName: 'name',
      });

      assignElementDeclaration(testUnassigned, elementPToken);

      expect(elementPToken.extra).toEqual(testUnassigned);
   });

   it('adds no "extra" property if the unassigned values are consumed', () => {
      elementPToken = new ElementDeclarationPToken({
         nextPropName: 'name',
      });
      unassignedAssignSpy.and.callFake((unValues) => unValues.pop());

      assignElementDeclaration(testUnassigned, elementPToken);

      expect(elementPToken.extra).toEqual([]);
   });

   it('removes all unassigned and nextPropName values but adds the unassigned to the peRefPlus', () => {
      elementPToken = new ElementDeclarationPToken({
         nextPropName: 'name',
         peRefPlus: testUnassigned,
      });

      assignElementDeclaration(testUnassigned, elementPToken);

      expect(elementPToken).toEqual(
         new ElementDeclarationPToken({
            nextPropName: 'name',
            extra: testUnassigned,
            peRefPlus: testUnassigned,
         }),
      );
   });
});
