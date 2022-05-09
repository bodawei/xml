/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { ConformanceVersion, EntityId, XmlErrorToken } from 'basic';
import { ParameterEntityReferencePToken, TextPToken } from 'pToken';
import { ExpandParams, RetrieveResults } from 'source/expand/types';
import { STokenSource, toSToken } from 'sToken';
import { ConditionalStartPToken, resumeParseConditional } from 'token';
import { makeParameterEntityDeclaration, makeParameterEntityReference } from 'token-test';
import { addProtoReplacementText } from '../addProtoReplacementText';
import { entityValueToSTokenSource } from '../entityValueToSTokenSource';

import { ConditionalStartExpander } from '../ConditionalStartExpander';
import { EntityContextStack } from '../EntityContextStack';
import { EntityDetails } from '../EntityDetails';

jest.mock('../../../token/conditionalStart', () => {
   const realConditional: Record<string, unknown> = jest.requireActual(
      '../../../token/conditionalStart',
   );
   return {
      ...realConditional,
      resumeParseConditional: jest.fn(),
   };
});
jest.mock('../addProtoReplacementText');
jest.mock('../entityValueToSTokenSource');

describe('ConditionalStartExpander (unit)', () => {
   let expand: ExpandParams;
   let start: ConditionalStartPToken;
   let mockAddProtoReplacementText: jest.MockedFunction<typeof addProtoReplacementText>;
   let mockResumeParseConditional: jest.MockedFunction<typeof resumeParseConditional>;
   let mockEntityValueToSTokenSource: jest.MockedFunction<typeof entityValueToSTokenSource>;

   beforeEach(() => {
      expand = {
         entityId: new EntityId(),
         confVer: new ConformanceVersion(),
         entityDetails: new EntityDetails(),
         loadExternalEntities: false,
         utils: {
            parseBody: (): void => undefined,
            parseEntityValue: (sTokenSource, done): void => {
               done([]);
            },
            resolveEntityId: () => '',
            retrieveExternalEntity: (): RetrieveResults => {
               return {
                  sTokenSource: new STokenSource(),
                  getErrors: (): Array<XmlErrorToken> => [],
               };
            },
            parseAttributeValue: (): void => {},
         },
      };

      start = new ConditionalStartPToken({
         open: toSToken('<!['),
         unexpanded: {
            peRef: makeParameterEntityReference(),
            propName: 'foo',
         },
      });

      expand.entityDetails.addEntity(makeParameterEntityDeclaration(), [], undefined);

      mockAddProtoReplacementText = addProtoReplacementText as jest.MockedFunction<
         typeof addProtoReplacementText
      >;
      mockResumeParseConditional = resumeParseConditional as jest.MockedFunction<
         typeof resumeParseConditional
      >;
      mockEntityValueToSTokenSource = entityValueToSTokenSource as jest.MockedFunction<
         typeof entityValueToSTokenSource
      >;

      const source = new STokenSource();
      source.addText('foo');
      source.endText();
      mockEntityValueToSTokenSource.mockReturnValue(source);
   });

   it('immediately declares itself as done when called with a conditional start without an unexpanded', () => {
      const done = jest.fn();
      const start = new ConditionalStartPToken({
         open: toSToken('<!['),
      });

      new ConditionalStartExpander(start, expand, new EntityContextStack(), done);

      expect(done).toHaveBeenCalledWith({
         done: true,
         newStart: start,
         extraText: expect.any(STokenSource),
      });
   });

   it('calls addProtoReplacementText() with the peref', () => {
      new ConditionalStartExpander(start, expand, new EntityContextStack(), () => {});

      expect(mockAddProtoReplacementText).toHaveBeenCalledWith(
         makeParameterEntityReference(),
         expand,
         new EntityContextStack(),
         expect.any(Function),
      );
   });

   it('calls resumeParseConditional() with the source and start during construction', () => {
      mockAddProtoReplacementText.mockImplementation((x, y, z, cb) => {
         // eslint-disable-next-line @typescript-eslint/no-explicit-any
         cb({} as any);
      });

      new ConditionalStartExpander(start, expand, new EntityContextStack(), () => {});

      expect(mockResumeParseConditional).toHaveBeenCalledWith(
         expect.any(STokenSource),
         start,
         expect.any(Function),
      );
   });

   it('declares the processing done if there are no entity details for the peRef', () => {
      const done = jest.fn();
      mockAddProtoReplacementText.mockImplementation((x, y, z, cb) => {
         // eslint-disable-next-line @typescript-eslint/no-explicit-any
         cb({} as any);
      });
      const start = new ConditionalStartPToken({
         open: toSToken('<!['),
         unexpanded: {
            peRef: new ParameterEntityReferencePToken({
               open: toSToken('&'),
               name: toSToken('youDoNotHaveMe'),
               close: toSToken(';'),
            }),
            propName: 'foo',
         },
      });

      new ConditionalStartExpander(start, expand, new EntityContextStack(), done);

      expect(done).toHaveBeenCalledWith({
         done: true,
         newStart: start,
         extraText: expect.any(Object),
      });
   });

   it('declares the processing done if the resume parse found a bracket (and the source is consumed)', () => {
      const done = jest.fn();
      mockAddProtoReplacementText.mockImplementation((x, y, z, cb) => {
         // eslint-disable-next-line @typescript-eslint/no-explicit-any
         cb({} as any);
      });
      const source = new STokenSource();
      source.endText();
      mockEntityValueToSTokenSource.mockReturnValue(source);
      mockResumeParseConditional.mockImplementation((y, z, cb) => {
         cb(
            new ConditionalStartPToken({
               open: toSToken('<!['),
               bracket: toSToken(']'),
               unexpanded: {
                  peRef: makeParameterEntityReference(),
                  propName: 'foo',
                  secondPropName: 'bar',
               },
            }),
         );
      });

      new ConditionalStartExpander(start, expand, new EntityContextStack(), done);

      expect(done).toHaveBeenCalledWith({
         done: true,
         newStart: new ConditionalStartPToken({
            open: toSToken('<!['),
            bracket: toSToken(']'),
            unexpanded: {
               peRef: makeParameterEntityReference(),
               propName: 'foo',
               secondPropName: 'bar',
               includedBracket: true,
            },
         }),
         extraText: expect.any(Object),
      });
   });

   it('declares the processing done if the bracket was not found, but the source is not consumed', () => {
      const done = jest.fn();
      mockAddProtoReplacementText.mockImplementation((x, y, z, cb) => {
         // eslint-disable-next-line @typescript-eslint/no-explicit-any
         cb({} as any);
      });
      mockResumeParseConditional.mockImplementation((y, z, cb) => {
         cb(
            new ConditionalStartPToken({
               open: toSToken('<!['),
               unexpanded: {
                  peRef: makeParameterEntityReference(),
                  propName: 'foo',
                  secondPropName: 'bar',
               },
            }),
         );
      });

      new ConditionalStartExpander(start, expand, new EntityContextStack(), done);

      expect(done).toHaveBeenCalledWith({
         done: true,
         newStart: new ConditionalStartPToken({
            open: toSToken('<!['),
            unexpanded: {
               peRef: makeParameterEntityReference(),
               propName: 'foo',
               secondPropName: 'bar',
            },
         }),
         extraText: expect.any(Object),
      });
   });

   it('declares the processing not yet done if no brackt was found and the source is empty', () => {
      const done = jest.fn();
      mockAddProtoReplacementText.mockImplementation((x, y, z, cb) => {
         // eslint-disable-next-line @typescript-eslint/no-explicit-any
         cb({} as any);
      });
      const source = new STokenSource();
      source.endText();
      mockEntityValueToSTokenSource.mockReturnValue(source);
      mockResumeParseConditional.mockImplementation((y, z, cb) => {
         cb(
            new ConditionalStartPToken({
               open: toSToken('<!['),
               unexpanded: {
                  peRef: makeParameterEntityReference(),
                  propName: 'foo',
               },
            }),
         );
      });

      const expander = new ConditionalStartExpander(start, expand, new EntityContextStack(), done);

      expect(done).toHaveBeenCalledWith({
         done: false,
         hack: expander,
      });
   });

   it('finish() forces a done: true situation', () => {
      const done = jest.fn();
      mockAddProtoReplacementText.mockImplementation((x, y, z, cb) => {
         // eslint-disable-next-line @typescript-eslint/no-explicit-any
         cb({} as any);
      });
      const source = new STokenSource();
      source.endText();
      mockEntityValueToSTokenSource.mockReturnValue(source);
      mockResumeParseConditional.mockImplementation((y, z, cb) => {
         cb(
            new ConditionalStartPToken({
               open: toSToken('<!['),
               unexpanded: {
                  peRef: makeParameterEntityReference(),
                  propName: 'foo',
               },
            }),
         );
      });
      const expander = new ConditionalStartExpander(start, expand, new EntityContextStack(), done);

      expander.finish();

      expect(done).toHaveBeenCalledWith({
         done: true,
         newStart: expect.any(ConditionalStartPToken),
         extraText: expect.any(Object),
      });
   });

   it('expandPToken() will result in a done situation', () => {
      const done = jest.fn();
      mockAddProtoReplacementText.mockImplementation((x, y, z, cb) => {
         // eslint-disable-next-line @typescript-eslint/no-explicit-any
         cb({} as any);
      });
      const source = new STokenSource();
      source.endText();
      mockEntityValueToSTokenSource.mockReturnValue(source);
      mockResumeParseConditional.mockImplementation((y, z, cb) => {
         cb(
            new ConditionalStartPToken({
               open: toSToken('<!['),
               unexpanded: {
                  peRef: makeParameterEntityReference(),
                  propName: 'foo',
               },
            }),
         );
      });
      const expander = new ConditionalStartExpander(start, expand, new EntityContextStack(), done);

      expander.expandPToken(new TextPToken(toSToken('foo')), () => {});

      expect(done).toHaveBeenCalledWith({
         done: true,
         newStart: expect.any(ConditionalStartPToken),
         extraText: expect.any(Object),
      });
   });

   it('expandPToken() calls back expand parameter', () => {
      const expanded = jest.fn();
      mockAddProtoReplacementText.mockImplementation((x, y, z, cb) => {
         // eslint-disable-next-line @typescript-eslint/no-explicit-any
         cb({} as any);
      });
      const source = new STokenSource();
      source.endText();
      mockEntityValueToSTokenSource.mockReturnValue(source);
      mockResumeParseConditional.mockImplementation((y, z, cb) => {
         cb(
            new ConditionalStartPToken({
               open: toSToken('<!['),
               unexpanded: {
                  peRef: makeParameterEntityReference(),
                  propName: 'foo',
               },
            }),
         );
      });
      const expander = new ConditionalStartExpander(
         start,
         expand,
         new EntityContextStack(),
         () => {},
      );

      expander.expandPToken(new TextPToken(toSToken('foo')), expanded);

      expect(expanded).toHaveBeenCalled();
   });
});
