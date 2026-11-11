/* Copyright ® 2018-2026 by 柏大衛. All rights reserved. */

import { toSToken } from 'basic';
import { ContentModelP } from 'pToken';
import { describe, expect, it } from 'vitest';

import { cmToCmGraph } from '../cmToCmGraph';

describe('cmToCmGraph()', () => {
   describe('toplevel list', () => {
      it('handles a "" repeat', () => {
         const srcList: ContentModelP = {
            delimitedParticles: [
               {
                  particle: {
                     name: toSToken('first'),
                  },
               },
            ],
            repeat: undefined,
         };

         const result = cmToCmGraph(srcList);

         expect(result).toEqual({
            endId: 1,
            startId: 0,
            states: {
               0: {
                  autoTrans: [],
                  id: 0,
                  trans: {
                     first: {
                        ref: '/1',
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
            },
         });
      });

      it('handles a "?" repeat', () => {
         const srcList: ContentModelP = {
            delimitedParticles: [
               {
                  particle: {
                     name: toSToken('first'),
                  },
               },
            ],
            repeat: toSToken('?'),
         };

         const result = cmToCmGraph(srcList);

         expect(result).toEqual({
            endId: 1,
            startId: 0,
            states: {
               0: {
                  autoTrans: [1],
                  id: 0,
                  trans: {
                     first: {
                        ref: '/1',
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
            },
         });
      });

      it('handles a "*" repeat', () => {
         const srcList: ContentModelP = {
            delimitedParticles: [
               {
                  particle: {
                     name: toSToken('first'),
                  },
               },
            ],
            repeat: toSToken('*'),
         };

         const result = cmToCmGraph(srcList);

         expect(result).toEqual({
            endId: 1,
            startId: 0,
            states: {
               0: {
                  autoTrans: [1],
                  id: 0,
                  trans: {
                     first: {
                        ref: '/1',
                        stateId: 1,
                     },
                  },
               },
               1: {
                  autoTrans: [0],
                  done: true,
                  id: 1,
                  trans: {},
               },
            },
         });
      });

      it('handles a "+" repeat', () => {
         const srcList: ContentModelP = {
            delimitedParticles: [
               {
                  particle: {
                     name: toSToken('first'),
                  },
               },
            ],
            repeat: toSToken('+'),
         };

         const result = cmToCmGraph(srcList);

         expect(result).toEqual({
            endId: 1,
            startId: 0,
            states: {
               0: {
                  autoTrans: [],
                  id: 0,
                  trans: {
                     first: {
                        ref: '/1',
                        stateId: 1,
                     },
                  },
               },
               1: {
                  autoTrans: [0],
                  done: true,
                  id: 1,
                  trans: {},
               },
            },
         });
      });
   });

   describe('name in choice processing', () => {
      it('converts a "" name to a transition to the end', () => {
         const srcList: ContentModelP = {
            delimitedParticles: [
               {
                  particle: {
                     name: toSToken('first'),
                  },
               },
            ],
         };

         const result = cmToCmGraph(srcList);

         expect(result).toEqual({
            endId: 1,
            startId: 0,
            states: {
               0: {
                  autoTrans: [],
                  id: 0,
                  trans: {
                     first: {
                        ref: '/1',
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
            },
         });
      });

      it('converts a "?" to both a transition to the end and a skip to the end', () => {
         const srcList: ContentModelP = {
            delimitedParticles: [
               {
                  delimiter: toSToken('|'),
                  particle: {
                     name: toSToken('first'),
                  },
               },
               {
                  particle: {
                     name: toSToken('second'),
                     repeat: toSToken('?'),
                  },
               },
            ],
         };

         const result = cmToCmGraph(srcList);

         expect(result).toEqual({
            endId: 1,
            startId: 0,
            states: {
               0: {
                  autoTrans: [1],
                  id: 0,
                  trans: {
                     first: {
                        ref: '/1',
                        stateId: 1,
                     },
                     second: {
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
            },
         });
      });

      it('converts a "*" to a skip to the end and a repeat in place', () => {
         const srcList: ContentModelP = {
            delimitedParticles: [
               {
                  delimiter: toSToken('|'),
                  particle: {
                     name: toSToken('first'),
                  },
               },
               {
                  particle: {
                     name: toSToken('second'),
                     repeat: toSToken('*'),
                  },
               },
            ],
         };

         const result = cmToCmGraph(srcList);

         expect(result).toEqual({
            endId: 1,
            startId: 0,
            states: {
               0: {
                  autoTrans: [1],
                  id: 0,
                  trans: {
                     first: {
                        ref: '/1',
                        stateId: 1,
                     },
                     second: {
                        ref: '/2',
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
                  autoTrans: [1],
                  id: 2,
                  trans: {
                     second: {
                        ref: '/2',
                        stateId: 2,
                     },
                  },
               },
            },
         });
      });

      it('converts a "+" to a repeat of a new state', () => {
         const srcList: ContentModelP = {
            delimitedParticles: [
               {
                  delimiter: toSToken('|'),
                  particle: {
                     name: toSToken('first'),
                  },
               },
               {
                  particle: {
                     name: toSToken('second'),
                     repeat: toSToken('+'),
                  },
               },
            ],
         };

         const result = cmToCmGraph(srcList);

         expect(result).toEqual({
            endId: 1,
            startId: 0,
            states: {
               0: {
                  autoTrans: [], // no auto transition to end
                  id: 0,
                  trans: {
                     first: {
                        ref: '/1',
                        stateId: 1,
                     },
                     second: {
                        ref: '/2',
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
                  autoTrans: [1],
                  id: 2,
                  trans: {
                     second: {
                        ref: '/2',
                        stateId: 2,
                     },
                  },
               },
            },
         });
      });
      it('does not add multiple autotransitions (whitebox)', () => {
         const srcList: ContentModelP = {
            delimitedParticles: [
               {
                  delimiter: toSToken('|'),
                  particle: {
                     name: toSToken('first'),
                     repeat: toSToken('*'),
                  },
               },
               {
                  particle: {
                     name: toSToken('second'),
                     repeat: toSToken('*'),
                  },
               },
            ],
         };

         const result = cmToCmGraph(srcList);

         expect(result).toEqual({
            endId: 1,
            startId: 0,
            states: {
               0: {
                  autoTrans: [1], // this has one entry, rather than several
                  id: 0,
                  trans: {
                     first: {
                        ref: '/1',
                        stateId: 2,
                     },
                     second: {
                        ref: '/2',
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
                  autoTrans: [1],
                  id: 2,
                  trans: {
                     first: {
                        ref: '/1',
                        stateId: 2,
                     },
                  },
               },
               3: {
                  autoTrans: [1],
                  id: 3,
                  trans: {
                     second: {
                        ref: '/2',
                        stateId: 3,
                     },
                  },
               },
            },
         });
      });
   });

   describe('name in sequence processing', () => {
      it('converts a "" name to a transition to the next', () => {
         const srcList: ContentModelP = {
            delimitedParticles: [
               {
                  delimiter: toSToken(','),
                  particle: {
                     name: toSToken('first'),
                  },
               },
               {
                  particle: {
                     name: toSToken('second'),
                  },
               },
            ],
         };

         const result = cmToCmGraph(srcList);

         expect(result).toEqual({
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
                     second: {
                        ref: '/2',
                        stateId: 1,
                     },
                  },
               },
            },
         });
      });

      it('converts a "?" name to a skip and a transition to the next', () => {
         const srcList: ContentModelP = {
            delimitedParticles: [
               {
                  delimiter: toSToken(','),
                  particle: {
                     name: toSToken('first'),
                     repeat: toSToken('?'),
                  },
               },
               {
                  particle: {
                     name: toSToken('second'),
                     repeat: toSToken('?'),
                  },
               },
            ],
         };

         const result = cmToCmGraph(srcList);

         expect(result).toEqual({
            endId: 1,
            startId: 0,
            states: {
               0: {
                  autoTrans: [2],
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
                  autoTrans: [1],
                  id: 2,
                  trans: {
                     second: {
                        ref: '/2',
                        stateId: 1,
                     },
                  },
               },
            },
         });
      });

      it('converts a "*" to a skip to the end and a repeat in place', () => {
         const srcList: ContentModelP = {
            delimitedParticles: [
               {
                  delimiter: toSToken(','),
                  particle: {
                     name: toSToken('first'),
                     repeat: toSToken('*'),
                  },
               },
               {
                  particle: {
                     name: toSToken('second'),
                     repeat: toSToken('*'),
                  },
               },
            ],
         };

         const result = cmToCmGraph(srcList);

         expect(result).toEqual({
            endId: 1,
            startId: 0,
            states: {
               0: {
                  autoTrans: [2],
                  id: 0,
                  trans: {
                     first: {
                        ref: '/1',
                        stateId: 0,
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
                  autoTrans: [1],
                  id: 2,
                  trans: {
                     second: {
                        ref: '/2',
                        stateId: 2,
                     },
                  },
               },
            },
         });
      });

      it('converts a "+" to a repeat of a new state', () => {
         const srcList: ContentModelP = {
            delimitedParticles: [
               {
                  delimiter: toSToken(','),
                  particle: {
                     name: toSToken('first'),
                     repeat: toSToken('+'),
                  },
               },
               {
                  particle: {
                     name: toSToken('second'),
                     repeat: toSToken('+'),
                  },
               },
            ],
         };

         const result = cmToCmGraph(srcList);

         expect(result).toEqual({
            endId: 1,
            startId: 0,
            states: {
               0: {
                  autoTrans: [],
                  id: 0,
                  trans: {
                     first: {
                        ref: '/1',
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
                  id: 2,
                  trans: {
                     second: {
                        ref: '/2',
                        stateId: 4,
                     },
                  },
               },
               3: {
                  autoTrans: [2],
                  id: 3,
                  trans: {
                     first: {
                        ref: '/1',
                        stateId: 3,
                     },
                  },
               },
               4: {
                  autoTrans: [1],
                  id: 4,
                  trans: {
                     second: {
                        ref: '/2',
                        stateId: 4,
                     },
                  },
               },
            },
         });
      });
   });

   describe('choice ContentModelX in choice processing', () => {
      it('converts a "" list', () => {
         const srcList: ContentModelP = {
            delimitedParticles: [
               {
                  delimiter: toSToken('|'),
                  particle: {
                     name: toSToken('first'),
                  },
               },
               {
                  particle: {
                     delimitedParticles: [
                        {
                           particle: {
                              name: toSToken('first'),
                           },
                        },
                     ],
                  },
               },
               {
                  particle: {
                     name: toSToken('last'),
                  },
               },
            ],
         };

         const result = cmToCmGraph(srcList);

         expect(result).toEqual({
            endId: 1,
            startId: 0,
            states: {
               0: {
                  autoTrans: [2],
                  id: 0,
                  trans: {
                     first: {
                        ref: '/1',
                        stateId: 1,
                     },
                     last: {
                        ref: '/3',
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
                  id: 2,
                  trans: {
                     first: {
                        ref: '/2/1',
                        stateId: 3,
                     },
                  },
               },
               3: {
                  autoTrans: [1],
                  id: 3,
                  trans: {},
               },
            },
         });
      });

      it('converts a "?" list', () => {
         const srcList: ContentModelP = {
            delimitedParticles: [
               {
                  delimiter: toSToken('|'),
                  particle: {
                     name: toSToken('first'),
                  },
               },
               {
                  particle: {
                     delimitedParticles: [
                        {
                           particle: {
                              name: toSToken('first'),
                              repeat: toSToken('?'),
                           },
                        },
                     ],
                  },
               },
               {
                  particle: {
                     name: toSToken('last'),
                  },
               },
            ],
         };

         const result = cmToCmGraph(srcList);

         expect(result).toEqual({
            endId: 1,
            startId: 0,
            states: {
               0: {
                  autoTrans: [2],
                  id: 0,
                  trans: {
                     first: {
                        ref: '/1',
                        stateId: 1,
                     },
                     last: {
                        ref: '/3',
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
                  autoTrans: [3],
                  id: 2,
                  trans: {
                     first: {
                        ref: '/2/1',
                        stateId: 3,
                     },
                  },
               },
               3: {
                  autoTrans: [1],
                  id: 3,
                  trans: {},
               },
            },
         });
      });

      it('converts a "*" list', () => {
         const srcList: ContentModelP = {
            delimitedParticles: [
               {
                  delimiter: toSToken('|'),
                  particle: {
                     name: toSToken('first'),
                  },
               },
               {
                  delimiter: toSToken('|'),
                  particle: {
                     delimitedParticles: [
                        {
                           particle: {
                              name: toSToken('first'),
                           },
                        },
                     ],
                     repeat: toSToken('*'),
                  },
               },
               {
                  particle: {
                     name: toSToken('last'),
                  },
               },
            ],
         };

         const result = cmToCmGraph(srcList);

         expect(result).toEqual({
            endId: 1,
            startId: 0,
            states: {
               0: {
                  autoTrans: [2],
                  id: 0,
                  trans: {
                     first: {
                        ref: '/1',
                        stateId: 1,
                     },
                     last: {
                        ref: '/3',
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
                  autoTrans: [3],
                  id: 2,
                  trans: {
                     first: {
                        ref: '/2/1',
                        stateId: 3,
                     },
                  },
               },
               3: {
                  autoTrans: [2, 1],
                  id: 3,
                  trans: {},
               },
            },
         });
      });

      it('converts a "+" list', () => {
         const srcList: ContentModelP = {
            delimitedParticles: [
               {
                  delimiter: toSToken('|'),
                  particle: {
                     name: toSToken('first'),
                  },
               },
               {
                  delimiter: toSToken('|'),
                  particle: {
                     delimitedParticles: [
                        {
                           particle: {
                              name: toSToken('first'),
                           },
                        },
                     ],
                     repeat: toSToken('+'),
                  },
               },
               {
                  particle: {
                     name: toSToken('last'),
                  },
               },
            ],
         };

         const result = cmToCmGraph(srcList);

         expect(result).toEqual({
            endId: 1,
            startId: 0,
            states: {
               0: {
                  autoTrans: [2],
                  id: 0,
                  trans: {
                     first: {
                        ref: '/1',
                        stateId: 1,
                     },
                     last: {
                        ref: '/3',
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
                  id: 2,
                  trans: {
                     first: {
                        ref: '/2/1',
                        stateId: 3,
                     },
                  },
               },
               3: {
                  autoTrans: [2, 1],
                  id: 3,
                  trans: {},
               },
            },
         });
      });
   });

   describe('choice ContentModel in sequence processing', () => {
      it('converts a "" list', () => {
         const srcList: ContentModelP = {
            delimitedParticles: [
               {
                  delimiter: toSToken(','),
                  particle: {
                     name: toSToken('first'),
                  },
               },
               {
                  delimiter: toSToken(','),
                  particle: {
                     delimitedParticles: [
                        {
                           particle: {
                              name: toSToken('first'),
                           },
                        },
                     ],
                  },
               },
               {
                  particle: {
                     name: toSToken('last'),
                  },
               },
            ],
         };

         const result = cmToCmGraph(srcList);

         expect(result).toEqual({
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
                  autoTrans: [3],
                  id: 4,
                  trans: {},
               },
            },
         });
      });

      it('converts a "?" list', () => {
         const srcList: ContentModelP = {
            delimitedParticles: [
               {
                  delimiter: toSToken(','),
                  particle: {
                     name: toSToken('first'),
                  },
               },
               {
                  delimiter: toSToken(','),
                  particle: {
                     delimitedParticles: [
                        {
                           particle: {
                              name: toSToken('first'),
                           },
                        },
                     ],
                     repeat: toSToken('?'),
                  },
               },
               {
                  particle: {
                     name: toSToken('last'),
                  },
               },
            ],
         };

         const result = cmToCmGraph(srcList);

         expect(result).toEqual({
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
                  autoTrans: [3],
                  id: 4,
                  trans: {},
               },
            },
         });
      });

      it('converts a "*" list', () => {
         const srcList: ContentModelP = {
            delimitedParticles: [
               {
                  delimiter: toSToken(','),
                  particle: {
                     name: toSToken('first'),
                  },
               },
               {
                  delimiter: toSToken(','),
                  particle: {
                     delimitedParticles: [
                        {
                           particle: {
                              name: toSToken('first'),
                           },
                        },
                     ],
                     repeat: toSToken('*'),
                  },
               },
               {
                  particle: {
                     name: toSToken('last'),
                  },
               },
            ],
         };

         const result = cmToCmGraph(srcList);

         expect(result).toEqual({
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
         });
      });

      it('converts a "+" list', () => {
         const srcList: ContentModelP = {
            delimitedParticles: [
               {
                  delimiter: toSToken(','),
                  particle: {
                     name: toSToken('first'),
                  },
               },
               {
                  delimiter: toSToken(','),
                  particle: {
                     delimitedParticles: [
                        {
                           particle: {
                              name: toSToken('first'),
                           },
                        },
                     ],
                     repeat: toSToken('+'),
                  },
               },
               {
                  particle: {
                     name: toSToken('last'),
                  },
               },
            ],
         };

         const result = cmToCmGraph(srcList);

         expect(result).toEqual({
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
         });
      });
   });

   describe('sequence ContentModel in choice processing', () => {
      it('converts a "" list', () => {
         const srcList: ContentModelP = {
            delimitedParticles: [
               {
                  delimiter: toSToken('|'),
                  particle: {
                     name: toSToken('first'),
                  },
               },
               {
                  delimiter: toSToken('|'),
                  particle: {
                     delimitedParticles: [
                        {
                           particle: {
                              name: toSToken('first'),
                           },
                        },
                     ],
                  },
               },
               {
                  particle: {
                     name: toSToken('last'),
                  },
               },
            ],
         };

         const result = cmToCmGraph(srcList);

         expect(result).toEqual({
            endId: 1,
            startId: 0,
            states: {
               0: {
                  autoTrans: [2],
                  id: 0,
                  trans: {
                     first: {
                        ref: '/1',
                        stateId: 1,
                     },
                     last: {
                        ref: '/3',
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
                  id: 2,
                  trans: {
                     first: {
                        ref: '/2/1',
                        stateId: 3,
                     },
                  },
               },
               3: {
                  autoTrans: [1],
                  id: 3,
                  trans: {},
               },
            },
         });
      });

      it('converts a "?" list', () => {
         const srcList: ContentModelP = {
            delimitedParticles: [
               {
                  delimiter: toSToken('|'),
                  particle: {
                     name: toSToken('first'),
                  },
               },
               {
                  delimiter: toSToken('|'),
                  particle: {
                     delimitedParticles: [
                        {
                           delimiter: toSToken(','),
                           particle: {
                              name: toSToken('first'),
                           },
                        },
                     ],
                     repeat: toSToken('?'),
                  },
               },
               {
                  particle: {
                     name: toSToken('last'),
                  },
               },
            ],
         };

         const result = cmToCmGraph(srcList);

         expect(result).toEqual({
            endId: 1,
            startId: 0,
            states: {
               0: {
                  autoTrans: [2],
                  id: 0,
                  trans: {
                     first: {
                        ref: '/1',
                        stateId: 1,
                     },
                     last: {
                        ref: '/3',
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
                  autoTrans: [3],
                  id: 2,
                  trans: {
                     first: {
                        ref: '/2/1',
                        stateId: 3,
                     },
                  },
               },
               3: {
                  autoTrans: [1],
                  id: 3,
                  trans: {},
               },
            },
         });
      });

      it('converts a "*" list', () => {
         const srcList: ContentModelP = {
            delimitedParticles: [
               {
                  delimiter: toSToken('|'),
                  particle: {
                     name: toSToken('first'),
                  },
               },
               {
                  delimiter: toSToken('|'),
                  particle: {
                     delimitedParticles: [
                        {
                           delimiter: toSToken(','),
                           particle: {
                              name: toSToken('first'),
                           },
                        },
                     ],
                     repeat: toSToken('*'),
                  },
               },
               {
                  particle: {
                     name: toSToken('last'),
                  },
               },
            ],
         };

         const result = cmToCmGraph(srcList);

         expect(result).toEqual({
            endId: 1,
            startId: 0,
            states: {
               0: {
                  autoTrans: [2],
                  id: 0,
                  trans: {
                     first: {
                        ref: '/1',
                        stateId: 1,
                     },
                     last: {
                        ref: '/3',
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
                  autoTrans: [3],
                  id: 2,
                  trans: {
                     first: {
                        ref: '/2/1',
                        stateId: 3,
                     },
                  },
               },
               3: {
                  autoTrans: [2, 1],
                  id: 3,
                  trans: {},
               },
            },
         });
      });

      it('converts a "+" list', () => {
         const srcList: ContentModelP = {
            delimitedParticles: [
               {
                  delimiter: toSToken('|'),
                  particle: {
                     name: toSToken('first'),
                  },
               },
               {
                  delimiter: toSToken('|'),
                  particle: {
                     delimitedParticles: [
                        {
                           delimiter: toSToken(','),
                           particle: {
                              name: toSToken('first'),
                           },
                        },
                     ],
                     repeat: toSToken('+'),
                  },
               },
               {
                  particle: {
                     name: toSToken('last'),
                  },
               },
            ],
         };

         const result = cmToCmGraph(srcList);

         expect(result).toEqual({
            endId: 1,
            startId: 0,
            states: {
               0: {
                  autoTrans: [2],
                  id: 0,
                  trans: {
                     first: {
                        ref: '/1',
                        stateId: 1,
                     },
                     last: {
                        ref: '/3',
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
                  id: 2,
                  trans: {
                     first: {
                        ref: '/2/1',
                        stateId: 3,
                     },
                  },
               },
               3: {
                  autoTrans: [2, 1],
                  id: 3,
                  trans: {},
               },
            },
         });
      });
   });

   describe('sequence ContentModel in sequence processing', () => {
      it('converts a "" list', () => {
         const srcList: ContentModelP = {
            delimitedParticles: [
               {
                  delimiter: toSToken(','),
                  particle: {
                     name: toSToken('first'),
                  },
               },
               {
                  delimiter: toSToken(','),
                  particle: {
                     delimitedParticles: [
                        {
                           delimiter: toSToken(','),
                           particle: {
                              name: toSToken('first'),
                           },
                        },
                        {
                           particle: {
                              name: toSToken('second'),
                           },
                        },
                     ],
                  },
               },
               {
                  particle: {
                     name: toSToken('last'),
                  },
               },
            ],
         };

         const result = cmToCmGraph(srcList);

         expect(result).toEqual({
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
                        ref: '/3',
                        stateId: 1,
                     },
                  },
               },
               4: {
                  autoTrans: [3],
                  id: 4,
                  trans: {},
               },
               5: {
                  autoTrans: [],
                  id: 5,
                  trans: {
                     second: {
                        ref: '/2/2',
                        stateId: 4,
                     },
                  },
               },
            },
         });
      });

      it('converts a "?" list', () => {
         const srcList: ContentModelP = {
            delimitedParticles: [
               {
                  delimiter: toSToken(','),
                  particle: {
                     name: toSToken('first'),
                  },
               },
               {
                  delimiter: toSToken(','),
                  particle: {
                     delimitedParticles: [
                        {
                           delimiter: toSToken(','),
                           particle: {
                              name: toSToken('first'),
                           },
                        },
                     ],
                     repeat: toSToken('?'),
                  },
               },
               {
                  particle: {
                     name: toSToken('last'),
                  },
               },
            ],
         };

         const result = cmToCmGraph(srcList);

         expect(result).toEqual({
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
                  autoTrans: [3],
                  id: 4,
                  trans: {},
               },
            },
         });
      });

      it('converts a "*" list', () => {
         const srcList: ContentModelP = {
            delimitedParticles: [
               {
                  delimiter: toSToken(','),
                  particle: {
                     name: toSToken('first'),
                  },
               },
               {
                  delimiter: toSToken(','),
                  particle: {
                     delimitedParticles: [
                        {
                           delimiter: toSToken(','),
                           particle: {
                              name: toSToken('first'),
                           },
                        },
                     ],
                     repeat: toSToken('*'),
                  },
               },
               {
                  particle: {
                     name: toSToken('last'),
                  },
               },
            ],
         };

         const result = cmToCmGraph(srcList);

         expect(result).toEqual({
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
         });
      });

      it('converts a "+" list', () => {
         const srcList: ContentModelP = {
            delimitedParticles: [
               {
                  delimiter: toSToken(','),
                  particle: {
                     name: toSToken('first'),
                  },
               },
               {
                  delimiter: toSToken(','),
                  particle: {
                     delimitedParticles: [
                        {
                           delimiter: toSToken(','),
                           particle: {
                              name: toSToken('first'),
                           },
                        },
                     ],
                     repeat: toSToken('+'),
                  },
               },
               {
                  particle: {
                     name: toSToken('last'),
                  },
               },
            ],
         };

         const result = cmToCmGraph(srcList);

         expect(result).toEqual({
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
         });
      });
   });

   describe('other', () => {
      it('converts a duplicate name in a choice sequence into a comma separated ref value', () => {
         const srcList: ContentModelP = {
            delimitedParticles: [
               {
                  delimiter: toSToken('|'),
                  particle: {
                     name: toSToken('first'),
                  },
               },
               {
                  delimiter: toSToken('|'),
                  particle: {
                     name: toSToken('first'),
                  },
               },
               {
                  particle: {
                     name: toSToken('first'),
                  },
               },
            ],
         };

         const result = cmToCmGraph(srcList);

         expect(result).toEqual({
            endId: 1,
            startId: 0,
            states: {
               0: {
                  autoTrans: [],
                  id: 0,
                  trans: {
                     first: {
                        ref: '/1,/2,/3',
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
            },
         });
      });

      it('is not bothered when a delimited particle has an empty particle in a sequence (this should not be able to happen)', () => {
         const srcList: ContentModelP = {
            delimitedParticles: [{ delimiter: toSToken(',') }],
         };

         const result = cmToCmGraph(srcList);

         expect(result).toEqual({
            endId: 1,
            startId: 0,
            states: {
               0: {
                  autoTrans: [],
                  id: 0,
                  trans: {},
               },
               1: {
                  autoTrans: [],
                  done: true,
                  id: 1,
                  trans: {},
               },
            },
         });
      });

      it('is not bothered when a delimited particle has an empty particle in a choice (this should not be able to happen)', () => {
         const srcList: ContentModelP = {
            delimitedParticles: [{ delimiter: toSToken('|') }],
         };

         const result = cmToCmGraph(srcList);

         expect(result).toEqual({
            endId: 1,
            startId: 0,
            states: {
               0: {
                  autoTrans: [],
                  id: 0,
                  trans: {},
               },
               1: {
                  autoTrans: [],
                  done: true,
                  id: 1,
                  trans: {},
               },
            },
         });
      });

      it('is not bothered when when there are no particles at all', () => {
         const srcList: ContentModelP = {
            delimitedParticles: [],
         };

         const result = cmToCmGraph(srcList);

         expect(result).toEqual({
            endId: 1,
            startId: 0,
            states: {
               0: {
                  autoTrans: [],
                  id: 0,
                  trans: {},
               },
               1: {
                  autoTrans: [],
                  done: true,
                  id: 1,
                  trans: {},
               },
            },
         });
      });
   });
});
