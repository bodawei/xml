/* Copyright ® 2020 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from 'basic';
import { retrieveMissingEntities, ExpandUnassignedProps } from '../retrieveMissingEntities';
import { ParameterEntityDeclarationPToken, TextPToken, EntityValuePToken } from 'token';
import { SToken, STokenSource } from 'sToken';

describe('retrieveMissingEntities() (unit)', () => {
   let params: ExpandUnassignedProps;

   beforeEach(() => {
      params = {
         paramEntitiesByName: {
            one: {
               isInternal: false,
               token: new ParameterEntityDeclarationPToken({ open: SToken.fromString('<!'), }),
            },
         },
         retrieveExternalEntity: (externalId: any, emd: EntityMetaData) => { return {} as any },
         processForEntityValue: (sTokenSource: STokenSource, done: (results: EntityValuePToken) => void) => {},
         emd: new EntityMetaData(),
      };
   });

   it('does not change the param entity set if no names are passed in', (done) => {
      retrieveMissingEntities([], params, () => {
         expect(params.paramEntitiesByName).toEqual({
            one: {
               isInternal: false,
               token: new ParameterEntityDeclarationPToken({ open: SToken.fromString('<!'), }),
            },
         });
         done();
      });
   });

   it('does not change the param entity set if the name passed is already present', (done) => {
      params.paramEntitiesByName.one.valueCache = [ new TextPToken({ text: SToken.fromString('whee') }) ];

      retrieveMissingEntities(['one'], params, () => {
         expect(params.paramEntitiesByName).toEqual({
            one: {
               isInternal: false,
               token: new ParameterEntityDeclarationPToken({ open: SToken.fromString('<!'), }),
               valueCache: [ new TextPToken({ text: SToken.fromString('whee') }) ]
            },
         });
         done();
      });
   });

});
