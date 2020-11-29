/* Copyright ® 2018 by 柏大衛. All rights reserved. */

import { ContentModelX, CpType, CpRepeat } from 'source/xToken/common/contentModelX';
import nameListToGraph from '../nameListToGraph';

describe('nameListToGraph()', () => {

      describe('toplevel list', () => {

         it('handles a "" repeat', () => {
            const srcList: ContentModelX = {
               particles: [{
                  name: 'first',
                  repeat: CpRepeat.ONE,
               }],
               listType: CpType.CHOICE,
               repeat: CpRepeat.ONE,
            };

            const result = nameListToGraph(srcList);

            expect(result).toEqual({
               startId: 0,
               endId: 1,
               states: {
                  0: {
                     id: 0,
                     autoTrans: [],
                     trans: {
                        first: {
                           ref: '/1',
                           stateId: 1
                        }
                     }
                  },
                  1: {
                     id: 1,
                     autoTrans: [],
                     trans: {},
                     done: true,
                  },
               }
            });
         });

         it('handles a "?" repeat', () => {
            const srcList: ContentModelX = {
               particles: [{
                  name: 'first',
                  repeat: CpRepeat.ONE,
               }],
               listType: CpType.CHOICE,
               repeat: CpRepeat.ZEROONE,
            };

            const result = nameListToGraph(srcList);

            expect(result).toEqual({
               startId: 0,
               endId: 1,
               states: {
                  0: {
                     id: 0,
                     autoTrans: [1],
                     trans: {
                        first: {
                           ref: '/1',
                           stateId: 1
                        }
                     }
                  },
                  1: {
                     id: 1,
                     autoTrans: [],
                     trans: {},
                     done: true,
                  },
               }
            });
         });

         it('handles a "*" repeat', () => {
            const srcList: ContentModelX = {
               particles: [{
                  name: 'first',
                  repeat: CpRepeat.ONE,
               }],
               listType: CpType.CHOICE,
               repeat: CpRepeat.ZEROPLUS
            };

            const result = nameListToGraph(srcList);

            expect(result).toEqual({
               startId: 0,
               endId: 1,
               states: {
                  0: {
                     id: 0,
                     autoTrans: [1],
                     trans: {
                        first: {
                           ref: '/1',
                           stateId: 1
                        }
                     }
                  },
                  1: {
                     id: 1,
                     autoTrans: [0],
                     trans: {},
                     done: true,
                  },
               }
            });
         });

         it('handles a "+" repeat', () => {
            const srcList: ContentModelX = {
               particles: [{
                  name: 'first',
                  repeat: CpRepeat.ONE,
               }],
               listType: CpType.CHOICE,
               repeat: CpRepeat.ONEPLUS
            };

            const result = nameListToGraph(srcList);

            expect(result).toEqual({
               startId: 0,
               endId: 1,
               states: {
                  0: {
                     id: 0,
                     autoTrans: [],
                     trans: {
                        first: {
                           ref: '/1',
                           stateId: 1
                        }
                     }
                  },
                  1: {
                     id: 1,
                     autoTrans: [0],
                     trans: {},
                     done: true,
                  },
               }
            });
         });

      });

      describe('XName in choice processing', () => {

         it('converts a "" name to a transition to the end', () => {
            const srcList: ContentModelX = {
               particles: [{
                  name: 'first',
                  repeat: CpRepeat.ONE,
               }],
               listType: CpType.CHOICE,
               repeat: CpRepeat.ONE,
            };
   
            const result = nameListToGraph(srcList);
   
            expect(result).toEqual({
               startId: 0,
               endId: 1,
               states: {
                  0: {
                     id: 0,
                     autoTrans: [],
                     trans: {
                        first: {
                           ref: '/1',
                           stateId: 1
                        }
                     }
                  },
                  1: {
                     id: 1,
                     autoTrans: [],
                     trans: {},
                     done: true,
                  },
               }
            });
         });
   
         it('converts a "?" to both a transition to the end and a skip to the end', () => {
            const srcList: ContentModelX = {
               particles: [{
                  name: 'first',
                  repeat: CpRepeat.ONE,
               }, {
                  name: 'second',
                  repeat: CpRepeat.ZEROONE,
               }],
               listType: CpType.CHOICE,
               repeat: CpRepeat.ONE,
            };

            const result = nameListToGraph(srcList);

            expect(result).toEqual({
               startId: 0,
               endId: 1,
               states: {
                  0: {
                     id: 0,
                     autoTrans: [1],
                     trans: {
                        first: {
                           ref: '/1',
                           stateId: 1
                        },
                        second: {
                           ref: '/2',
                           stateId: 1
                        }
                     }
                  },
                  1: {
                     id: 1,
                     autoTrans: [],
                     trans: {},
                     done: true,
                  },
               }
            });
         });

         it('converts a "*" to a skip to the end and a repeat in place', () => {
            const srcList: ContentModelX = {
               particles: [{
                  name: 'first',
                  repeat: CpRepeat.ONE,
               }, {
                  name: 'second',
                  repeat: CpRepeat.ZEROPLUS
               }],
               listType: CpType.CHOICE,
               repeat: CpRepeat.ONE,
            };

            const result = nameListToGraph(srcList);

            expect(result).toEqual({
               startId: 0,
               endId: 1,
               states: {
                  0: {
                     id: 0,
                     autoTrans: [1],
                     trans: {
                        first: {
                           ref: '/1',
                           stateId: 1
                        },
                        second: {
                           ref: '/2',
                           stateId: 2
                        }
                     }
                  },
                  1: {
                     id: 1,
                     autoTrans: [],
                     trans: {},
                     done: true,
                  },
                  2: {
                     id: 2,
                     autoTrans: [1],
                     trans: {
                        second: {
                           ref: '/2',
                           stateId: 2
                        }
                     }
                  },
               }
            });
         });

         it('converts a "+" to a repeat of a new state', () => {
            const srcList: ContentModelX = {
               particles: [{
                  name: 'first',
                  repeat: CpRepeat.ONE,
               }, {
                  name: 'second',
                  repeat: CpRepeat.ONEPLUS
               }],
               listType: CpType.CHOICE,
               repeat: CpRepeat.ONE,
            };

            const result = nameListToGraph(srcList);

            expect(result).toEqual({
               startId: 0,
               endId: 1,
               states: {
                  0: {
                     id: 0,
                     autoTrans: [], // no auto transition to end
                     trans: {
                        first: {
                           ref: '/1',
                           stateId: 1
                        },
                        second: {
                           ref: '/2',
                           stateId: 2
                        }
                     }
                  },
                  1: {
                     id: 1,
                     autoTrans: [],
                     trans: {},
                     done: true,
                  },
                  2: {
                     id: 2,
                     autoTrans: [1],
                     trans: {
                        second: {
                           ref: '/2',
                           stateId: 2
                        }
                     }
                  },
               }
            });
         });

         it('does not add multiple autotransitions (whitebox)', () => {
            const srcList: ContentModelX = {
               particles: [{
                  name: 'first',
                  repeat: CpRepeat.ZEROPLUS
               }, {
                  name: 'second',
                  repeat: CpRepeat.ZEROPLUS
               }],
               listType: CpType.CHOICE,
               repeat: CpRepeat.ONE,
            };

            const result = nameListToGraph(srcList);

            expect(result).toEqual({
               startId: 0,
               endId: 1,
               states: {
                  0: {
                     id: 0,
                     autoTrans: [1], // this has one entry, rather than several
                     trans: {
                        first: {
                           ref: '/1',
                           stateId: 2
                        },
                        second: {
                           ref: '/2',
                           stateId: 3
                        }
                     }
                  },
                  1: {
                     id: 1,
                     autoTrans: [],
                     trans: {},
                     done: true,
                  },
                  2: {
                     id: 2,
                     autoTrans: [1],
                     trans: {
                        first: {
                           ref: '/1',
                           stateId: 2
                        }
                     }
                  },
                  3: {
                     id: 3,
                     autoTrans: [1],
                     trans: {
                        second: {
                           ref: '/2',
                           stateId: 3
                        }
                     }
                  },
               }
            });
         });

      });

      describe('XName in sequence processing', () => {

         it('converts a "" name to a transition to the next', () => {
            const srcList: ContentModelX = {
               particles: [{
                  name: 'first',
                  repeat: CpRepeat.ONE,
               }, {
                  name: 'second',
                  repeat: CpRepeat.ONE,
               }],
               listType: CpType.SEQUENCE,
               repeat: CpRepeat.ONE,
            };
   
            const result = nameListToGraph(srcList);
   
            expect(result).toEqual({
               startId: 0,
               endId: 1,
               states: {
                  0: {
                     id: 0,
                     autoTrans: [],
                     trans: {
                        first: {
                           ref: '/1',
                           stateId: 2
                        }
                     }
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
                        second: {
                           ref: '/2',
                           stateId: 1
                        }
                     }
                  },
               }
            });
         });
   
         it('converts a "?" name to a skip and a transition to the next', () => {
            const srcList: ContentModelX = {
               particles: [{
                  name: 'first',
                  repeat: CpRepeat.ZEROONE,
               }, {
                  name: 'second',
                  repeat: CpRepeat.ZEROONE,
               }],
               listType: CpType.SEQUENCE,
               repeat: CpRepeat.ONE,
            };

            const result = nameListToGraph(srcList);

            expect(result).toEqual({
               startId: 0,
               endId: 1,
               states: {
                  0: {
                     id: 0,
                     autoTrans: [2],
                     trans: {
                        first: {
                           ref: '/1',
                           stateId: 2
                        }
                     }
                  },
                  1: {
                     id: 1,
                     autoTrans: [],
                     trans: {},
                     done: true,
                  },
                  2: {
                     id: 2,
                     autoTrans: [1],
                     trans: {
                        second: {
                           ref: '/2',
                           stateId: 1
                        }
                     }
                  },
               }
            });
         });

         it('converts a "*" to a skip to the end and a repeat in place', () => {
            const srcList: ContentModelX = {
               particles: [{
                  name: 'first',
                  repeat: CpRepeat.ZEROPLUS
               }, {
                  name: 'second',
                  repeat: CpRepeat.ZEROPLUS
               }],
               listType: CpType.SEQUENCE,
               repeat: CpRepeat.ONE,
            };

            const result = nameListToGraph(srcList);

            expect(result).toEqual({
               startId: 0,
               endId: 1,
               states: {
                  0: {
                     id: 0,
                     autoTrans: [2],
                     trans: {
                        first: {
                           ref: '/1',
                           stateId: 0
                        }
                     }
                  },
                  1: {
                     id: 1,
                     autoTrans: [],
                     trans: {},
                     done: true,
                  },
                  2: {
                     id: 2,
                     autoTrans: [1],
                     trans: {
                        second: {
                           ref: '/2',
                           stateId: 2
                        }
                     }
                  },
               }
            });
         });

         it('converts a "+" to a repeat of a new state', () => {
            const srcList: ContentModelX = {
               particles: [{
                  name: 'first',
                  repeat: CpRepeat.ONEPLUS
               }, {
                  name: 'second',
                  repeat: CpRepeat.ONEPLUS
               }],
               listType: CpType.SEQUENCE,
               repeat: CpRepeat.ONE,
            };

            const result = nameListToGraph(srcList);

            expect(result).toEqual({
               startId: 0,
               endId: 1,
               states: {
                  0: {
                     id: 0,
                     autoTrans: [],
                     trans: {
                        first: {
                           ref: '/1',
                           stateId: 3,
                        }
                     }
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
                        second: {
                           ref: '/2',
                           stateId: 4,
                        }
                     }
                  },
                  3: {
                     id: 3,
                     autoTrans: [2],
                     trans: {
                        first: {
                           ref: '/1',
                           stateId: 3,
                        }
                     }
                  },
                  4: {
                     id: 4,
                     autoTrans: [1],
                     trans: {
                        second: {
                           ref: '/2',
                           stateId: 4,
                        }
                     }
                  },
               }
            });
         });

      });

      describe('choice ContentModelX in choice processing', () => {

         it('converts a "" list', () => {
            const srcList: ContentModelX = {
               particles: [{
                  name: 'first',
                  repeat: CpRepeat.ONE,
               }, {
                  particles: [{
                     name: 'first',
                     repeat: CpRepeat.ONE,
                  }],
                  listType: CpType.CHOICE,
                  repeat: CpRepeat.ONE,
               }, {
                  name: 'last',
                  repeat: CpRepeat.ONE,
               }],
               listType: CpType.CHOICE,
               repeat: CpRepeat.ONE,
            };
   
            const result = nameListToGraph(srcList);
   
            expect(result).toEqual({
               startId: 0,
               endId: 1,
               states: {
                  0: {
                     id: 0,
                     autoTrans: [2],
                     trans: {
                        first: {
                           ref: '/1',
                           stateId: 1
                        },
                        last: {
                           ref: '/3',
                           stateId: 1
                        },
                     }
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
                           stateId: 3
                        }
                     }
                  },
                  3: {
                     id: 3,
                     autoTrans: [1],
                     trans: {}
                  },
               }
            });
         });
   
         it('converts a "?" list', () => {
            const srcList: ContentModelX = {
               particles: [{
                  name: 'first',
                  repeat: CpRepeat.ONE,
               }, {
                  particles: [{
                     name: 'first',
                     repeat: CpRepeat.ONE,
                  }],
                  listType: CpType.CHOICE,
                  repeat: CpRepeat.ZEROONE,
               }, {
                  name: 'last',
                  repeat: CpRepeat.ONE,
               }],
               listType: CpType.CHOICE,
               repeat: CpRepeat.ONE,
            };
   
            const result = nameListToGraph(srcList);
   
            expect(result).toEqual({
               startId: 0,
               endId: 1,
               states: {
                  0: {
                     id: 0,
                     autoTrans: [2],
                     trans: {
                        first: {
                           ref: '/1',
                           stateId: 1
                        },
                        last: {
                           ref: '/3',
                           stateId: 1
                        },
                     }
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
                           stateId: 3
                        }
                     }
                  },
                  3: {
                     id: 3,
                     autoTrans: [1],
                     trans: {}
                  },
               }
            });
         });

         it('converts a "*" list', () => {
            const srcList: ContentModelX = {
               particles: [{
                  name: 'first',
                  repeat: CpRepeat.ONE,
               }, {
                  particles: [{
                     name: 'first',
                     repeat: CpRepeat.ONE,
                  }],
                  listType: CpType.CHOICE,
                  repeat: CpRepeat.ZEROPLUS
               }, {
                  name: 'last',
                  repeat: CpRepeat.ONE,
               }],
               listType: CpType.CHOICE,
               repeat: CpRepeat.ONE,
            };
   
            const result = nameListToGraph(srcList);
   
            expect(result).toEqual({
               startId: 0,
               endId: 1,
               states: {
                  0: {
                     id: 0,
                     autoTrans: [2],
                     trans: {
                        first: {
                           ref: '/1',
                           stateId: 1
                        },
                        last: {
                           ref: '/3',
                           stateId: 1
                        }
                     }
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
                           stateId: 3
                        }
                     }
                  },
                  3: {
                     id: 3,
                     autoTrans: [2, 1],
                     trans: {}
                  },
               }
            });
         });

         it('converts a "+" list', () => {
            const srcList: ContentModelX = {
               particles: [{
                  name: 'first',
                  repeat: CpRepeat.ONE,
               }, {
                  particles: [{
                     name: 'first',
                     repeat: CpRepeat.ONE,
                  }],
                  listType: CpType.CHOICE,
                  repeat: CpRepeat.ONEPLUS
               }, {
                  name: 'last',
                  repeat: CpRepeat.ONE,
               }],
               listType: CpType.CHOICE,
               repeat: CpRepeat.ONE,
            };
   
            const result = nameListToGraph(srcList);
   
            expect(result).toEqual({
               startId: 0,
               endId: 1,
               states: {
                  0: {
                     id: 0,
                     autoTrans: [2],
                     trans: {
                        first: {
                           ref: '/1',
                           stateId: 1
                        },
                        last: {
                           ref: '/3',
                           stateId: 1
                        }
                     }
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
                           stateId: 3
                        }
                     }
                  },
                  3: {
                     id: 3,
                     autoTrans: [2, 1],
                     trans: {}
                  },
               }
            });
         });

      });

      describe('choice ContentModelX in sequence processing', () => {

         it('converts a "" list', () => {
            const srcList: ContentModelX = {
               particles: [{
                  name: 'first',
                  repeat: CpRepeat.ONE,
               }, {
                  particles: [{
                     name: 'first',
                     repeat: CpRepeat.ONE,
                  }],
                  listType: CpType.CHOICE,
                  repeat: CpRepeat.ONE,
               }, {
                  name: 'last',
                  repeat: CpRepeat.ONE,
               }],
               listType: CpType.SEQUENCE,
               repeat: CpRepeat.ONE,
            };
   
            const result = nameListToGraph(srcList);
   
            expect(result).toEqual({
               startId: 0,
               endId: 1,
               states: {
                  0: {
                     id: 0,
                     autoTrans: [],
                     trans: {
                        first: {
                           ref: '/1',
                           stateId: 2
                        }
                     }
                  },
                  1: {
                     id: 1,
                     autoTrans: [],
                     trans: {},
                     done: true
                  },
                  2: {
                     id: 2,
                     autoTrans: [],
                     trans: {
                        first: {
                           ref: '/2/1',
                           stateId: 4
                        }
                     }
                  },
                  3: {
                     id: 3,
                     autoTrans: [],
                     trans: {
                        last: {
                           ref: '/3',
                           stateId: 1
                        }
                     }
                  },
                  4: {
                     id: 4,
                     autoTrans: [3],
                     trans: {}
                  },
               }
            });
         });
   
         it('converts a "?" list', () => {
            const srcList: ContentModelX = {
               particles: [{
                  name: 'first',
                  repeat: CpRepeat.ONE,
               }, {
                  particles: [{
                     name: 'first',
                     repeat: CpRepeat.ONE,
                  }],
                  listType: CpType.CHOICE,
                  repeat: CpRepeat.ZEROONE,
               }, {
                  name: 'last',
                  repeat: CpRepeat.ONE,
               }],
               listType: CpType.SEQUENCE,
               repeat: CpRepeat.ONE,
            };
   
            const result = nameListToGraph(srcList);
   
            expect(result).toEqual({
               startId: 0,
               endId: 1,
               states: {
                  0: {
                     id: 0,
                     autoTrans: [],
                     trans: {
                        first: {
                           ref: '/1',
                           stateId: 2
                        }
                     }
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
                           stateId: 4
                        }
                     }
                  },
                  3: {
                     id: 3,
                     autoTrans: [],
                     trans: {
                        last: {
                           ref: '/3',
                           stateId: 1
                        }
                     }
                  },
                  4: {
                     id: 4,
                     autoTrans: [3],
                     trans: {}
                  },
               }
            });
         });

         it('converts a "*" list', () => {
            const srcList: ContentModelX = {
               particles: [{
                  name: 'first',
                  repeat: CpRepeat.ONE,
               }, {
                  particles: [{
                     name: 'first',
                     repeat: CpRepeat.ONE,
                  }],
                  listType: CpType.CHOICE,
                  repeat: CpRepeat.ZEROPLUS
               }, {
                  name: 'last',
                  repeat: CpRepeat.ONE,
               }],
               listType: CpType.SEQUENCE,
               repeat: CpRepeat.ONE,
            };
   
            const result = nameListToGraph(srcList);
   
            expect(result).toEqual({
               startId: 0,
               endId: 1,
               states: {
                  0: {
                     id: 0,
                     autoTrans: [],
                     trans: {
                        first: {
                           ref: '/1',
                           stateId: 2
                        }
                     }
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
                           stateId: 4
                        }
                     }
                  },
                  3: {
                     id: 3,
                     autoTrans: [],
                     trans: {
                        last: {
                           ref: '/3',
                           stateId: 1
                        }
                     }
                  },
                  4: {
                     id: 4,
                     autoTrans: [2, 3],
                     trans: {}
                  },
               }
            });
         });

         it('converts a "+" list', () => {
            const srcList: ContentModelX = {
               particles: [{
                  name: 'first',
                  repeat: CpRepeat.ONE,
               }, {
                  particles: [{
                     name: 'first',
                     repeat: CpRepeat.ONE,
                  }],
                  listType: CpType.CHOICE,
                  repeat: CpRepeat.ONEPLUS
               }, {
                  name: 'last',
                  repeat: CpRepeat.ONE,
               }],
               listType: CpType.SEQUENCE,
               repeat: CpRepeat.ONE,
            };
   
            const result = nameListToGraph(srcList);
   
            expect(result).toEqual({
               startId: 0,
               endId: 1,
               states: {
                  0: {
                     id: 0,
                     autoTrans: [],
                     trans: {
                        first: {
                           ref: '/1',
                           stateId: 2
                        }
                     }
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
                           stateId: 4
                        }
                     }
                  },
                  3: {
                     id: 3,
                     autoTrans: [],
                     trans: {
                        last: {
                           ref: '/3',
                           stateId: 1
                        }
                     }
                  },
                  4: {
                     id: 4,
                     autoTrans: [2, 3],
                     trans: {}
                  },
               }
            });
         });

      });
         
      describe('sequence ContentModelX in choice processing', () => {

         it('converts a "" list', () => {
            const srcList: ContentModelX = {
               particles: [{
                  name: 'first',
                  repeat: CpRepeat.ONE,
               }, {
                  particles: [{
                     name: 'first',
                     repeat: CpRepeat.ONE,
                  }],
                  listType: CpType.SEQUENCE,
                  repeat: CpRepeat.ONE,
               }, {
                  name: 'last',
                  repeat: CpRepeat.ONE,
               }],
               listType: CpType.CHOICE,
               repeat: CpRepeat.ONE,
            };
   
            const result = nameListToGraph(srcList);
   
            expect(result).toEqual({
               startId: 0,
               endId: 1,
               states: {
                  0: {
                     id: 0,
                     autoTrans: [2],
                     trans: {
                        first: {
                           ref: '/1',
                           stateId: 1
                        },
                        last: {
                           ref: '/3',
                           stateId: 1
                        }
                     }
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
                           stateId: 3
                        }
                     }
                  },
                  3: {
                     id: 3,
                     autoTrans: [1],
                     trans: {}
                  },
               }
            });
         });
   
         it('converts a "?" list', () => {
            const srcList: ContentModelX = {
               particles: [{
                  name: 'first',
                  repeat: CpRepeat.ONE,
               }, {
                  particles: [{
                     name: 'first',
                     repeat: CpRepeat.ONE,
                  }],
                  listType: CpType.SEQUENCE,
                  repeat: CpRepeat.ZEROONE,
               }, {
                  name: 'last',
                  repeat: CpRepeat.ONE,
               }],
               listType: CpType.CHOICE,
               repeat: CpRepeat.ONE,
            };
   
            const result = nameListToGraph(srcList);
   
            expect(result).toEqual({
               startId: 0,
               endId: 1,
               states: {
                  0: {
                     id: 0,
                     autoTrans: [2],
                     trans: {
                        first: {
                           ref: '/1',
                           stateId: 1
                        },
                        last: {
                           ref: '/3',
                           stateId: 1
                        }
                     }
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
                           stateId: 3
                        }
                     }
                  },
                  3: {
                     id: 3,
                     autoTrans: [1],
                     trans: {}
                  },
               }
            });
         });

         it('converts a "*" list', () => {
            const srcList: ContentModelX = {
               particles: [{
                  name: 'first',
                  repeat: CpRepeat.ONE,
               }, {
                  particles: [{
                     name: 'first',
                     repeat: CpRepeat.ONE,
                  }],
                  listType: CpType.SEQUENCE,
                  repeat: CpRepeat.ZEROPLUS
               }, {
                  name: 'last',
                  repeat: CpRepeat.ONE,
               }],
               listType: CpType.CHOICE,
               repeat: CpRepeat.ONE,
            };
   
            const result = nameListToGraph(srcList);
   
            expect(result).toEqual({
               startId: 0,
               endId: 1,
               states: {
                  0: {
                     id: 0,
                     autoTrans: [2],
                     trans: {
                        first: {
                           ref: '/1',
                           stateId: 1
                        },
                        last: {
                           ref: '/3',
                           stateId: 1
                        }
                     }
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
                           stateId: 3
                        }
                     }
                  },
                  3: {
                     id: 3,
                     autoTrans: [2, 1],
                     trans: {}
                  },
               }
            });
         });

         it('converts a "+" list', () => {
            const srcList: ContentModelX = {
               particles: [{
                  name: 'first',
                  repeat: CpRepeat.ONE,
               }, {
                  particles: [{
                     name: 'first',
                     repeat: CpRepeat.ONE,
                  }],
                  listType: CpType.SEQUENCE,
                  repeat: CpRepeat.ONEPLUS
               }, {
                  name: 'last',
                  repeat: CpRepeat.ONE,
               }],
               listType: CpType.CHOICE,
               repeat: CpRepeat.ONE,
            };
   
            const result = nameListToGraph(srcList);
   
            expect(result).toEqual({
               startId: 0,
               endId: 1,
               states: {
                  0: {
                     id: 0,
                     autoTrans: [2],
                     trans: {
                        first: {
                           ref: '/1',
                           stateId: 1
                        },
                        last: {
                           ref: '/3',
                           stateId: 1
                        },
                     }
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
                           stateId: 3
                        }
                     }
                  },
                  3: {
                     id: 3,
                     autoTrans: [2, 1],
                     trans: {}
                  },
               }
            });
         });

      });

      describe('sequence ContentModelX in sequence processing', () => {

         it('converts a "" list', () => {
            const srcList: ContentModelX = {
               particles: [{
                  name: 'first',
                  repeat: CpRepeat.ONE,
               }, {
                  particles: [{
                     name: 'first',
                     repeat: CpRepeat.ONE,
                  }, {
                     name: 'second',
                     repeat: CpRepeat.ONE,
                  }],
                  listType: CpType.SEQUENCE,
                  repeat: CpRepeat.ONE,
               }, {
                  name: 'last',
                  repeat: CpRepeat.ONE,
               }],
               listType: CpType.SEQUENCE,
               repeat: CpRepeat.ONE,
            };
   
            const result = nameListToGraph(srcList);
   
            expect(result).toEqual({
               startId: 0,
               endId: 1,
               states: {
                  0: {
                     id: 0,
                     autoTrans: [],
                     trans: {
                        first: {
                           ref: '/1',
                           stateId: 2
                        }
                     }
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
                           stateId: 5
                        }
                     }
                  },
                  3: {
                     id: 3,
                     autoTrans: [],
                     trans: {
                        last: {
                           ref: '/3',
                           stateId: 1
                        }
                     }
                  },
                  4: {
                     id: 4,
                     autoTrans: [3],
                     trans: {}
                  },
                  5: {
                     id: 5,
                     autoTrans: [],
                     trans: {
                        second: {
                           ref: '/2/2',
                           stateId: 4
                        }
                     }
                  },
               }
            });
         });
   
         it('converts a "?" list', () => {
            const srcList: ContentModelX = {
               particles: [{
                  name: 'first',
                  repeat: CpRepeat.ONE,
               }, {
                  particles: [{
                     name: 'first',
                     repeat: CpRepeat.ONE,
                  }],
                  listType: CpType.SEQUENCE,
                  repeat: CpRepeat.ZEROONE,
               }, {
                  name: 'last',
                  repeat: CpRepeat.ONE,
               }],
               listType: CpType.SEQUENCE,
               repeat: CpRepeat.ONE,
            };
   
            const result = nameListToGraph(srcList);
   
            expect(result).toEqual({
               startId: 0,
               endId: 1,
               states: {
                  0: {
                     id: 0,
                     autoTrans: [],
                     trans: {
                        first: {
                           ref: '/1',
                           stateId: 2
                        }
                     }
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
                           stateId: 4
                        }
                     }
                  },
                  3: {
                     id: 3,
                     autoTrans: [],
                     trans: {
                        last: {
                           ref: '/3',
                           stateId: 1
                        }
                     }
                  },
                  4: {
                     id: 4,
                     autoTrans: [3],
                     trans: {}
                  },
               }
            });
         });

         it('converts a "*" list', () => {
            const srcList: ContentModelX = {
               particles: [{
                  name: 'first',
                  repeat: CpRepeat.ONE,
               }, {
                  particles: [{
                     name: 'first',
                     repeat: CpRepeat.ONE,
                  }],
                  listType: CpType.SEQUENCE,
                  repeat: CpRepeat.ZEROPLUS
               }, {
                  name: 'last',
                  repeat: CpRepeat.ONE,
               }],
               listType: CpType.SEQUENCE,
               repeat: CpRepeat.ONE,
            };
   
            const result = nameListToGraph(srcList);
   
            expect(result).toEqual({
               startId: 0,
               endId: 1,
               states: {
                  0: {
                     id: 0,
                     autoTrans: [],
                     trans: {
                        first: {
                           ref: '/1',
                           stateId: 2
                        }
                     }
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
                           stateId: 4
                        }
                     }
                  },
                  3: {
                     id: 3,
                     autoTrans: [],
                     trans: {
                        last: {
                           ref: '/3',
                           stateId: 1
                        }
                     }
                  },
                  4: {
                     id: 4,
                     autoTrans: [2, 3],
                     trans: {}
                  },
               }
            });
         });

         it('converts a "+" list', () => {
            const srcList: ContentModelX = {
               particles: [{
                  name: 'first',
                  repeat: CpRepeat.ONE,
               }, {
                  particles: [{
                     name: 'first',
                     repeat: CpRepeat.ONE,
                  }],
                  listType: CpType.SEQUENCE,
                  repeat: CpRepeat.ONEPLUS
               }, {
                  name: 'last',
                  repeat: CpRepeat.ONE,
               }],
               listType: CpType.SEQUENCE,
               repeat: CpRepeat.ONE,
            };
   
            const result = nameListToGraph(srcList);
   
            expect(result).toEqual({
               startId: 0,
               endId: 1,
               states: {
                  0: {
                     id: 0,
                     autoTrans: [],
                     trans: {
                        first: {
                           ref: '/1',
                           stateId: 2
                        }
                     }
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
                        }
                     }
                  },
                  3: {
                     id: 3,
                     autoTrans: [],
                     trans: {
                        last: {
                           ref: '/3',
                           stateId: 1
                        }
                     }
                  },
                  4: {
                     id: 4,
                     autoTrans: [2, 3],
                     trans: {}
                  },
               }
            });
         });

      });
         
});
