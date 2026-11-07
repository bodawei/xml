/* Copyright ® 2018-2026 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { MutableCmGraph } from '../cmGraphTypes';
import { pruneCmGraph } from '../pruneCmGraph';

describe('pruneCmGraph()', () => {
   it('removes autoTrans and dead states', () => {
      const graph: MutableCmGraph = {
         endId: 1,
         startId: 0,
         states: {
            '0': {
               autoTrans: [],
               done: true,
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
            },
            '1': {
               autoTrans: [],
               done: true,
               id: 1,
               trans: {},
            },
            '2': {
               autoTrans: [],
               done: true,
               id: 2,
               trans: {
                  a: {
                     ref: '/1',
                     stateId: 2,
                  },
               },
            },
            '3': {
               autoTrans: [],
               id: 3,
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
               autoTrans: [],
               done: true,
               id: 4,
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
            '5': {
               autoTrans: [],
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
               autoTrans: [],
               done: true,
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
            },
            '7': {
               autoTrans: [],
               done: true,
               id: 7,
               trans: {
                  a: {
                     ref: '/1',
                     stateId: 2,
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
            '8': {
               autoTrans: [],
               done: true,
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
            },
         },
      };

      const result = pruneCmGraph(graph);

      expect(result).toEqual({
         endId: 1,
         startId: 0,
         states: {
            '0': {
               done: true,
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
            },
            '1': {
               done: true,
               id: 1,
               trans: {},
            },
            '2': {
               done: true,
               id: 2,
               trans: {
                  a: {
                     ref: '/1',
                     stateId: 2,
                  },
               },
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
               done: true,
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
            },
            '7': {
               done: true,
               id: 7,
               trans: {
                  a: {
                     ref: '/1',
                     stateId: 2,
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
            '8': {
               done: true,
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
            },
         },
      });
   });

   it('does nothing with a graph that has no autotrans', () => {
      const graph: MutableCmGraph = {
         endId: 1,
         startId: 0,
         states: {
            '0': {
               done: true,
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
            },
            '1': {
               done: true,
               id: 1,
               trans: {},
            },
         },
      };

      const result = pruneCmGraph(graph);

      expect(result).toEqual({
         endId: 1,
         startId: 0,
         states: {
            '0': {
               done: true,
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
            },
            '1': {
               done: true,
               id: 1,
               trans: {},
            },
         },
      });
   });
});
