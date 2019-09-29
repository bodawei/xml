/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */

import { EntityMetaData } from 'basic';
import { ErrorCollector, WellFormedError } from 'error';
import { strOrBlank, SToken, STokenSource, STokenArrayBuilder } from 'sToken';

import { SectionStart } from './bridge/section';
import misc from './common/misc';

const CONDITIONAL_PTOKEN = 'CONDITIONAL_PTOKEN';
const CONDITIONAL_XTOKEN = 'CONDITIONAL_XTOKEN';
const WFEID = WellFormedError.ID;

type DeliverPToken = (pToken: ConditionalPToken) => void;

/**********************************************************************\
 The cdata namespace contains the usual tools for processing
 a Conditional Section element
\**********************************************************************/

class ConditionalXToken {
   public readonly type: typeof CONDITIONAL_XTOKEN = CONDITIONAL_XTOKEN;
   public readonly pToken?: ConditionalPToken;

   constructor(pToken?: ConditionalPToken) {
      this.pToken = pToken;
   }
}

class ConditionalPToken {
   public readonly type: typeof CONDITIONAL_PTOKEN = CONDITIONAL_PTOKEN;
   public readonly open: SToken;
   public readonly openSpace?: SToken;
   public readonly sectionType?: SToken;
   public readonly sectionTypeSpace?: SToken;
   public readonly bracket?: SToken;
   public readonly ignored?: ReadonlyArray<SToken>;
   public readonly close?: SToken;
   public readonly incomplete: boolean

   constructor(param: ConditionalPToken | SectionStart) {
      Object.assign(this, param);
      this.open = param.open;
      this.incomplete = 'incomplete' in param && param.incomplete === true;
   }

   checkWellFormed(ec: ErrorCollector, entityMetaData: EntityMetaData): void {
      checkWellFormed(this, ec, entityMetaData);
   }

   toXToken(): ConditionalXToken {
      return pTokenToXToken(this);
   }

   // toSTokenArray(): Array<SToken> {
   //    return sTokensFromPToken(this);
   // }
}

/**********************************************************************\
 parseConditionalSection() extracts a conditional section.

 PARAM
 source: An STokenSource to read from
 sectionStart: The parsing up to and including the 'CDATA'
 deliverPToken: Callback to deliver the PToken

 SYNTAX
   @@@@
\**********************************************************************/

function parseConditional(source: STokenSource, sectionStart: SectionStart, deliverPToken: DeliverPToken) {
   const props: any = Object.assign({ ignored: [] }, sectionStart);

   source.extract('match', '[', (sToken) => {
      props.bracket = sToken;

      if (!sectionStart.sectionType || sectionStart.sectionType.str.toLowerCase() === 'ignore') {
         // Loop to gather all the strings of the ignored value
         doLoop(processExcludeChunk, { source, props, depth: 0 }, (props: any) => {
            source.extract('match', ']]>', (sToken) => {
               props.close = sToken;
               deliverPToken(new ConditionalPToken(props));
            });
         })
      } else {
         props.incomplete = true;
         deliverPToken(new ConditionalPToken(props));
      }
   });
}


/*
 * Extract a string or a pair of strings from the source. These strings are:
 *    - a string that doesn't include <![ or ]]>
 *    - A string that is <![ or ]]> (the latter iff there was a previous matching <![)
 */
function processExcludeChunk(context: { source: STokenSource, props: any, depth: number }, next: any) {
   let { source, props, depth } = context;

   source.extract('all', [ '<![', ']]>' ], (result) => {
      if (result) {
         props.ignored.push(result);
      }

      source.extractNoParams('peekChar', (nextChar) => {
         if (!nextChar) {
            next(context, props);
         } else if (nextChar.str[0] === '<') {
            source.extract('match', '<![', (ignoredOpening) => {
               props.ignored.push(ignoredOpening);
               next({ source, props, depth: depth + 1 });
            });
         } else if (depth !== 0) {
            source.extract('match', ']]>', (ignoredOpening) => {
               props.ignored.push(ignoredOpening);
               next({ source, props, depth: depth - 1 });
            });
         } else {
            next(context, props);
         }
      });
   });
}

// A possibly generic function that will loop over another function.
// The provided function must take a context, and a function that takes a content and an optional result. The loop stops when there is a result, which is delivered on to the caller
function doLoop<Result, Context>(func: (data: Context, func: (context: Context, result?: Result) => void) => void, context: any, deliver: (result: Result) => void) {
   function handleIt(context: Context, result?: Result) {
      if (result) {
         deliver(result);
      } else {
         func(context, handleIt)
      }
   };

   func(context, handleIt);
}

/**********************************************************************\
 checkWellFormed()
\**********************************************************************/

function checkWellFormed(pToken: ConditionalPToken | void, ec: ErrorCollector, entityMetaData: EntityMetaData) {
   if (!pToken) {
      return;
   }

   const SECTION_TYPES = [ 'INCLUDE', 'IGNORE' ];

   const sectionType = strOrBlank(pToken.sectionType);
   const ucSectionType = sectionType.toUpperCase();
   const knownSectionType = SECTION_TYPES.indexOf(ucSectionType) !== -1;

   ec.setPos(pToken.sectionType);
   ec.check(!knownSectionType, WFEID.CONDITIONAL_UNKNOWN, [ sectionType ]);

   if (knownSectionType) {
      ec.check(sectionType !== ucSectionType, WFEID.CONDITIONAL_INVALID_CASE, [ sectionType, ucSectionType ]);
   }
}


/**********************************************************************\
 pTokenToXToken() converts a PToken into an XToken.
\**********************************************************************/

function pTokenToXToken(pToken: ConditionalPToken) {
   const token = new ConditionalXToken(pToken);

   return token;
}

export {
   CONDITIONAL_PTOKEN,
   CONDITIONAL_XTOKEN,
   ConditionalPToken,
   ConditionalXToken,

   parseConditional,
};
