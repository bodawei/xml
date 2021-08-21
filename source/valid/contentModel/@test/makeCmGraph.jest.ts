/* Copyright ® 2018-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { ContentModelP } from 'pToken';

import { makeCmGraph } from '../makeCmGraph';
import { cmToCmGraph } from '../cmToCmGraph';
import { collapseAutoTrans } from '../collapseAutoTrans';
import { pruneCmGraph } from '../pruneCmGraph';

jest.mock('../cmToCmGraph');
jest.mock('../collapseAutoTrans');
jest.mock('../pruneCmGraph');

describe('makeCmGraph (unit)', () => {
   let cmToCmGraphMock: jest.MockedFunction<typeof cmToCmGraph>;
   let collapseAutoTransMock: jest.MockedFunction<typeof collapseAutoTrans>;
   let pruneCmGraphMock: jest.MockedFunction<typeof pruneCmGraph>;

   beforeEach(() => {
      cmToCmGraphMock = cmToCmGraph as jest.MockedFunction<typeof cmToCmGraph>;
      collapseAutoTransMock = collapseAutoTrans as jest.MockedFunction<typeof collapseAutoTrans>;
      pruneCmGraphMock = pruneCmGraph as jest.MockedFunction<typeof pruneCmGraph>;
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
