/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { ContentModelP } from 'pToken';

import { makeCmGraph } from '../makeCmGraph';
import * as cmToCmGraphModule from '../cmToCmGraph';
import * as collapseAutoTransModule from '../collapseAutoTrans';
import * as pruneCmGraphModule from '../pruneCmGraph';

jest.mock('../cmToCmGraph');
jest.mock('../collapseAutoTrans');
jest.mock('../pruneCmGraph');

describe('nameList (unit)', () => {
   beforeEach(() => {});

   describe('makeCmGraph()', () => {
      let cmToCmGraph: jest.MockedFunction<typeof cmToCmGraphModule.cmToCmGraph>;
      let collapseAutoTrans: jest.MockedFunction<typeof collapseAutoTransModule.collapseAutoTrans>;
      let pruneCmGraph: jest.MockedFunction<typeof pruneCmGraphModule.pruneCmGraph>;

      beforeEach(async () => {
         ({ cmToCmGraph } = (await import('../cmToCmGraph')) as {
            cmToCmGraph: jest.MockedFunction<typeof cmToCmGraphModule.cmToCmGraph>;
         });
         ({ collapseAutoTrans } = (await import('../collapseAutoTrans')) as {
            collapseAutoTrans: jest.MockedFunction<
               typeof collapseAutoTransModule.collapseAutoTrans
            >;
         });
         ({ pruneCmGraph } = (await import('../pruneCmGraph')) as {
            pruneCmGraph: jest.MockedFunction<typeof pruneCmGraphModule.pruneCmGraph>;
         });
      });

      it('calls graph construction routines', () => {
         const model: ContentModelP = {
            delimitedParticles: [],
         };
         const graph = {
            startId: 1,
            endId: 1,
            states: {
               1: {
                  id: 1,
                  trans: {},
               },
            },
         };
         cmToCmGraph.mockReturnValue(graph);

         const result = makeCmGraph(model);

         expect(result).toEqual(graph);
         expect(cmToCmGraph).toHaveBeenCalledWith(model);
         expect(collapseAutoTrans).toHaveBeenCalledWith(graph);
         expect(pruneCmGraph).toHaveBeenCalledWith(graph);
      });
   });
});
