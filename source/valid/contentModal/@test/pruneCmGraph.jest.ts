/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { CmGraph } from '../cmGraphTypes';

import { pruneCmGraph } from '../pruneCmGraph';

describe('pruneCmGraph()', () => {
   it('removes autoTrans and dead states', () => {
      const graph: CmGraph = {
         startId: 0,
         endId: 1,
         states: {
            '0': {
               id: 0,
               autoTrans: [],
               trans: {
                  a: {
                     ref: '/1,/3/1',
                     stateId: 7,
                  },
                  b: {
                     ref: '/2,/3/2/1',
                     stateId: 8,
                  },
                  c: {
                     ref: '/3/2/2',
                     stateId: 6,
                  },
               },
               done: true,
            },
            '1': {
               id: 1,
               autoTrans: [],
               trans: {},
               done: true,
            },
            '2': {
               id: 2,
               autoTrans: [],
               trans: {
                  a: {
                     ref: '/1',
                     stateId: 2,
                  },
               },
               done: true,
            },
            '3': {
               id: 3,
               autoTrans: [],
               trans: {
                  a: {
                     ref: '/3/1',
                     stateId: 5,
                  },
                  b: {
                     ref: '/3/2/1',
                     stateId: 6,
                  },
                  c: {
                     ref: '/3/2/2',
                     stateId: 6,
                  },
               },
            },
            '4': {
               id: 4,
               autoTrans: [],
               trans: {
                  a: {
                     ref: '/3/1',
                     stateId: 5,
                  },
                  b: {
                     ref: '/3/2/1',
                     stateId: 6,
                  },
                  c: {
                     ref: '/3/2/2',
                     stateId: 6,
                  },
               },
               done: true,
            },
            '5': {
               id: 5,
               autoTrans: [],
               trans: {
                  b: {
                     ref: '/3/2/1',
                     stateId: 6,
                  },
                  c: {
                     ref: '/3/2/2',
                     stateId: 6,
                  },
               },
            },
            '6': {
               id: 6,
               autoTrans: [],
               trans: {
                  a: {
                     ref: '/3/1',
                     stateId: 5,
                  },
                  b: {
                     ref: '/3/2/1',
                     stateId: 6,
                  },
                  c: {
                     ref: '/3/2/2',
                     stateId: 6,
                  },
               },
               done: true,
            },
            '7': {
               id: 7,
               autoTrans: [],
               trans: {
                  b: {
                     ref: '/3/2/1',
                     stateId: 6,
                  },
                  c: {
                     ref: '/3/2/2',
                     stateId: 6,
                  },
                  a: {
                     ref: '/1',
                     stateId: 2,
                  },
               },
               done: true,
            },
            '8': {
               id: 8,
               autoTrans: [],
               trans: {
                  a: {
                     ref: '/3/1',
                     stateId: 5,
                  },
                  b: {
                     ref: '/3/2/1',
                     stateId: 6,
                  },
                  c: {
                     ref: '/3/2/2',
                     stateId: 6,
                  },
               },
               done: true,
            },
         },
      };

      const result = pruneCmGraph(graph);

      expect(result).toEqual({
         startId: 0,
         endId: 1,
         states: {
            '0': {
               id: 0,
               trans: {
                  a: {
                     ref: '/1,/3/1',
                     stateId: 7,
                  },
                  b: {
                     ref: '/2,/3/2/1',
                     stateId: 8,
                  },
                  c: {
                     ref: '/3/2/2',
                     stateId: 6,
                  },
               },
               done: true,
            },
            '1': {
               id: 1,
               trans: {},
               done: true,
            },
            '2': {
               id: 2,
               trans: {
                  a: {
                     ref: '/1',
                     stateId: 2,
                  },
               },
               done: true,
            },
            '5': {
               id: 5,
               trans: {
                  b: {
                     ref: '/3/2/1',
                     stateId: 6,
                  },
                  c: {
                     ref: '/3/2/2',
                     stateId: 6,
                  },
               },
            },
            '6': {
               id: 6,
               trans: {
                  a: {
                     ref: '/3/1',
                     stateId: 5,
                  },
                  b: {
                     ref: '/3/2/1',
                     stateId: 6,
                  },
                  c: {
                     ref: '/3/2/2',
                     stateId: 6,
                  },
               },
               done: true,
            },
            '7': {
               id: 7,
               trans: {
                  b: {
                     ref: '/3/2/1',
                     stateId: 6,
                  },
                  c: {
                     ref: '/3/2/2',
                     stateId: 6,
                  },
                  a: {
                     ref: '/1',
                     stateId: 2,
                  },
               },
               done: true,
            },
            '8': {
               id: 8,
               trans: {
                  a: {
                     ref: '/3/1',
                     stateId: 5,
                  },
                  b: {
                     ref: '/3/2/1',
                     stateId: 6,
                  },
                  c: {
                     ref: '/3/2/2',
                     stateId: 6,
                  },
               },
               done: true,
            },
         },
      });
   });

   it('does nothing with a graph that has no autotrans', () => {
      const graph: CmGraph = {
         startId: 0,
         endId: 1,
         states: {
            '0': {
               id: 0,
               trans: {
                  a: {
                     ref: '/1,/3/1',
                     stateId: 1,
                  },
                  b: {
                     ref: '/2,/3/2/1',
                     stateId: 1,
                  },
                  c: {
                     ref: '/3/2/2',
                     stateId: 1,
                  },
               },
               done: true,
            },
            '1': {
               id: 1,
               trans: {},
               done: true,
            },
         },
      };

      const result = pruneCmGraph(graph);

      expect(result).toEqual({
         startId: 0,
         endId: 1,
         states: {
            '0': {
               id: 0,
               trans: {
                  a: {
                     ref: '/1,/3/1',
                     stateId: 1,
                  },
                  b: {
                     ref: '/2,/3/2/1',
                     stateId: 1,
                  },
                  c: {
                     ref: '/3/2/2',
                     stateId: 1,
                  },
               },
               done: true,
            },
            '1': {
               id: 1,
               trans: {},
               done: true,
            },
         },
      });
   });
});
