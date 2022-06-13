/* Copyright ® 2016-2020 by 柏大衛. All rights reserved. */

import { combineSTokens, SToken, STokenSource, strOrBlank } from 'basic';
import literal from '../../token/common/literal';
import { DeclarationStart } from '../../token/bridge/declaration';
import { parseExternalId } from '../common/externalId';
import { ParameterEntityReferencePToken } from '../token/parameterEntityReference';

import { parseUnexpanded, parseUnexpandedAfterPeRef } from '../common/parseUnexpanded';
import {
   GeneralEntityDeclarationProps,
   GeneralEntityDeclarationPToken,
} from '../token/generalEntityDeclaration';
import {
   ParameterEntityDeclarationProps,
   ParameterEntityDeclarationPToken,
} from '../token/parameterEntityDeclaration';
import { EntityValuePToken } from 'token';

type AnyEntityDeclaration = GeneralEntityDeclarationProps & ParameterEntityDeclarationProps;

function parseParameter(
   source: STokenSource,
   props: AnyEntityDeclaration, // may mutate
   done: (result: AnyEntityDeclaration) => void,
): void {
   source.extractToObject('match', '%', props, 'parameter');
   source.extractNoParams('space', (parameterSpace) => {
      props.parameterSpace = parameterSpace;
      done(props);
   });
}

function parseName(
   source: STokenSource,
   props: AnyEntityDeclaration, // may mutate
   done: (result: AnyEntityDeclaration) => void,
): void {
   source.extractToObject('word', ['>', '"', "'", ';'], props, 'name');
   source.extractNoParams('space', (nameSpace) => {
      props.nameSpace = nameSpace;
      done(props);
   });
}

function parseLiteralValue(
   source: STokenSource,
   props: AnyEntityDeclaration,
   done: (result: AnyEntityDeclaration) => void,
) {
   // §4.5 defines that we should be parsing charRefs and pe refs here

   literal.parse(
      source,
      {
         pToken: props,
         peRef: true,
         charRef: true,
      },
      (appendedPToken) => {
         if (appendedPToken) {
            source.extractNoParams('space', (sToken) => {
               appendedPToken.valueSpace = sToken;
               done(appendedPToken as any); // typehack
            });
         } else {
            done(props);
         }
      },
   );
}

function parseNData(
   source: STokenSource,
   props: AnyEntityDeclaration,
   done: (result: AnyEntityDeclaration) => void,
) {
   source.extract('peekWord', ['>'], (sToken) => {
      if (strOrBlank(sToken).toLocaleUpperCase() === 'NDATA') {
         source.extractToObject('word', ['>'], props, 'nData');
         source.extractNoParams('space', (sToken) => {
            props.nDataSpace = sToken;
            done(props);
         });
      } else {
         done(props);
      }
   });
}

function parseNDataName(
   source: STokenSource,
   props: AnyEntityDeclaration,
   done: (result: AnyEntityDeclaration) => void,
) {
   source.extractToObject('word', ['>'], props, 'nDataName');
   source.extractNoParams('space', (sToken) => {
      props.nDataNameSpace = sToken;
      done(props);
   });
}

function parseClose(
   source: STokenSource,
   declarationStart: DeclarationStart,
   props: AnyEntityDeclaration, // may mutate
   deliverPToken: (
      result: GeneralEntityDeclarationPToken | ParameterEntityDeclarationPToken,
   ) => void,
) {
   source.extract('match', '>', (sToken) => {
      props.close = sToken;

      const deliveredPToken = !props.parameter
         ? new GeneralEntityDeclarationPToken(declarationStart, props)
         : new ParameterEntityDeclarationPToken(declarationStart, props);

      deliverPToken(deliveredPToken);
   });
}

function parsePeRefThenClose(
   source: STokenSource,
   declarationStart: DeclarationStart,
   props: AnyEntityDeclaration, // may mutate
   deliverPToken: (
      result: GeneralEntityDeclarationPToken | ParameterEntityDeclarationPToken,
   ) => void,
) {
   parseUnexpanded(source, 'trailing', (unexp) => {
      if (unexp) {
         props.unexpanded = unexp;
      }
      parseClose(source, declarationStart, props, deliverPToken);
   });
}

function parseValue(
   source: STokenSource,
   declarationStart: DeclarationStart,
   props: AnyEntityDeclaration, // may mutate
   isGeDecl: boolean,
   done: (pToken: GeneralEntityDeclarationPToken | ParameterEntityDeclarationPToken) => void,
): void {
   parseUnexpanded(source, 'externalIdOrValue', (unexp1) => {
      if (unexp1) {
         props.unexpanded = unexp1;
         parseClose(source, declarationStart, props, done);
         return;
      }

      parseExternalId(source, ['>'], (parsedExtId) => {
         if (!parsedExtId) {
            parseLiteralValue(source, props, (withLiteralValue) => {
               parsePeRefThenClose(source, declarationStart, withLiteralValue, done);
            });
            return;
         }

         props.externalId = parsedExtId.externalId;

         if (parsedExtId.nextPropName) {
            parseUnexpanded(source, parsedExtId.nextPropName, (unexp2) => {
               props.unexpanded = unexp2;
               parseClose(source, declarationStart, props, done);
            });
            return;
         }

         source.extractNoParams('space', (externalIdSpace) => {
            props.externalIdSpace = externalIdSpace;

            if (!isGeDecl) {
               parsePeRefThenClose(source, declarationStart, props, done);
               return;
            }

            parseUnexpanded(source, 'nData', (unexp3) => {
               if (unexp3) {
                  props.unexpanded = unexp3;
                  parseClose(source, declarationStart, props, done);
                  return;
               }

               parseNData(source, props, (withNData) => {
                  if (!withNData.nData) {
                     parseClose(source, declarationStart, withNData, done);
                     return;
                  }

                  parseUnexpanded(source, 'nDataName', (unexp4) => {
                     if (unexp4) {
                        props.unexpanded = unexp4;
                        parseClose(source, declarationStart, props, done);
                        return;
                     }

                     parseNDataName(source, props, (withName) => {
                        parsePeRefThenClose(source, declarationStart, withName, done);
                     });
                  });
               });
            });
         });
      });
   });
}

/**********************************************************************\
 parse() extracts extracts the STokens that make up a general or
 parameteter entity declaration.

 As is common with all declaration things, the STokens for the
 "<!DOCTYPE S" part are passed in as the second argument.

 PARAM
   source: An STokenSource to read from
   declarationPToken: A map with the sTokens from parsing "<!DOCTYPE S"
   deliverPToken: Callback to deliver the PTokens

 SYNTAX
   § 4.2
   [70] EntityDecl  ::= GEDecl | PEDecl
   [71] GEDecl      ::= '<!ENTITY' S Name S EntityDef S? '>'
   [72] PEDecl      ::= '<!ENTITY' S '%' S Name S PEDef S? '>'
   [73] EntityDef   ::= EntityValue | (ExternalID NDataDecl?)
   [74] PEDef       ::= EntityValue | ExternalID
   [76] NDataDecl   ::= S 'NDATA' S Name
    [9] EntityValue ::= '"' ([^%&"] | PEReference | Reference)* '"' |
                        "'" ([^%&'] | PEReference | Reference)* "'"
\**********************************************************************/

function parseEntityDeclaration(
   source: STokenSource,
   declarationStart: DeclarationStart,
   deliverPToken: (
      pToken: GeneralEntityDeclarationPToken | ParameterEntityDeclarationPToken,
   ) => void,
): void {
   const props: AnyEntityDeclaration = {};

   parseParameter(source, props, (withParam) => {
      parseUnexpanded(source, 'name', (unexp) => {
         if (unexp) {
            props.unexpanded = unexp;
            parseClose(source, declarationStart, props, deliverPToken);
            return;
         }

         parseName(source, withParam, (withName) => {
            if (!withName.parameter) {
               parseValue(source, declarationStart, withName, true, deliverPToken);
               return;
            }

            const open = withName.parameter;

            source.extractNoParams('peekChar', (sToken) => {
               if (strOrBlank(sToken) !== ';') {
                  parseValue(source, declarationStart, withName, false, deliverPToken);
                  return;
               }

               source.extract('match', ';', (semicolon) => {
                  const peRef = new ParameterEntityReferencePToken({
                     open,
                     openSpace: withName.parameterSpace,
                     name: withName.name,
                     nameSpace: withName.nameSpace,
                     close: semicolon,
                  });

                  parseUnexpandedAfterPeRef(source, 'parameter', (result) => {
                     parseClose(
                        source,
                        declarationStart,
                        {
                           unexpanded: {
                              propName: 'parameter',
                              tokens: result ? [peRef, ...result.tokens] : [peRef],
                           },
                        },
                        deliverPToken,
                     );
                  });
               });
            });
         });
      });
   });
}

function resumeParseParts(
   source: STokenSource,
   props: AnyEntityDeclaration,
   propName: string,
   preSpace: SToken | undefined,
   deliverProps: (props: AnyEntityDeclaration) => void,
): void {
   switch (propName) {
      case 'parameter':
         parseParameter(source, props, (withParam) => {
            withParam.declTypeSpace = combineSTokens(withParam.declTypeSpace, preSpace);
            resumeParseParts(source, withParam, 'name', undefined, deliverProps);
         });
         break;
      case 'name':
         parseName(source, props, (withName) => {
            if (props.parameter) {
               withName.parameterSpace = combineSTokens(withName.parameterSpace, preSpace);
            } else {
               withName.declTypeSpace = combineSTokens(withName.declTypeSpace, preSpace);
            }
            resumeParseParts(source, withName, 'externalIdOrValue', undefined, deliverProps);
         });
         break;
      case 'externalIdOrValue':
         parseExternalId(source, ['>'], (parsedExtId) => {
            if (!parsedExtId) {
               resumeParseParts(source, props, 'value', preSpace, deliverProps);
            } else {
               props.externalId = parsedExtId.externalId;
               props.nameSpace = combineSTokens(props.nameSpace, preSpace);
               source.extractNoParams('space', (externalIdSpace) => {
                  props.externalIdSpace = externalIdSpace;
                  if (!props.parameter) {
                     resumeParseParts(source, props, 'nData', undefined, deliverProps);
                  } else {
                     deliverProps(props);
                  }
               });
            }
         });
         break;
      case 'value':
         props.nameSpace = combineSTokens(props.nameSpace, preSpace);
         parseLiteralValue(source, props, deliverProps);
         break;
      case 'nData':
         parseNData(source, props, (withNData) => {
            withNData.externalIdSpace = combineSTokens(withNData.externalIdSpace, preSpace);

            if (!withNData.nData) {
               deliverProps(props);
               return;
            }
            resumeParseParts(source, props, 'nDataName', undefined, deliverProps);
         });
         break;
      case 'nDataName':
         props.nDataSpace = combineSTokens(props.nDataSpace, preSpace);
         parseNDataName(source, props, deliverProps);
         break;
      case 'trailing':
         let newResult: AnyEntityDeclaration;

         if (props.nData || props.nDataName) {
            newResult = {
               ...props,
               nDataNameSpace: combineSTokens(props.nDataNameSpace, preSpace),
            };
         } else if (!props.externalId) {
            newResult = {
               ...props,
               valueSpace: combineSTokens(props.valueSpace, preSpace),
            };
         } else {
            newResult = {
               ...props,
               externalIdSpace: combineSTokens(props.externalIdSpace, preSpace),
            };
         }
         deliverProps(newResult);
         break;
      default:
         deliverProps(props);
   }
}

function resumeParseEntityDeclaration(
   source: STokenSource,
   existing: GeneralEntityDeclarationPToken | ParameterEntityDeclarationPToken,
   deliverPToken: (
      pToken: GeneralEntityDeclarationPToken | ParameterEntityDeclarationPToken,
   ) => void,
): void {
   if (!existing.unexpanded) {
      deliverPToken(existing);
      return;
   }

   const dup: AnyEntityDeclaration = { ...existing };

   source.extractNoParams('space', (preSpace) => {
      const propName = existing.unexpanded!.propName; // eslint-disable-line @typescript-eslint/no-non-null-assertion

      resumeParseParts(source, dup, propName, preSpace, (props) => {
         source.extract('all', [], (sToken) => {
            props.extra = sToken;

            if (dup.parameter || props.parameter) {
               deliverPToken(new ParameterEntityDeclarationPToken(existing, props));
            } else {
               deliverPToken(new GeneralEntityDeclarationPToken(existing, props));
            }
         });
      });
   });
}

export { parseEntityDeclaration, resumeParseEntityDeclaration };
