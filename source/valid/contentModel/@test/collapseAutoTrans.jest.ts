/* Copyright ® 2018-2026 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { STokenSource } from 'basic';
import { parseContentModel } from 'pToken';

import { MutableCmGraph } from '../cmGraphTypes';
import { cmToCmGraph } from '../cmToCmGraph';
import { collapseAutoTrans } from '../collapseAutoTrans';

describe('collapseAutoTrans()', () => {
   function prepForDeAuto(input: string, cb: (graph: MutableCmGraph) => void) {
      const source = new STokenSource();
      source.addText(input);
      source.endText();
      parseContentModel(source, (result) => {
         const graph = cmToCmGraph(result!);
         cb(graph);
      });
   }

   it('converts a list of zero plus items', () => {
      // (first, (first)*, last)

      const foo: MutableCmGraph = {
         endId: 1,
         startId: 0,
         states: {
            0: {
               autoTrans: [],
               id: 0,
               trans: {
                  first: {
                     ref: '/1',
                     stateId: 2,
                  },
               },
            },
            1: {
               autoTrans: [],
               done: true,
               id: 1,
               trans: {},
            },
            2: {
               autoTrans: [4],
               id: 2,
               trans: {
                  first: {
                     ref: '/2/1',
                     stateId: 4,
                  },
               },
            },
            3: {
               autoTrans: [],
               id: 3,
               trans: {
                  last: {
                     ref: '/3',
                     stateId: 1,
                  },
               },
            },
            4: {
               autoTrans: [2, 3],
               id: 4,
               trans: {},
            },
         },
      };

      collapseAutoTrans(foo);

      expect(foo).toEqual({
         endId: 1,
         startId: 0,
         states: {
            0: {
               autoTrans: [],
               id: 0,
               trans: {
                  first: {
                     ref: '/1',
                     stateId: 2,
                  },
               },
            },
            1: {
               autoTrans: [],
               done: true,
               id: 1,
               trans: {},
            },
            2: {
               autoTrans: [],
               id: 2,
               trans: {
                  first: {
                     ref: '/2/1',
                     stateId: 4,
                  },
                  last: {
                     ref: '/3',
                     stateId: 1,
                  },
               },
            },
            3: {
               autoTrans: [],
               id: 3,
               trans: {
                  last: {
                     ref: '/3',
                     stateId: 1,
                  },
               },
            },
            4: {
               autoTrans: [],
               id: 4,
               trans: {
                  first: {
                     ref: '/2/1',
                     stateId: 4,
                  },
                  last: {
                     ref: '/3',
                     stateId: 1,
                  },
               },
            },
         },
      });
   });

   it('converts a list of one plus items', () => {
      // (first, (first)+, last)

      const foo: MutableCmGraph = {
         endId: 1,
         startId: 0,
         states: {
            0: {
               autoTrans: [],
               id: 0,
               trans: {
                  first: {
                     ref: '/1',
                     stateId: 2,
                  },
               },
            },
            1: {
               autoTrans: [],
               done: true,
               id: 1,
               trans: {},
            },
            2: {
               autoTrans: [],
               id: 2,
               trans: {
                  first: {
                     ref: '/2/1',
                     stateId: 4,
                  },
               },
            },
            3: {
               autoTrans: [],
               id: 3,
               trans: {
                  last: {
                     ref: '/3',
                     stateId: 1,
                  },
               },
            },
            4: {
               autoTrans: [2, 3],
               id: 4,
               trans: {},
            },
         },
      };

      collapseAutoTrans(foo);

      expect(foo).toEqual({
         endId: 1,
         startId: 0,
         states: {
            0: {
               autoTrans: [],
               id: 0,
               trans: {
                  first: {
                     ref: '/1',
                     stateId: 2,
                  },
               },
            },
            1: {
               autoTrans: [],
               done: true,
               id: 1,
               trans: {},
            },
            2: {
               autoTrans: [],
               id: 2,
               trans: {
                  first: {
                     ref: '/2/1',
                     stateId: 4,
                  },
               },
            },
            3: {
               autoTrans: [],
               id: 3,
               trans: {
                  last: {
                     ref: '/3',
                     stateId: 1,
                  },
               },
            },
            4: {
               autoTrans: [],
               id: 4,
               trans: {
                  first: {
                     ref: '/2/1',
                     stateId: 4,
                  },
                  last: {
                     ref: '/3',
                     stateId: 1,
                  },
               },
            },
         },
      });
   });

   it('combines ambiguous transitions (by hand)', () => {
      // (first, (first)+, first, last)

      const foo: MutableCmGraph = {
         endId: 1,
         startId: 0,
         states: {
            0: {
               autoTrans: [],
               id: 0,
               trans: {
                  first: {
                     ref: '/1',
                     stateId: 2,
                  },
               },
            },
            1: {
               autoTrans: [],
               done: true,
               id: 1,
               trans: {},
            },
            2: {
               autoTrans: [],
               id: 2,
               trans: {
                  first: {
                     ref: '/2/1',
                     stateId: 5,
                  },
               },
            },
            3: {
               autoTrans: [],
               id: 3,
               trans: {
                  last: {
                     ref: '/4',
                     stateId: 1,
                  },
               },
            },
            4: {
               autoTrans: [],
               id: 4,
               trans: {
                  first: {
                     ref: '/3',
                     stateId: 3,
                  },
               },
            },
            5: {
               autoTrans: [2, 4],
               id: 5,
               trans: {},
            },
         },
      };

      collapseAutoTrans(foo);

      expect(foo).toEqual({
         endId: 1,
         startId: 0,
         states: {
            0: {
               autoTrans: [],
               id: 0,
               trans: {
                  first: {
                     ref: '/1',
                     stateId: 2,
                  },
               },
            },
            1: {
               autoTrans: [],
               done: true,
               id: 1,
               trans: {},
            },
            2: {
               autoTrans: [],
               id: 2,
               trans: {
                  first: {
                     ref: '/2/1',
                     stateId: 5,
                  },
               },
            },
            3: {
               autoTrans: [],
               id: 3,
               trans: {
                  last: {
                     ref: '/4',
                     stateId: 1,
                  },
               },
            },
            4: {
               autoTrans: [],
               id: 4,
               trans: {
                  first: {
                     ref: '/3',
                     stateId: 3,
                  },
               },
            },
            5: {
               autoTrans: [],
               id: 5,
               trans: {
                  first: {
                     ref: '/2/1,/3',
                     stateId: 6,
                  },
               },
            },
            6: {
               autoTrans: [],
               id: 6,
               trans: {
                  first: {
                     ref: '/2/1,/3',
                     stateId: 6,
                  },
                  last: {
                     ref: '/4',
                     stateId: 1,
                  },
               },
            },
         },
      });
   });

   it('combines ambiguous transitions', (done) => {
      prepForDeAuto('(first, (first)+, first, last)', (graph) => {
         collapseAutoTrans(graph);

         expect(graph).toEqual({
            endId: 1,
            startId: 0,
            states: {
               0: {
                  autoTrans: [],
                  id: 0,
                  trans: {
                     first: {
                        ref: '/1',
                        stateId: 2,
                     },
                  },
               },
               1: {
                  autoTrans: [],
                  done: true,
                  id: 1,
                  trans: {},
               },
               2: {
                  autoTrans: [],
                  id: 2,
                  trans: {
                     first: {
                        ref: '/2/1',
                        stateId: 4,
                     },
                  },
               },
               3: {
                  autoTrans: [],
                  id: 3,
                  trans: {
                     first: {
                        ref: '/3',
                        stateId: 5,
                     },
                  },
               },
               4: {
                  autoTrans: [],
                  id: 4,
                  trans: {
                     first: {
                        ref: '/2/1,/3',
                        stateId: 6,
                     },
                  },
               },
               5: {
                  autoTrans: [],
                  id: 5,
                  trans: {
                     last: {
                        ref: '/4',
                        stateId: 1,
                     },
                  },
               },
               6: {
                  autoTrans: [],
                  id: 6,
                  trans: {
                     first: {
                        ref: '/2/1,/3',
                        stateId: 6,
                     },
                     last: {
                        ref: '/4',
                        stateId: 1,
                     },
                  },
               },
            },
         });

         done?.();
      });
   });

   it('passes the done flag back to previous nodes', (done) => {
      prepForDeAuto('(first?, last?)', (graph) => {
         collapseAutoTrans(graph);

         expect(graph).toEqual({
            endId: 1,
            startId: 0,
            states: {
               0: {
                  autoTrans: [],
                  done: true,
                  id: 0,
                  trans: {
                     first: {
                        ref: '/1',
                        stateId: 2,
                     },
                     last: {
                        ref: '/2',
                        stateId: 1,
                     },
                  },
               },
               1: {
                  autoTrans: [],
                  done: true,
                  id: 1,
                  trans: {},
               },
               2: {
                  autoTrans: [],
                  done: true,
                  id: 2,
                  trans: {
                     last: {
                        ref: '/2',
                        stateId: 1,
                     },
                  },
               },
            },
         });

         done?.();
      });
   });

   it('processes an entirely optional set of inputs', (done) => {
      prepForDeAuto('(a? | b? | (c?, d?)?)', (graph) => {
         collapseAutoTrans(graph);

         expect(graph).toEqual({
            endId: 1,
            startId: 0,
            states: {
               0: {
                  autoTrans: [],
                  done: true,
                  id: 0,
                  trans: {
                     a: {
                        ref: '/1',
                        stateId: 1,
                     },
                     b: {
                        ref: '/2',
                        stateId: 1,
                     },
                     c: {
                        ref: '/3/1',
                        stateId: 4,
                     },
                     d: {
                        ref: '/3/2',
                        stateId: 3,
                     },
                  },
               },
               1: {
                  autoTrans: [],
                  done: true,
                  id: 1,
                  trans: {},
               },
               2: {
                  autoTrans: [],
                  done: true,
                  id: 2,
                  trans: {
                     c: {
                        ref: '/3/1',
                        stateId: 4,
                     },
                     d: {
                        ref: '/3/2',
                        stateId: 3,
                     },
                  },
               },
               3: {
                  autoTrans: [],
                  done: true,
                  id: 3,
                  trans: {},
               },
               4: {
                  autoTrans: [],
                  done: true,
                  id: 4,
                  trans: {
                     d: {
                        ref: '/3/2',
                        stateId: 3,
                     },
                  },
               },
            },
         });

         done?.();
      });
   });

   it('processes an optional sequence in a choice', (done) => {
      prepForDeAuto('(a? | b? | (c, d)?)', (graph) => {
         collapseAutoTrans(graph);

         expect(graph).toEqual({
            endId: 1,
            startId: 0,
            states: {
               0: {
                  autoTrans: [],
                  done: true,
                  id: 0,
                  trans: {
                     a: {
                        ref: '/1',
                        stateId: 1,
                     },
                     b: {
                        ref: '/2',
                        stateId: 1,
                     },
                     c: {
                        ref: '/3/1',
                        stateId: 4,
                     },
                  },
               },
               1: {
                  autoTrans: [],
                  done: true,
                  id: 1,
                  trans: {},
               },
               2: {
                  autoTrans: [],
                  done: true,
                  id: 2,
                  trans: {
                     c: {
                        ref: '/3/1',
                        stateId: 4,
                     },
                  },
               },
               3: {
                  autoTrans: [],
                  done: true,
                  id: 3,
                  trans: {},
               },
               4: {
                  autoTrans: [],
                  id: 4,
                  trans: {
                     d: {
                        ref: '/3/2',
                        stateId: 3,
                     },
                  },
               },
            },
         });

         done?.();
      });
   });

   it('processes a "+" sequence in a "*" choice', (done) => {
      prepForDeAuto('(a? | b? | (c, d)+)*', (graph) => {
         collapseAutoTrans(graph);

         expect(graph).toEqual({
            endId: 1,
            startId: 0,
            states: {
               '0': {
                  autoTrans: [],
                  done: true,
                  id: 0,
                  trans: {
                     a: {
                        ref: '/1',
                        stateId: 1,
                     },
                     b: {
                        ref: '/2',
                        stateId: 1,
                     },
                     c: {
                        ref: '/3/1',
                        stateId: 4,
                     },
                  },
               },
               '1': {
                  autoTrans: [],
                  done: true,
                  id: 1,
                  trans: {
                     a: {
                        ref: '/1',
                        stateId: 1,
                     },
                     b: {
                        ref: '/2',
                        stateId: 1,
                     },
                     c: {
                        ref: '/3/1',
                        stateId: 4,
                     },
                  },
               },
               '2': {
                  autoTrans: [],
                  id: 2,
                  trans: {
                     c: {
                        ref: '/3/1',
                        stateId: 4,
                     },
                  },
               },
               '3': {
                  autoTrans: [],
                  done: true,
                  id: 3,
                  trans: {
                     a: {
                        ref: '/1',
                        stateId: 1,
                     },
                     b: {
                        ref: '/2',
                        stateId: 1,
                     },
                     c: {
                        ref: '/3/1',
                        stateId: 4,
                     },
                  },
               },
               '4': {
                  autoTrans: [],
                  id: 4,
                  trans: {
                     d: {
                        ref: '/3/2',
                        stateId: 3,
                     },
                  },
               },
            },
         });

         done?.();
      });
   });

   it('processes (a+ | b? | (a?, (b | c ))+)?', (done) => {
      prepForDeAuto('(a+ | b? | (a?, (b | c ))+)?', (graph) => {
         collapseAutoTrans(graph);

         expect(graph).toEqual({
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
         });

         done?.();
      });
   });

   it('fnctions if there is no autoTrans', () => {
      // (first, (first)*, last)

      const foo: MutableCmGraph = {
         endId: 1,
         startId: 0,
         states: {
            0: {
               autoTrans: [4],
               id: 0,
               trans: {
                  first: {
                     ref: '/1',
                     stateId: 2,
                  },
               },
            },
            1: {
               autoTrans: [],
               done: true,
               id: 1,
               trans: {},
            },
            2: {
               autoTrans: [3],
               id: 2,
               trans: {
                  first: {
                     ref: '/2/1',
                     stateId: 4,
                  },
               },
            },
            3: {
               id: 3,
               trans: {
                  first: {
                     ref: '/3',
                     stateId: 1,
                  },
               },
            },
            4: {
               id: 4,
               trans: {
                  first: {
                     ref: '/2/1',
                     stateId: 4,
                  },
               },
            },
         },
      };

      collapseAutoTrans(foo);

      expect(foo).toEqual({
         endId: 1,
         startId: 0,
         states: {
            0: {
               autoTrans: [],
               id: 0,
               trans: {
                  first: {
                     ref: '/1,/2/1',
                     stateId: 5,
                  },
               },
            },
            1: {
               autoTrans: [],
               done: true,
               id: 1,
               trans: {},
            },
            2: {
               autoTrans: [],
               id: 2,
               trans: {
                  first: {
                     ref: '/2/1,/3',
                     stateId: 6,
                  },
               },
            },
            3: {
               id: 3,
               trans: {
                  first: {
                     ref: '/3',
                     stateId: 1,
                  },
               },
            },
            4: {
               id: 4,
               trans: {
                  first: {
                     ref: '/2/1',
                     stateId: 4,
                  },
               },
            },
            5: {
               autoTrans: [],
               id: 5,
               trans: {
                  first: {
                     ref: '/2/1,/2/1,/3',
                     stateId: 7,
                  },
               },
            },
            6: {
               autoTrans: [],
               done: true,
               id: 6,
               trans: {
                  first: {
                     ref: '/2/1',
                     stateId: 4,
                  },
               },
            },
            7: {
               autoTrans: [],
               done: true,
               id: 7,
               trans: {
                  first: {
                     ref: '/2/1',
                     stateId: 4,
                  },
               },
            },
         },
      });
   });
});
