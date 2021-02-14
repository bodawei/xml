/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { ErrorCollector, ConformanceVersion } from 'basic';
import { ContentModelP, isContentModelP } from 'pToken';
import { strOrBlank } from 'sToken';

import { WellFormedError } from '../error/WellFormedError';

import { nameCheck } from '../token/util/nameCheck';

const WFEID = WellFormedError.ID;
const PCDATA = '#PCDATA';

type DelimiterType = 'ANY' | 'CHOICE' | 'SEQUENCE';

function contentModelCheck(
   cmToken: ContentModelP,
   ec: ErrorCollector,
   confVer: ConformanceVersion,
   isTopLevel: boolean,
): void {
   let delimType: DelimiterType | undefined;
   let isMixedType = false;

   ec.setPos(cmToken.open);
   ec.check(!cmToken.open, WFEID.CONTENTMODEL_NO_OPEN);

   ec.setPos(cmToken.openSpace);

   if (cmToken.delimitedParticles.length <= 0) {
      ec.setPos(undefined);
      ec.report(WFEID.CONTENTMODEL_NO_NAMES);
   }

   for (let index = 0; index < cmToken.delimitedParticles.length; index++) {
      const isLast = index === cmToken.delimitedParticles.length - 1;
      const particle = cmToken.delimitedParticles[index];
      const indexStr = index.toString();

      if (particle.particle) {
         const theParticle = particle.particle;

         if (isContentModelP(theParticle)) {
            ec.setPos(theParticle.open);

            if (isMixedType) {
               ec.report(WFEID.CONTENTMODEL_MIXED_INVALID_SUBPARTICLE, [indexStr]);
            }

            contentModelCheck(theParticle, ec, confVer, false);
         } else {
            ec.setPos(theParticle.name);
            ec.check(!theParticle.name, WFEID.CONTENTMODEL_NO_NAME, [indexStr]);

            const nameStr = strOrBlank(theParticle.name);
            const ucName = nameStr.toUpperCase();

            if (index === 0 && !isMixedType && ucName === PCDATA && isTopLevel) {
               ec.check(ucName !== nameStr, WFEID.CONTENTMODEL_PCDATA_INVALID_CASE, [nameStr]);
               isMixedType = true;
               delimType = 'CHOICE';
            } else {
               nameCheck(theParticle.name, ec, confVer, WFEID.CONTENTMODEL_NAME_INVALID);
            }

            ec.setPos(theParticle.nameSpace);

            if (theParticle.repeat) {
               ec.check(theParticle.nameSpace, WFEID.CONTENTMODEL_NAME_EXTRA_SPACE, [indexStr]);

               ec.setPos(theParticle.repeat);

               if (isMixedType) {
                  ec.report(WFEID.CONTENTMODEL_MIXED_NAME_EXTRA_REPEAT, [
                     indexStr,
                     strOrBlank(theParticle.repeat),
                  ]);
               }
               ec.setPos(theParticle.repeatSpace);
            }
         }
      }

      ec.setPos(particle.delimiter);

      if (particle.delimiter) {
         const delimiterStr = strOrBlank(particle.delimiter);

         if (!delimType) {
            delimType = delimiterStr === ',' ? 'SEQUENCE' : 'CHOICE';
         }

         if (delimType === 'SEQUENCE') {
            if (delimiterStr !== ',') {
               ec.report(WFEID.CONTENTMODEL_BAD_SEQUENCE, [indexStr, delimiterStr]);
            }
         } else if (delimiterStr !== '|') {
            ec.report(WFEID.CONTENTMODEL_BAD_CHOICE, [indexStr, delimiterStr]);
         }
      }

      if (!isLast) {
         ec.check(!particle.delimiter, WFEID.CONTENTMODEL_NO_DELIM, [indexStr]);
      } else {
         ec.check(particle.delimiter, WFEID.CONTENTMODEL_EXTRA_DELIM, [indexStr]);
      }

      ec.setPos(particle.delimiterSpace);
   }

   ec.setPos(cmToken.close);
   ec.check(!cmToken.close, WFEID.CONTENTMODEL_NO_CLOSE);
   ec.setPos(cmToken.closeSpace);

   if (cmToken.repeat) {
      ec.check(cmToken.closeSpace, WFEID.CONTENTMODEL_CLOSE_EXTRA_SPACE);
   }

   ec.setPos(cmToken.repeat);
   const repeatStr = strOrBlank(cmToken.repeat);
   if (isMixedType && cmToken.delimitedParticles.length > 1 && repeatStr !== '*') {
      ec.report(WFEID.CONTENTMODEL_MIXED_INVALID_REPEAT, [repeatStr]);
   }
   ec.setPos(cmToken.repeatSpace);
}

export { contentModelCheck };
