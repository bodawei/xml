/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import nameListGraph from '../nameListGraph';

import {
   graphFromNameList
} from '../nameList';
import { ContentModelX, CpRepeat, CpType } from 'source/xToken/common/contentModelX';

describe('nameList (unit)', () => {

   beforeEach(() => {
   });

   describe('graphFromNameList()', () => {
      let nameListToGraphSpy: jasmine.Spy;
      let collapseAutoTransSpy: jasmine.Spy;
      let pruneNameListGraphSpy: jasmine.Spy;

      beforeEach(() => {
         nameListToGraphSpy = spyOn(nameListGraph, 'nameListToGraph');
         collapseAutoTransSpy = spyOn(nameListGraph, 'collapseAutoTrans');
         pruneNameListGraphSpy = spyOn(nameListGraph, 'pruneNameListGraph');
      });

      it('calls graph construction routines', () => {
         const list: ContentModelX = {
            particles: [],
            listType: CpType.CHOICE,
            repeat: CpRepeat.ONE,
         };
         const graph = {
            startId: 1,
            endId: 1,
            states: {
               1: {
                  id: 1,
                  trans: {},
               }
            },
         };
         nameListToGraphSpy.and.returnValues(graph);
         const result = graphFromNameList(list);

         expect(result).toEqual(graph);
         expect(nameListToGraphSpy).toHaveBeenCalledWith(list);
         expect(collapseAutoTransSpy).toHaveBeenCalledWith(graph);
         expect(pruneNameListGraphSpy).toHaveBeenCalledWith(graph);
      });

   });
});
