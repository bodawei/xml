/* Copyright ® 2016-2021 by 柏大衛. All rights reserved. */

import { ConformanceVersion, Collector } from 'basic';
import { SToken } from 'basic';
import { Warning } from '../error/warning';

/**********************************************************************\
 nameXmlCheck() does a check whether a name starts
 with "xml", and if that is or is not acceptable based on the entity
 version.
\**********************************************************************/

function nameXmlCheck(
   nameSToken: SToken | undefined,
   collector: Collector,
   confVer: ConformanceVersion,
   nameType: string,
   v1R6Warning: string,
   otherWarning: string,
): void {
   if (!nameSToken) {
      return;
   }

   const isV1R6 = confVer.version === 1.0 && confVer.edition === 6;
   const name = nameSToken.str;
   const lcName = nameSToken.str.toLowerCase();

   /*
    * §2.10 and §2.12
    * xml:lang and xml:space are both allowable attributes
    */

   if (nameType === 'ATTRIBUTE' && (lcName === 'xml:space' || lcName === 'xml:lang')) {
      if (lcName === name) {
         return;
      }
   }

   /*
    * §2.3.0 (all versions except 1.0/6)
    * Names beginning with the string "xml", or any string which would match
    * (('X'|'x') ('M'|'m') ('L'|'l')), are reserved for standardization in this
    * or future versions of this specification.
    *
    * Version: 1.0/6
    * Deletes all that.
    *
    * §2.6: (all versions except 1.0/6)
    * [17] PITarget ::= Name - (('X' | 'x') ('M' | 'm') ('L' | 'l'))
    *
    * Version: 1.0/6
    * Target names that begin "xml-" are reserved for standardization in this
    * or future specifications from the XML Core Working Group or its
    * successors. The target name "xml" is forbidden as it introduces the
    * XML declaration.
    *
    * §3.0.0 (ELEMENT names)
    *    Most versions:
    *       ...names of the element types and attributes, ...except that names
    *       beginning with a match to (('X'|'x')('M'|'m')('L'|'l')) are
    *       reserved for standardization in this or future versions of this
    *       specification.
    *    Version: 1.0/6
    *       ...except that names beginning with "xml:" are reserved for standardization
    *       in this or future specifications from the XML Core Working Group or its successors.
    *
    * Interpretation:
    *    In all but 1.0/6, /^[Xx][Mm][Ll]/ is reserved, but not an error
    *       3.0.0 is simply repeating what was already stated in 2.3
    *    In all, PI Targets must not contain [Xx][Mm][Ll] anywhere in their name
    *       This is a WFC error if they do.
    *    In 1.0/6 All names can have xml etc in them (this really just means entity and
    *       notation names), except:
    *          - element and attribute names may not have /^xml:/ but may have other case variations
    *          - target names also reserve xml- (even though syntactially not allowed)
    */
   if (isV1R6) {
      let isProblematic;

      switch (nameType) {
         case 'PI':
            isProblematic = name.startsWith('xml-');
            break;
         case 'ELEMENT':
         case 'ATTRIBUTE':
            isProblematic = name.startsWith('xml:');
            break;
         default:
            break;
      }

      if (isProblematic) {
         collector.reportProblem(Warning, v1R6Warning, [name]);
      }
   } else if (name.substring(0, 3).toLowerCase() === 'xml') {
      collector.reportProblem(Warning, otherWarning, [name]);
   }
}

export { nameXmlCheck };
