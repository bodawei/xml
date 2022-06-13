/* Copyright ® 2018-2021 by 柏大衛. All rights reserved. */

import { doAsyncWhileLoop } from 'basic';
import { SToken, STokenSource, combineSTokens } from 'basic';

type DeliverContentModel = (pToken?: ContentModelP) => void;

type DelimitedParticleProps = Array<ContentDelimitedParticleProps>;
type DelimitedParticleP = Array<ContentDelimitedParticleP>;

interface ContentModelProps {
   open?: SToken;
   openSpace?: SToken;
   delimitedParticles?: DelimitedParticleProps;
   close?: SToken;
   closeSpace?: SToken;
   repeat?: SToken;
   repeatSpace?: SToken;
}

interface ContentNameProps {
   name?: SToken;
   nameSpace?: SToken;
   repeat?: SToken;
   repeatSpace?: SToken;
}

type NameOrModelProps = ContentModelProps | ContentNameProps;

interface ContentDelimitedParticleProps {
   particle?: ContentNameProps | ContentModelProps;
   delimiter?: SToken;
   delimiterSpace?: SToken;
}

interface ContentDelimitedParticleP {
   readonly particle?: ContentNameP | ContentModelP;
   readonly delimiter?: SToken;
   readonly delimiterSpace?: SToken;
}

type ContentNameP = Readonly<ContentNameProps>;

class ContentModelP {
   public readonly open?: SToken;

   public readonly openSpace?: SToken;

   public readonly delimitedParticles: DelimitedParticleP;

   public readonly close?: SToken;

   public readonly closeSpace?: SToken;

   public readonly repeat?: SToken;

   public readonly repeatSpace?: SToken;

   constructor(props: ContentModelP | ContentModelProps = {}, other?: ContentModelProps) {
      this.open = props.open;
      this.openSpace = props.openSpace;
      this.delimitedParticles = props.delimitedParticles || [];
      this.close = props.close;
      this.closeSpace = props.closeSpace;
      this.repeat = props.repeat;
      this.repeatSpace = props.repeatSpace;

      if (other) {
         this.open = 'open' in other ? other.open : this.open;
         this.openSpace = 'openSpace' in other ? other.openSpace : this.openSpace;
         this.delimitedParticles =
            'delimitedParticles' in other
               ? other.delimitedParticles || []
               : this.delimitedParticles;
         this.close = 'close' in other ? other.close : this.close;
         this.closeSpace = 'closeSpace' in other ? other.closeSpace : this.closeSpace;
         this.repeat = 'repeat' in other ? other.repeat : this.repeat;
         this.repeatSpace = 'repeatSpace' in other ? other.repeatSpace : this.repeatSpace;
      }
   }
}

function isContentModelP(item: ContentModelP | ContentNameP): item is ContentModelP {
   if ('name' in item || 'nameSpace' in item) {
      return false;
   }

   return (
      'open' in item ||
      'openSpace' in item ||
      'delimitedParticles' in item ||
      'close' in item ||
      'closeSpace' in item
   );
}

function isContentModelProps(
   item: ContentModelProps | ContentNameProps,
): item is ContentModelProps {
   return isContentModelP(item);
}

function parseRepeat(
   source: STokenSource,
   base: NameOrModelProps,
   deliver: (result: NameOrModelProps) => void,
) {
   source.extractToObject('multi', ['?', '*', '+'], base, 'repeat');
   source.extractNoParams('space', (repeatSpace) => {
      base.repeatSpace = repeatSpace;

      deliver(base);
   });
}

function parseName(
   source: STokenSource,
   inResume: boolean,
   deliverName: (name: ContentNameProps) => void,
) {
   const name: ContentNameProps = {};
   const wordDelims = [')', '>', '?', '*', '+', '(', ',', '|'];

   if (!inResume) {
      wordDelims.unshift('%');
   }

   source.extractToObject('word', wordDelims, name, 'name');
   source.extractToObjectNoParams('space', name, 'nameSpace');
   parseRepeat(source, name, (withRepeat) => {
      deliverName(withRepeat);
   });
}

function parseDelimiter(
   source: STokenSource,
   delimitedParticle: ContentDelimitedParticleProps,
   deliverDelimited: (result: ContentDelimitedParticleProps) => void,
): void {
   source.extractToObject('multi', ['|', ','], delimitedParticle, 'delimiter');
   source.extractNoParams('space', (delimiterSpace) => {
      delimitedParticle.delimiterSpace = delimiterSpace;

      deliverDelimited(delimitedParticle);
   });
}

function parseDelimitedParticle(
   source: STokenSource,
   inResume: boolean,
   deliverDelimited: (result: ContentDelimitedParticleProps | undefined) => void,
): void {
   source.extractNoParams('peekChar', (charSToken) => {
      if (
         !charSToken ||
         charSToken.str === '>' ||
         charSToken.str === ')' ||
         (!inResume && charSToken.str === '%')
      ) {
         deliverDelimited(undefined);
         return;
      }

      const delimitedParticle: ContentDelimitedParticleProps = {};

      if (charSToken.str === '(') {
         // eslint-disable-next-line @typescript-eslint/no-use-before-define
         parseContentModel(source, (model) => {
            delimitedParticle.particle = model;
            parseDelimiter(source, delimitedParticle, deliverDelimited);
         });
      } else {
         parseName(source, inResume, (name) => {
            delimitedParticle.particle = name;
            parseDelimiter(source, delimitedParticle, deliverDelimited);
         });
      }
   });
}

function parseDelimitedParticles(
   source: STokenSource,
   inResume: boolean,
   deliverDelimiteds: (result: DelimitedParticleProps) => void,
): void {
   doAsyncWhileLoop<ContentDelimitedParticleProps>((deliverResult) => {
      parseDelimitedParticle(source, inResume, (newDelimited) => {
         if (!newDelimited) {
            deliverResult(undefined);
            return;
         }

         deliverResult(newDelimited);
      });
   }, deliverDelimiteds);
}

function parseContentModelClose(
   source: STokenSource,
   props: ContentModelProps,
   deliverDelimiteds: DeliverContentModel,
): void {
   source.extractToObject('match', ')', props, 'close');
   source.extractToObjectNoParams('space', props, 'closeSpace');
   parseRepeat(source, props, (withRepeat) => {
      deliverDelimiteds(new ContentModelP(withRepeat));
   });
}

/**********************************************************************\
 parseContentModel() extracts the STokens for a () enclosed series of word.
 This is used in the various syntax constructions listed below.
 It will stop any time it encounters a % character.

 PARAM
   source: An STokenSource to read from
   deliverDelimiteds: Callback to deliver the PTokens

 SYNTAX
   §3.2.1
   [47] children       ::= (choice | seq) ('?' | '*' | '+')?
   [48] cp             ::= (Name | choice | seq) ('?' | '*' | '+')?
   [49] choice         ::= '(' S? cp ( S? '|' S? cp )+ S? ')'
   [50] seq            ::= '(' S? cp ( S? ',' S? cp )* S? ')'
   §3.2.2
   [51] Mixed          ::= '(' S? '#PCDATA' (S? '|' S? Name)* S? ')*'
                           | '(' S? '#PCDATA' S? ')'
\**********************************************************************/

function parseContentModel(source: STokenSource, deliverDelimiteds: DeliverContentModel): void {
   const props: ContentModelProps = {};

   source.extract('match', '(', (charSToken) => {
      if (!charSToken) {
         deliverDelimiteds();
         return;
      }

      props.open = charSToken;
      source.extractToObjectNoParams('space', props, 'openSpace');

      parseDelimitedParticles(source, false, (delimiteds) => {
         parseContentModelClose(
            source,
            { ...props, delimitedParticles: delimiteds },
            deliverDelimiteds,
         );
      });
   });
}

function hasSomeClose(cm: ContentModelProps): boolean {
   return !!(cm.close || cm.closeSpace || cm.repeat || cm.repeatSpace);
}

function isIncompleteParticle(item: ContentDelimitedParticleProps): boolean {
   if (item.delimiter || item.delimiterSpace) {
      return false;
   } else {
      const { particle } = item;

      // this can't, in practice, happen
      if (!particle) {
         return true;
      }

      if (isContentModelProps(particle)) {
         return !particle.close || !particle.repeat || !particle.open;
      } else {
         return !particle.name || !particle.repeat;
      }
   }
}

function resumeParseName(
   source: STokenSource,
   partial: ContentNameProps,
   preSpace: SToken | undefined,
   deliverName: (result: ContentNameProps | undefined) => void,
): void {
   // We will only get here if we have an incomplete name
   partial.nameSpace = combineSTokens(partial.nameSpace, preSpace);
   parseRepeat(source, partial, (withRepeat) => {
      deliverName(withRepeat);
   });
}

function resumeParseDelimitedParticle(
   source: STokenSource,
   dp: ContentDelimitedParticleProps,
   preSpace: SToken | undefined,
   deliver: (item: ContentDelimitedParticleProps | undefined) => void,
) {
   // We will only get here with an incomplete token
   const { particle } = dp;

   if (!particle || Object.keys(particle).length === 0) {
      parseDelimitedParticle(source, true, (delimited) => {
         deliver(delimited);
      });
   } else if (isContentModelP(particle)) {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      resumeParseContentModel(source, particle, preSpace, (cm) => {
         parseDelimiter(source, { particle: cm }, (delimited) => {
            deliver(delimited);
         });
      });
   } else {
      resumeParseName(source, particle, preSpace, (name) => {
         parseDelimiter(source, { particle: name }, (delimited) => {
            deliver(delimited);
         });
      });
   }
}

function resumeParseContentModelP(
   source: STokenSource,
   partial: ContentModelProps,
   preSpace: SToken | undefined,
   deliverDelimiteds: DeliverContentModel,
) {
   const delParticles = partial.delimitedParticles ? [...partial.delimitedParticles] : [];

   if (hasSomeClose(partial)) {
      if (partial.repeat) {
         partial.repeatSpace = combineSTokens(partial.repeatSpace, preSpace);
         deliverDelimiteds(new ContentModelP(partial));
      } else {
         partial.closeSpace = combineSTokens(partial.closeSpace, preSpace);
         parseRepeat(source, partial, (withRepeat) => {
            deliverDelimiteds(new ContentModelP(withRepeat));
         });
      }
   } else if (delParticles.length === 0) {
      // Theoretically we could get here with no open or openSpace. But our parser won't generate a token in that configuration
      partial.openSpace = combineSTokens(partial.openSpace, preSpace);
      partial.delimitedParticles = delParticles;
      parseDelimitedParticles(source, true, (withNames) => {
         partial.delimitedParticles = withNames;
         parseContentModelClose(source, partial, deliverDelimiteds);
      });
   } else {
      const last = delParticles[delParticles.length - 1];

      if (isIncompleteParticle(last)) {
         resumeParseDelimitedParticle(source, last, preSpace, (particle) => {
            if (!particle) {
               partial.openSpace = combineSTokens(partial.openSpace, preSpace);

               parseContentModelClose(source, partial, deliverDelimiteds);
               return;
            }

            parseDelimitedParticles(source, true, (remainingParticles) => {
               const butLast = [...delParticles];
               butLast.pop();

               partial.delimitedParticles = [...butLast, particle, ...remainingParticles];
               parseContentModelClose(source, partial, deliverDelimiteds);
            });
         });
      } else {
         last.delimiterSpace = combineSTokens(last.delimiterSpace, preSpace);

         parseDelimitedParticles(source, true, (withNames) => {
            partial.delimitedParticles = [...delParticles, ...withNames];
            parseContentModelClose(source, partial, deliverDelimiteds);
         });
      }
   }
}

function resumeParseContentModel(
   source: STokenSource,
   partial: ContentModelP,
   preSpace: SToken | undefined,
   deliverDelimiteds: DeliverContentModel,
): void {
   resumeParseContentModelP(source, { ...partial }, preSpace, deliverDelimiteds);
}

export { ContentModelP, ContentNameP, isContentModelP, parseContentModel, resumeParseContentModel };
