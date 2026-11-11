/* Copyright ® 2021-2026 by 柏大衛. All rights reserved. */

import { ConformanceVersion, EntityId, Problem } from 'basic';
import { STokenSource, toSToken } from 'basic';
import { ParameterEntityReferencePToken, TextPToken } from 'pToken';
import { ConditionalStartPToken, resumeParseConditional } from 'token';
import { makeParameterEntityDeclaration, makeParameterEntityReference } from 'token-test';
import { describe, expect, it, vi, type MockedFunction } from 'vitest';

import { ExpandParams, RetrieveResults } from '../../types';
import { addProtoReplacementText } from '../addProtoReplacementText';
import { ConditionalStartExpander } from '../ConditionalStartExpander';
import { EntityContextStack } from '../EntityContextStack';
import { EntityDetails } from '../EntityDetails';
import { entityValueToSTokenSource } from '../entityValueToSTokenSource';

vi.mock('../../../token/conditionalStart', async () => {
   const realConditional = (await vi.importActual('../../../token/conditionalStart')) as Record<
      string,
      unknown
   >;
   return {
      ...realConditional,
      resumeParseConditional: vi.fn(),
   };
});
vi.mock('../addProtoReplacementText');
vi.mock('../entityValueToSTokenSource');

describe('ConditionalStartExpander (unit)', () => {
   let expand: ExpandParams;
   let start: ConditionalStartPToken;
   let mockAddProtoReplacementText: MockedFunction<typeof addProtoReplacementText>;
   let mockResumeParseConditional: MockedFunction<typeof resumeParseConditional>;
   let mockEntityValueToSTokenSource: MockedFunction<typeof entityValueToSTokenSource>;

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
                  getErrors: (): Array<Problem> => [],
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

      mockAddProtoReplacementText = addProtoReplacementText as MockedFunction<
         typeof addProtoReplacementText
      >;
      mockResumeParseConditional = resumeParseConditional as MockedFunction<
         typeof resumeParseConditional
      >;
      mockEntityValueToSTokenSource = entityValueToSTokenSource as MockedFunction<
         typeof entityValueToSTokenSource
      >;

      const source = new STokenSource();
      source.addText('foo');
      source.endText();
      mockEntityValueToSTokenSource.mockReturnValue(source);
   });

   it('immediately declares itself as done when called with a conditional start without an unexpanded', () => {
      const done = vi.fn();
      const start = new ConditionalStartPToken({
         open: toSToken('<!['),
      });

      new ConditionalStartExpander(start, expand, new EntityContextStack(), done);

      expect(done).toHaveBeenCalledWith({
         done: true,
         newStart: start,
         extraText: expect.any(STokenSource) as never,
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
      const done = vi.fn();
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
         extraText: expect.any(Object) as never,
      });
   });

   it('declares the processing done if the resume parse found a bracket (and the source is consumed)', () => {
      const done = vi.fn();
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
         extraText: expect.any(Object) as never,
      });
   });

   it('declares the processing done if the bracket was not found, but the source is not consumed', () => {
      const done = vi.fn();
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
         extraText: expect.any(Object) as never,
      });
   });

   it('declares the processing not yet done if no brackt was found and the source is empty', () => {
      const done = vi.fn();
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
      const done = vi.fn();
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
         newStart: expect.any(ConditionalStartPToken) as never,
         extraText: expect.any(Object) as never,
      });
   });

   it('expandPToken() will result in a done situation', () => {
      const done = vi.fn();
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
         newStart: expect.any(ConditionalStartPToken) as never,
         extraText: expect.any(Object) as never,
      });
   });

   it('expandPToken() calls back expand parameter', () => {
      const expanded = vi.fn();
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
