/* Copyright ® 2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation, EntityMetaData, Range } from '../../basic/index';
import { ErrorCollector, WellFormedError, XmlWarning } from '../../error/index';
import { defaultExtractors } from '../../extractor/index';
import { SToken, STokenSource } from '../../sToken/index';
import { makeSTokenMaker } from '../../sToken/@test/helper';

import declaration, { DeclarationPToken } from '../bridge/declaration';
import nameList, { ContentParticlePToken, NameListPToken } from '../common/nameList';
import entityReference from '../entityReference';
import entityStart from '../entityStart.js';
import externalId from '../common/externalId.js';
import elementDeclaration from '../elementDeclaration.js';
import text from '../text';
import unassigned from '../common/unassigned';

import helper from './helper.js';

describe('elementDeclaration (integration)', () => {
   let declarationPToken: DeclarationPToken;
   let expectedSToken: (str: string) => SToken;

   beforeEach(() => {
      expectedSToken = makeSTokenMaker();
      declarationPToken = new declaration.PToken(undefined, {
         open: expectedSToken('<!'),
         postOpenSpace: undefined,
         declType: expectedSToken('ELEMENT'),
         postDeclTypeSpace: expectedSToken(' '),
      });
   });

   describe('parse()', () => {

      it('parses a PERef (check unsasigned calls)', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('%foo;>');
         source.endText();

         elementDeclaration.parse(source, new declaration.PToken(), (result) => {
            const makeSToken = makeSTokenMaker();
            const makeSToken1 = makeSTokenMaker(undefined, 5, 0, 5);
            expect(result).toEqual(new elementDeclaration.PToken({
               unassigned: [ {
                  type: 'reference',
                  token: new entityReference.ParamPToken({
                     open:  makeSToken('%'),
                     postOpenSpace: undefined,
                     name:  makeSToken('foo'),
                     postNameSpace: undefined,
                     close:  makeSToken(';'),
                  }),
               } ],
               nextPropName: 'name',
               close: makeSToken1('>'),
            }));
            done();
         });
      });

      it('parses a complex content spec', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('AnElement ( one* | two +|(threeA,threeB?)+ | ( fourA, (fourB1 | fourB2)*, fourC))? >');
         source.endText();

         elementDeclaration.parse(source, new declaration.PToken(), (result) => {
            expect(JSON.parse(JSON.stringify(result))).toEqual(PARSE_TEST_EXPECTED);
            done();
         });
      });
   });

   describe('assignUnassigned()', () => {
   });

   describe('checkWellFormed()', () => {

      it('asks the declaration module to look for problems in the declaration part', (done) => {
         declarationPToken.postOpenSpace = expectedSToken(' ');
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('foo SYSTEM "sys.dtd">');
         source.endText();

         elementDeclaration.parse(source, declarationPToken, (parsing) => {
            const ec = new ErrorCollector(SToken.fromString('x'), WellFormedError);

            elementDeclaration.checkWellFormed(parsing, ec, new EntityMetaData());

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.DECL_OPEN_XTRA_SPACE_AFTER);
            done();
         });
      });

      it('calls misc.checkName() to report on invalid names', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('$foo ANY>');
         source.endText();
         elementDeclaration.parse(source, declarationPToken, (result) => {
            const ec = new ErrorCollector(result.open, WellFormedError);

            elementDeclaration.checkWellFormed(result, ec, new EntityMetaData());

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.ELEMENTDECL_NAME_INVALID);
            done();
         });
      });

      it('calls misc.checkWellFormedNameRecommendation() to report on bad names', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('xmlOne ANY>');
         source.endText();

         elementDeclaration.parse(source, declarationPToken, (parsing) => {
            const ec = new ErrorCollector(SToken.fromString('x'), WellFormedError);

            elementDeclaration.checkWellFormed(parsing, ec, new EntityMetaData());

            expect(ec.getErrors()[0].id).toEqual(XmlWarning.ID.ELEMENTDECL_NAME_XML_RESERVED);
            done();
         });
      });

      // it('calls unassigned.checkExtra() to report on extra values', (done) => {
      //    const source = new STokenSource(defaultExtractors, new EntityMetaData());
      //    source.addText('%bar; "other">');
      //    source.endText();

      //    elementDeclaration.parse(source, declarationPToken, (pToken) => {
      //       // "expand" what should be there.
      //       pToken.unassigned.shift(); // get rid of the peref
      //       pToken.unassigned = [
      //          new entityStart.ParamPToken({}), {
      //             type: 'literal',
      //             openQuote: new SToken('"', '"', new Range()),
      //             value: [ new text.PToken({ text: new SToken('sys.dtd', 'sys.dtd', new Range()) }) ],
      //             closeQuote: new SToken('"', '"', new Range()),
      //          },
      //          new ParameterEntityEndPToken({}),
      //       ].concat(pToken.unassigned);
      //       pToken.externalId.unassigned = pToken.unassigned;
      //       notationDeclaration.assignUnassigned(pToken);
      //       const ec = new ErrorCollector(undefined, WellFormedError);

      //       notationDeclaration.checkWellFormed(pToken, ec, new EntityMetaData());

      //       expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.NOTATIONDECL_EXTRA_TEXT);
      //       done();
      //    });
      // });

   });

});

const PARSE_TEST_EXPECTED = {
   type: 'ELEMENTDECL',
   open: {
      str: '',
      originalStr: '',
      ranges: [
         {
            startIndex: 0,
            startRow: 0,
            startColumn: 0,
            endIndex: 0,
            endRow: 0,
            endColumn: 0,
         }
      ],
   },
   name: {
      str: 'AnElement',
      originalStr: 'AnElement',
      ranges: [
         {
            location: {
               systemId: ''
            },
            startIndex: 0,
            startRow: 0,
            startColumn: 0,
            endIndex: 9,
            endRow: 0,
            endColumn: 9
         }
      ]
   },
   postNameSpace: {
      str: ' ',
      originalStr: ' ',
      ranges: [
         {
            location: {
               systemId: '',
            },
            startIndex: 9,
            startRow: 0,
            startColumn: 9,
            endIndex: 10,
            endRow: 0,
            endColumn: 10
         }
      ]
   },
   children: {
      type: 'NAMELIST_PTOKEN_TYPE',
      names: [
         {
            particle: {
               name: {
                  str: 'one',
                  originalStr: 'one',
                  ranges: [
                     {
                        location: {
                           systemId: '',
                        },
                        startIndex: 12,
                        startRow: 0,
                        startColumn: 12,
                        endIndex: 15,
                        endRow: 0,
                        endColumn: 15
                     }
                  ]
               },
               repeat: {
                  str: '*',
                  originalStr: '*',
                  ranges: [
                     {
                        location: {
                           systemId: '',
                        },
                        startIndex: 15,
                        startRow: 0,
                        startColumn: 15,
                        endIndex: 16,
                        endRow: 0,
                        endColumn: 16
                     }
                  ]
               },
               postRepeatSpace: {
                  str: ' ',
                  originalStr: ' ',
                  ranges: [
                     {
                        location: {
                           systemId: '',
                        },
                        startIndex: 16,
                        startRow: 0,
                        startColumn: 16,
                        endIndex: 17,
                        endRow: 0,
                        endColumn: 17
                     }
                  ]
               }
            },
            delimiter: {
               str: '|',
               originalStr: '|',
               ranges: [
                  {
                     location: {
                        systemId: '',
                     },
                     startIndex: 17,
                     startRow: 0,
                     startColumn: 17,
                     endIndex: 18,
                     endRow: 0,
                     endColumn: 18
                  }
               ]
            },
            postDelimiterSpace: {
               str: ' ',
               originalStr: ' ',
               ranges: [
                  {
                     location: {
                        systemId: '',
                     },
                     startIndex: 18,
                     startRow: 0,
                     startColumn: 18,
                     endIndex: 19,
                     endRow: 0,
                     endColumn: 19
                  }
               ]
            }
         },
         {
            particle: {
               name: {
                  str: 'two',
                  originalStr: 'two',
                  ranges: [
                     {
                        location: {
                           systemId: '',
                        },
                        startIndex: 19,
                        startRow: 0,
                        startColumn: 19,
                        endIndex: 22,
                        endRow: 0,
                        endColumn: 22
                     }
                  ]
               },
               postNameSpace: {
                  str: ' ',
                  originalStr: ' ',
                  ranges: [
                     {
                        location: {
                           systemId: '',
                        },
                        startIndex: 22,
                        startRow: 0,
                        startColumn: 22,
                        endIndex: 23,
                        endRow: 0,
                        endColumn: 23
                     }
                  ]
               },
               repeat: {
                  str: '+',
                  originalStr: '+',
                  ranges: [
                     {
                        location: {
                           systemId: '',
                        },
                        startIndex: 23,
                        startRow: 0,
                        startColumn: 23,
                        endIndex: 24,
                        endRow: 0,
                        endColumn: 24
                     }
                  ]
               }
            },
            delimiter: {
               str: '|',
               originalStr: '|',
               ranges: [
                  {
                     location: {
                        systemId: '',
                     },
                     startIndex: 24,
                     startRow: 0,
                     startColumn: 24,
                     endIndex: 25,
                     endRow: 0,
                     endColumn: 25
                  }
               ]
            }
         },
         {
            particle: {
               type: 'NAMELIST_PTOKEN_TYPE',
               names: [
                  {
                     particle: {
                        name: {
                           str: 'threeA',
                           originalStr: 'threeA',
                           ranges: [
                              {
                                 location: {
                                    systemId: '',
                                 },
                                 startIndex: 26,
                                 startRow: 0,
                                 startColumn: 26,
                                 endIndex: 32,
                                 endRow: 0,
                                 endColumn: 32
                              }
                           ]
                        }
                     },
                     delimiter: {
                        str: ',',
                        originalStr: ',',
                        ranges: [
                           {
                              location: {
                                 systemId: '',
                              },
                              startIndex: 32,
                              startRow: 0,
                              startColumn: 32,
                              endIndex: 33,
                              endRow: 0,
                              endColumn: 33
                           }
                        ]
                     }
                  },
                  {
                     particle: {
                        name: {
                           str: 'threeB',
                           originalStr: 'threeB',
                           ranges: [
                              {
                                 location: {
                                    systemId: '',
                                 },
                                 startIndex: 33,
                                 startRow: 0,
                                 startColumn: 33,
                                 endIndex: 39,
                                 endRow: 0,
                                 endColumn: 39
                              }
                           ]
                        },
                        repeat: {
                           str: '?',
                           originalStr: '?',
                           ranges: [
                              {
                                 location: {
                                    systemId: '',
                                 },
                                 startIndex: 39,
                                 startRow: 0,
                                 startColumn: 39,
                                 endIndex: 40,
                                 endRow: 0,
                                 endColumn: 40
                              }
                           ]
                        }
                     }
                  }
               ],
               open: {
                  str: '(',
                  originalStr: '(',
                  ranges: [
                     {
                        location: {
                           systemId: '',
                        },
                        startIndex: 25,
                        startRow: 0,
                        startColumn: 25,
                        endIndex: 26,
                        endRow: 0,
                        endColumn: 26
                     }
                  ]
               },
               close: {
                  str: ')',
                  originalStr: ')',
                  ranges: [
                     {
                        location: {
                           systemId: '',
                        },
                        startIndex: 40,
                        startRow: 0,
                        startColumn: 40,
                        endIndex: 41,
                        endRow: 0,
                        endColumn: 41
                     }
                  ]
               },
               repeat: {
                  str: '+',
                  originalStr: '+',
                  ranges: [
                     {
                        location: {
                           systemId: '',
                        },
                        startIndex: 41,
                        startRow: 0,
                        startColumn: 41,
                        endIndex: 42,
                        endRow: 0,
                        endColumn: 42
                     }
                  ]
               },
               postRepeatSpace: {
                  str: ' ',
                  originalStr: ' ',
                  ranges: [
                     {
                        location: {
                           systemId: '',
                        },
                        startIndex: 42,
                        startRow: 0,
                        startColumn: 42,
                        endIndex: 43,
                        endRow: 0,
                        endColumn: 43
                     }
                  ]
               }
            },
            delimiter: {
               str: '|',
               originalStr: '|',
               ranges: [
                  {
                     location: {
                        systemId: '',
                     },
                     startIndex: 43,
                     startRow: 0,
                     startColumn: 43,
                     endIndex: 44,
                     endRow: 0,
                     endColumn: 44
                  }
               ]
            },
            postDelimiterSpace: {
               str: ' ',
               originalStr: ' ',
               ranges: [
                  {
                     location: {
                        systemId: '',
                     },
                     startIndex: 44,
                     startRow: 0,
                     startColumn: 44,
                     endIndex: 45,
                     endRow: 0,
                     endColumn: 45
                  }
               ]
            }
         },
         {
            particle: {
               type: 'NAMELIST_PTOKEN_TYPE',
               names: [
                  {
                     particle: {
                        name: {
                           str: 'fourA',
                           originalStr: 'fourA',
                           ranges: [
                              {
                                 location: {
                                    systemId: '',
                                 },
                                 startIndex: 47,
                                 startRow: 0,
                                 startColumn: 47,
                                 endIndex: 52,
                                 endRow: 0,
                                 endColumn: 52
                              }
                           ]
                        }
                     },
                     delimiter: {
                        str: ',',
                        originalStr: ',',
                        ranges: [
                           {
                              location: {
                                 systemId: '',
                              },
                              startIndex: 52,
                              startRow: 0,
                              startColumn: 52,
                              endIndex: 53,
                              endRow: 0,
                              endColumn: 53
                           }
                        ]
                     },
                     postDelimiterSpace: {
                        str: ' ',
                        originalStr: ' ',
                        ranges: [
                           {
                              location: {
                                 systemId: '',
                              },
                              startIndex: 53,
                              startRow: 0,
                              startColumn: 53,
                              endIndex: 54,
                              endRow: 0,
                              endColumn: 54
                           }
                        ]
                     }
                  },
                  {
                     particle: {
                        type: 'NAMELIST_PTOKEN_TYPE',
                        names: [
                           {
                              particle: {
                                 name: {
                                    str: 'fourB1',
                                    originalStr: 'fourB1',
                                    ranges: [
                                       {
                                          location: {
                                             systemId: '',
                                          },
                                          startIndex: 55,
                                          startRow: 0,
                                          startColumn: 55,
                                          endIndex: 61,
                                          endRow: 0,
                                          endColumn: 61
                                       }
                                    ]
                                 },
                                 postNameSpace: {
                                    str: ' ',
                                    originalStr: ' ',
                                    ranges: [
                                       {
                                          location: {
                                             systemId: '',
                                          },
                                          startIndex: 61,
                                          startRow: 0,
                                          startColumn: 61,
                                          endIndex: 62,
                                          endRow: 0,
                                          endColumn: 62
                                       }
                                    ]
                                 }
                              },
                              delimiter: {
                                 str: '|',
                                 originalStr: '|',
                                 ranges: [
                                    {
                                       location: {
                                          systemId: '',
                                       },
                                       startIndex: 62,
                                       startRow: 0,
                                       startColumn: 62,
                                       endIndex: 63,
                                       endRow: 0,
                                       endColumn: 63
                                    }
                                 ]
                              },
                              postDelimiterSpace: {
                                 str: ' ',
                                 originalStr: ' ',
                                 ranges: [
                                    {
                                       location: {
                                          systemId: '',
                                       },
                                       startIndex: 63,
                                       startRow: 0,
                                       startColumn: 63,
                                       endIndex: 64,
                                       endRow: 0,
                                       endColumn: 64
                                    }
                                 ]
                              }
                           },
                           {
                              particle: {
                                 name: {
                                    str: 'fourB2',
                                    originalStr: 'fourB2',
                                    ranges: [
                                       {
                                          location: {
                                             systemId: '',
                                          },
                                          startIndex: 64,
                                          startRow: 0,
                                          startColumn: 64,
                                          endIndex: 70,
                                          endRow: 0,
                                          endColumn: 70
                                       }
                                    ]
                                 }
                              }
                           }
                        ],
                        open: {
                           str: '(',
                           originalStr: '(',
                           ranges: [
                              {
                                 location: {
                                    systemId: '',
                                 },
                                 startIndex: 54,
                                 startRow: 0,
                                 startColumn: 54,
                                 endIndex: 55,
                                 endRow: 0,
                                 endColumn: 55
                              }
                           ]
                        },
                        close: {
                           str: ')',
                           originalStr: ')',
                           ranges: [
                              {
                                 location: {
                                    systemId: '',
                                 },
                                 startIndex: 70,
                                 startRow: 0,
                                 startColumn: 70,
                                 endIndex: 71,
                                 endRow: 0,
                                 endColumn: 71
                              }
                           ]
                        },
                        repeat: {
                           str: '*',
                           originalStr: '*',
                           ranges: [
                              {
                                 location: {
                                    systemId: '',
                                 },
                                 startIndex: 71,
                                 startRow: 0,
                                 startColumn: 71,
                                 endIndex: 72,
                                 endRow: 0,
                                 endColumn: 72
                              }
                           ]
                        }
                     },
                     delimiter: {
                        str: ',',
                        originalStr: ',',
                        ranges: [
                           {
                              location: {
                                 systemId: '',
                              },
                              startIndex: 72,
                              startRow: 0,
                              startColumn: 72,
                              endIndex: 73,
                              endRow: 0,
                              endColumn: 73
                           }
                        ]
                     },
                     postDelimiterSpace: {
                        str: ' ',
                        originalStr: ' ',
                        ranges: [
                           {
                              location: {
                                 systemId: '',
                              },
                              startIndex: 73,
                              startRow: 0,
                              startColumn: 73,
                              endIndex: 74,
                              endRow: 0,
                              endColumn: 74
                           }
                        ]
                     }
                  },
                  {
                     particle: {
                        name: {
                           str: 'fourC',
                           originalStr: 'fourC',
                           ranges: [
                              {
                                 location: {
                                    systemId: '',
                                 },
                                 startIndex: 74,
                                 startRow: 0,
                                 startColumn: 74,
                                 endIndex: 79,
                                 endRow: 0,
                                 endColumn: 79
                              }
                           ]
                        }
                     }
                  }
               ],
               open: {
                  str: '(',
                  originalStr: '(',
                  ranges: [
                     {
                        location: {
                           systemId: '',
                        },
                        startIndex: 45,
                        startRow: 0,
                        startColumn: 45,
                        endIndex: 46,
                        endRow: 0,
                        endColumn: 46
                     }
                  ]
               },
               postOpenSpace: {
                  str: ' ',
                  originalStr: ' ',
                  ranges: [
                     {
                        location: {
                           systemId: '',
                        },
                        startIndex: 46,
                        startRow: 0,
                        startColumn: 46,
                        endIndex: 47,
                        endRow: 0,
                        endColumn: 47
                     }
                  ]
               },
               close: {
                  str: ')',
                  originalStr: ')',
                  ranges: [
                     {
                        location: {
                           systemId: '',
                        },
                        startIndex: 79,
                        startRow: 0,
                        startColumn: 79,
                        endIndex: 80,
                        endRow: 0,
                        endColumn: 80
                     }
                  ]
               }
            }
         }
      ],
      open: {
         str: '(',
         originalStr: '(',
         ranges: [
            {
               location: {
                  systemId: '',
               },
               startIndex: 10,
               startRow: 0,
               startColumn: 10,
               endIndex: 11,
               endRow: 0,
               endColumn: 11
            }
         ]
      },
      postOpenSpace: {
         str: ' ',
         originalStr: ' ',
         ranges: [
            {
               location: {
                  systemId: '',
               },
               startIndex: 11,
               startRow: 0,
               startColumn: 11,
               endIndex: 12,
               endRow: 0,
               endColumn: 12
            }
         ]
      },
      close: {
         str: ')',
         originalStr: ')',
         ranges: [
            {
               location: {
                  systemId: '',
               },
               startIndex: 80,
               startRow: 0,
               startColumn: 80,
               endIndex: 81,
               endRow: 0,
               endColumn: 81
            }
         ]
      },
      repeat: {
         str: '?',
         originalStr: '?',
         ranges: [
            {
               location: {
                  systemId: '',
               },
               startIndex: 81,
               startRow: 0,
               startColumn: 81,
               endIndex: 82,
               endRow: 0,
               endColumn: 82
            }
         ]
      },
      postRepeatSpace: {
         str: ' ',
         originalStr: ' ',
         ranges: [
            {
               location: {
                  systemId: '',
               },
               startIndex: 82,
               startRow: 0,
               startColumn: 82,
               endIndex: 83,
               endRow: 0,
               endColumn: 83
            }
         ]
      }
   },
   close: {
      str: '>',
      originalStr: '>',
      ranges: [
         {
            location: {
               systemId: '',
            },
            startIndex: 83,
            startRow: 0,
            startColumn: 83,
            endIndex: 84,
            endRow: 0,
            endColumn: 84
         }
      ]
   }
};
