/* Copyright ® 2018-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { ContentModelP } from 'pToken';
import { toSToken } from 'basic';

import { contentModelToSTokens } from '../contentModelToSTokens';

describe('contentModelToSTokens()', () => {
   it('returns all the STokens', () => {
      const emptyCP = {
         particle: {
            open: toSToken('('),
            delimitedParticles: [{}],
            close: toSToken(')'),
         },
      };
      const contentModel = new ContentModelP({
         open: toSToken('('),
         openSpace: toSToken(' '),
         delimitedParticles: [{}, emptyCP],
         close: toSToken(')'),
         closeSpace: toSToken(' '),
         repeat: toSToken('*'),
         repeatSpace: toSToken(' '),
      });

      const nameParticle = {
         particle: {
            name: toSToken('one'),
            nameSpace: toSToken(' '),
            repeat: toSToken('*'),
            repeatSpace: toSToken(' '),
         },
         delimiter: toSToken('|'),
         delimiterSpace: toSToken(' '),
      };
      const contentSpec = new ContentModelP({
         open: toSToken('('),
         openSpace: toSToken(' '),
         delimitedParticles: [
            nameParticle,
            {
               particle: contentModel,
               delimiter: undefined,
               delimiterSpace: undefined,
            },
         ],
         close: toSToken(')'),
         closeSpace: undefined,
         repeat: undefined,
         repeatSpace: undefined,
      });

      const result = contentModelToSTokens(contentSpec);

      expect(result).toEqual([
         contentSpec.open,
         contentSpec.openSpace,
         nameParticle.particle.name,
         nameParticle.particle.nameSpace,
         nameParticle.particle.repeat,
         nameParticle.particle.repeatSpace,
         nameParticle.delimiter,
         nameParticle.delimiterSpace,
         contentModel.open,
         contentModel.openSpace,
         emptyCP.particle.open,
         emptyCP.particle.close,
         contentModel.close,
         contentModel.closeSpace,
         contentModel.repeat,
         contentModel.repeatSpace,
         contentSpec.close,
      ]);
   });
});
