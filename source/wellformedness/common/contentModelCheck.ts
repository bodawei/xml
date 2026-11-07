/* Copyright ® 2018-2026 by 柏大衛. All rights reserved. */

import { Collector, ConformanceVersion } from 'basic';
import { ContentModelP, isContentModelP } from 'pToken';
import { strOrBlank } from 'basic';

import { wellFormedErrorCodes } from '../error/wellFormedError';

import { nameCheck } from './nameCheck';

const WFEID = wellFormedErrorCodes.id;
const PCDATA = '#PCDATA';

type DelimiterType = 'ANY' | 'CHOICE' | 'SEQUENCE';

function contentModelCheck(
   cmToken: ContentModelP,
   collector: Collector,
   confVer: ConformanceVersion,
   isTopLevel: boolean,
): void {
   let delimType: DelimiterType | undefined;
   let isMixedType = false;

   collector.setPos(cmToken.open);
   collector.check(!cmToken.open, WFEID.CONTENTMODEL_NO_OPEN);

   collector.setPos(cmToken.openSpace);

   if (cmToken.delimitedParticles.length <= 0) {
      collector.setPos(undefined);
      collector.report(WFEID.CONTENTMODEL_NO_NAMES);
   }

   for (let index = 0; index < cmToken.delimitedParticles.length; index++) {
      const isLast = index === cmToken.delimitedParticles.length - 1;
      const particle = cmToken.delimitedParticles[index];
      const indexStr = index.toString();

      if (particle.particle) {
         const theParticle = particle.particle;

         if (isContentModelP(theParticle)) {
            collector.setPos(theParticle.open);

            if (isMixedType) {
               collector.report(WFEID.CONTENTMODEL_MIXED_INVALID_SUBPARTICLE, [indexStr]);
            }

            contentModelCheck(theParticle, collector, confVer, false);
         } else {
            collector.setPos(theParticle.name);
            collector.check(!theParticle.name, WFEID.CONTENTMODEL_NO_NAME, [indexStr]);

            const nameStr = strOrBlank(theParticle.name);
            const ucName = nameStr.toUpperCase();

            if (index === 0 && !isMixedType && ucName === PCDATA && isTopLevel) {
               collector.check(ucName !== nameStr, WFEID.CONTENTMODEL_PCDATA_INVALID_CASE, [
                  nameStr,
               ]);
               isMixedType = true;
               delimType = 'CHOICE';
            } else {
               nameCheck(theParticle.name, collector, confVer, WFEID.CONTENTMODEL_NAME_INVALID);
            }

            collector.setPos(theParticle.nameSpace);

            if (theParticle.repeat) {
               collector.check(theParticle.nameSpace, WFEID.CONTENTMODEL_NAME_EXTRA_SPACE, [
                  indexStr,
               ]);

               collector.setPos(theParticle.repeat);

               if (isMixedType) {
                  collector.report(WFEID.CONTENTMODEL_MIXED_NAME_EXTRA_REPEAT, [
                     indexStr,
                     strOrBlank(theParticle.repeat),
                  ]);
               }
               collector.setPos(theParticle.repeatSpace);
            }
         }
      }

      collector.setPos(particle.delimiter);

      if (particle.delimiter) {
         const delimiterStr = strOrBlank(particle.delimiter);

         delimType ??= delimiterStr === ',' ? 'SEQUENCE' : 'CHOICE';

         if (delimType === 'SEQUENCE') {
            if (delimiterStr !== ',') {
               collector.report(WFEID.CONTENTMODEL_BAD_SEQUENCE, [indexStr, delimiterStr]);
            }
         } else if (delimiterStr !== '|') {
            collector.report(WFEID.CONTENTMODEL_BAD_CHOICE, [indexStr, delimiterStr]);
         }
      }

      if (!isLast) {
         collector.check(!particle.delimiter, WFEID.CONTENTMODEL_NO_DELIM, [indexStr]);
      } else {
         collector.check(particle.delimiter, WFEID.CONTENTMODEL_EXTRA_DELIM, [indexStr]);
      }

      collector.setPos(particle.delimiterSpace);
   }

   collector.setPos(cmToken.close);
   collector.check(!cmToken.close, WFEID.CONTENTMODEL_NO_CLOSE);
   collector.setPos(cmToken.closeSpace);

   if (cmToken.repeat) {
      collector.check(cmToken.closeSpace, WFEID.CONTENTMODEL_CLOSE_EXTRA_SPACE);
   }

   collector.setPos(cmToken.repeat);
   const repeatStr = strOrBlank(cmToken.repeat);

   if (isMixedType) {
      if (cmToken.delimitedParticles.length > 1) {
         collector.check(repeatStr !== '*', WFEID.CONTENTMODEL_MIXED_INVALID_REPEAT, [repeatStr]);
      } else {
         collector.check(
            repeatStr !== '' && repeatStr !== '*',
            WFEID.CONTENTMODEL_MIXED_INVALID_REPEAT,
            [repeatStr],
         );
      }
   }

   collector.setPos(cmToken.repeatSpace);
}

export { contentModelCheck };
