/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { defaultExtractors } from 'extractor';
import { parseContentModel } from 'pToken';
import { STokenSource } from 'sToken';

import { CmGraph } from '../cmGraphTypes';
import { cmToCmGraph } from '../cmToCmGraph';
import { collapseAutoTrans } from '../collapseAutoTrans';

describe('collapseAutoTrans()', () => {
   function prepForDeAuto(input: string, cb: (graph: CmGraph) => void) {
      const source = new STokenSource(defaultExtractors);
      source.addText(input);
      source.endText();
      parseContentModel(source, (result) => {
         const graph = cmToCmGraph(result!);
         cb(graph);
      });
   }

   it('converts a list of zero plus items', () => {
      // (first, (first)*, last)

      const foo: CmGraph = {
         startId: 0,
         endId: 1,
         states: {
            0: {
               id: 0,
               autoTrans: [],
               trans: {
                  first: {
                     ref: '/1',
                     stateId: 2,
                  },
               },
            },
            1: {
               id: 1,
               autoTrans: [],
               trans: {},
               done: true,
            },
            2: {
               id: 2,
               autoTrans: [4],
               trans: {
                  first: {
                     ref: '/2/1',
                     stateId: 4,
                  },
               },
            },
            3: {
               id: 3,
               autoTrans: [],
               trans: {
                  last: {
                     ref: '/3',
                     stateId: 1,
                  },
               },
            },
            4: {
               id: 4,
               autoTrans: [2, 3],
               trans: {},
            },
         },
      };

      collapseAutoTrans(foo);

      expect(foo).toEqual({
         startId: 0,
         endId: 1,
         states: {
            0: {
               id: 0,
               autoTrans: [],
               trans: {
                  first: {
                     ref: '/1',
                     stateId: 2,
                  },
               },
            },
            1: {
               id: 1,
               autoTrans: [],
               trans: {},
               done: true,
            },
            2: {
               id: 2,
               autoTrans: [],
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
               id: 3,
               autoTrans: [],
               trans: {
                  last: {
                     ref: '/3',
                     stateId: 1,
                  },
               },
            },
            4: {
               id: 4,
               autoTrans: [],
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

      const foo: CmGraph = {
         startId: 0,
         endId: 1,
         states: {
            0: {
               id: 0,
               autoTrans: [],
               trans: {
                  first: {
                     ref: '/1',
                     stateId: 2,
                  },
               },
            },
            1: {
               id: 1,
               autoTrans: [],
               trans: {},
               done: true,
            },
            2: {
               id: 2,
               autoTrans: [],
               trans: {
                  first: {
                     ref: '/2/1',
                     stateId: 4,
                  },
               },
            },
            3: {
               id: 3,
               autoTrans: [],
               trans: {
                  last: {
                     ref: '/3',
                     stateId: 1,
                  },
               },
            },
            4: {
               id: 4,
               autoTrans: [2, 3],
               trans: {},
            },
         },
      };

      collapseAutoTrans(foo);

      expect(foo).toEqual({
         startId: 0,
         endId: 1,
         states: {
            0: {
               id: 0,
               autoTrans: [],
               trans: {
                  first: {
                     ref: '/1',
                     stateId: 2,
                  },
               },
            },
            1: {
               id: 1,
               autoTrans: [],
               trans: {},
               done: true,
            },
            2: {
               id: 2,
               autoTrans: [],
               trans: {
                  first: {
                     ref: '/2/1',
                     stateId: 4,
                  },
               },
            },
            3: {
               id: 3,
               autoTrans: [],
               trans: {
                  last: {
                     ref: '/3',
                     stateId: 1,
                  },
               },
            },
            4: {
               id: 4,
               autoTrans: [],
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

      const foo: CmGraph = {
         startId: 0,
         endId: 1,
         states: {
            0: {
               id: 0,
               autoTrans: [],
               trans: {
                  first: {
                     ref: '/1',
                     stateId: 2,
                  },
               },
            },
            1: {
               id: 1,
               autoTrans: [],
               trans: {},
               done: true,
            },
            2: {
               id: 2,
               autoTrans: [],
               trans: {
                  first: {
                     ref: '/2/1',
                     stateId: 5,
                  },
               },
            },
            3: {
               id: 3,
               autoTrans: [],
               trans: {
                  last: {
                     ref: '/4',
                     stateId: 1,
                  },
               },
            },
            4: {
               id: 4,
               autoTrans: [],
               trans: {
                  first: {
                     ref: '/3',
                     stateId: 3,
                  },
               },
            },
            5: {
               id: 5,
               autoTrans: [2, 4],
               trans: {},
            },
         },
      };

      collapseAutoTrans(foo);

      expect(foo).toEqual({
         startId: 0,
         endId: 1,
         states: {
            0: {
               id: 0,
               autoTrans: [],
               trans: {
                  first: {
                     ref: '/1',
                     stateId: 2,
                  },
               },
            },
            1: {
               id: 1,
               autoTrans: [],
               trans: {},
               done: true,
            },
            2: {
               id: 2,
               autoTrans: [],
               trans: {
                  first: {
                     ref: '/2/1',
                     stateId: 5,
                  },
               },
            },
            3: {
               id: 3,
               autoTrans: [],
               trans: {
                  last: {
                     ref: '/4',
                     stateId: 1,
                  },
               },
            },
            4: {
               id: 4,
               autoTrans: [],
               trans: {
                  first: {
                     ref: '/3',
                     stateId: 3,
                  },
               },
            },
            5: {
               id: 5,
               autoTrans: [],
               trans: {
                  first: {
                     ref: '/2/1,/3',
                     stateId: 6,
                  },
               },
            },
            6: {
               id: 6,
               autoTrans: [],
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
            startId: 0,
            endId: 1,
            states: {
               0: {
                  id: 0,
                  autoTrans: [],
                  trans: {
                     first: {
                        ref: '/1',
                        stateId: 2,
                     },
                  },
               },
               1: {
                  id: 1,
                  autoTrans: [],
                  trans: {},
                  done: true,
               },
               2: {
                  id: 2,
                  autoTrans: [],
                  trans: {
                     first: {
                        ref: '/2/1',
                        stateId: 4,
                     },
                  },
               },
               3: {
                  id: 3,
                  autoTrans: [],
                  trans: {
                     first: {
                        ref: '/3',
                        stateId: 5,
                     },
                  },
               },
               5: {
                  id: 5,
                  autoTrans: [],
                  trans: {
                     last: {
                        ref: '/4',
                        stateId: 1,
                     },
                  },
               },
               4: {
                  id: 4,
                  autoTrans: [],
                  trans: {
                     first: {
                        ref: '/2/1,/3',
                        stateId: 6,
                     },
                  },
               },
               6: {
                  id: 6,
                  autoTrans: [],
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
            startId: 0,
            endId: 1,
            states: {
               0: {
                  id: 0,
                  autoTrans: [],
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
                  done: true,
               },
               1: {
                  id: 1,
                  autoTrans: [],
                  trans: {},
                  done: true,
               },
               2: {
                  id: 2,
                  autoTrans: [],
                  trans: {
                     last: {
                        ref: '/2',
                        stateId: 1,
                     },
                  },
                  done: true,
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
            startId: 0,
            endId: 1,
            states: {
               0: {
                  id: 0,
                  autoTrans: [],
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
                  done: true,
               },
               1: {
                  id: 1,
                  autoTrans: [],
                  trans: {},
                  done: true,
               },
               2: {
                  id: 2,
                  autoTrans: [],
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
                  done: true,
               },
               3: {
                  id: 3,
                  autoTrans: [],
                  trans: {},
                  done: true,
               },
               4: {
                  id: 4,
                  autoTrans: [],
                  trans: {
                     d: {
                        ref: '/3/2',
                        stateId: 3,
                     },
                  },
                  done: true,
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
            startId: 0,
            endId: 1,
            states: {
               0: {
                  id: 0,
                  autoTrans: [],
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
                  done: true,
               },
               1: {
                  id: 1,
                  autoTrans: [],
                  trans: {},
                  done: true,
               },
               2: {
                  id: 2,
                  autoTrans: [],
                  trans: {
                     c: {
                        ref: '/3/1',
                        stateId: 4,
                     },
                  },
                  done: true,
               },
               3: {
                  id: 3,
                  autoTrans: [],
                  trans: {},
                  done: true,
               },
               4: {
                  id: 4,
                  autoTrans: [],
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
            startId: 0,
            endId: 1,
            states: {
               '0': {
                  id: 0,
                  autoTrans: [],
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
                  done: true,
               },
               '1': {
                  id: 1,
                  autoTrans: [],
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
                  done: true,
               },
               '2': {
                  id: 2,
                  autoTrans: [],
                  trans: {
                     c: {
                        ref: '/3/1',
                        stateId: 4,
                     },
                  },
               },
               '3': {
                  id: 3,
                  autoTrans: [],
                  trans: {
                     c: {
                        ref: '/3/1',
                        stateId: 4,
                     },
                     a: {
                        ref: '/1',
                        stateId: 1,
                     },
                     b: {
                        ref: '/2',
                        stateId: 1,
                     },
                  },
                  done: true,
               },
               '4': {
                  id: 4,
                  autoTrans: [],
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
         });

         done?.();
      });
   });

   it('fnctions if there is no autoTrans', () => {
      // (first, (first)*, last)

      const foo: CmGraph = {
         startId: 0,
         endId: 1,
         states: {
            0: {
               id: 0,
               autoTrans: [4],
               trans: {
                  first: {
                     ref: '/1',
                     stateId: 2,
                  },
               },
            },
            1: {
               id: 1,
               autoTrans: [],
               trans: {},
               done: true,
            },
            2: {
               id: 2,
               autoTrans: [3],
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
         startId: 0,
         endId: 1,
         states: {
            0: {
               id: 0,
               autoTrans: [],
               trans: {
                  first: {
                     ref: '/1,/2/1',
                     stateId: 5,
                  },
               },
            },
            1: {
               id: 1,
               autoTrans: [],
               trans: {},
               done: true,
            },
            2: {
               id: 2,
               autoTrans: [],
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
               id: 5,
               autoTrans: [],
               trans: {
                  first: {
                     ref: '/2/1,/2/1,/3',
                     stateId: 7,
                  },
               },
            },
            6: {
               id: 6,
               autoTrans: [],
               trans: {
                  first: {
                     ref: '/2/1',
                     stateId: 4,
                  },
               },
               done: true,
            },
            7: {
               id: 7,
               autoTrans: [],
               trans: {
                  first: {
                     ref: '/2/1',
                     stateId: 4,
                  },
               },
               done: true,
            },
         },
      });
   });
});
