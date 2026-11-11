/* Copyright ® 2018-2026 by 柏大衛. All rights reserved. */

import { ContentModelP } from 'pToken';
import { describe, expect, it, vi, type MockedFunction } from 'vitest';

import { cmToCmGraph } from '../cmToCmGraph';
import { collapseAutoTrans } from '../collapseAutoTrans';
import { makeCmGraph } from '../makeCmGraph';
import { pruneCmGraph } from '../pruneCmGraph';

vi.mock('../cmToCmGraph');
vi.mock('../collapseAutoTrans');
vi.mock('../pruneCmGraph');

describe('makeCmGraph (unit)', () => {
   let cmToCmGraphMock: MockedFunction<typeof cmToCmGraph>;
   let collapseAutoTransMock: MockedFunction<typeof collapseAutoTrans>;
   let pruneCmGraphMock: MockedFunction<typeof pruneCmGraph>;

   beforeEach(() => {
      cmToCmGraphMock = cmToCmGraph as MockedFunction<typeof cmToCmGraph>;
      collapseAutoTransMock = collapseAutoTrans as MockedFunction<typeof collapseAutoTrans>;
      pruneCmGraphMock = pruneCmGraph as MockedFunction<typeof pruneCmGraph>;
   });

   it('calls graph construction routines', () => {
      const model: ContentModelP = {
         delimitedParticles: [],
      };
      const graph = {
         endId: 1,
         startId: 1,
         states: {
            1: {
               id: 1,
               trans: {},
            },
         },
      };
      cmToCmGraphMock.mockReturnValue(graph);
      pruneCmGraphMock.mockImplementation((x) => x);

      const result = makeCmGraph(model);

      expect(result).toEqual(graph);
      expect(cmToCmGraphMock).toHaveBeenCalledWith(model);
      expect(collapseAutoTransMock).toHaveBeenCalledWith(graph);
      expect(pruneCmGraphMock).toHaveBeenCalledWith(graph);
   });
});
