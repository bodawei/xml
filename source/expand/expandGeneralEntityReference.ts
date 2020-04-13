// import { EntityMetaData } from 'basic';
// import { defaultExtractors } from 'extractor';
// import { STokenSource, strOrBlank } from 'sToken';
// import {
//    CHARREF_PTOKEN,
//    TEXT_PTOKEN,
//    PARAMETER_ENTITY_REFERENCE_PTOKEN,

//    EntityValuePToken,

//    ParameterEntityStartPToken,
//    ParameterEntityEndPToken,
//    GeneralEntityReferencePToken,
   
//    literalValue,
//    GeneralEntityStartPToken,
//    GeneralEntityEndPToken,
//    GENERAL_ENTITY_REFERENCE_PTOKEN,
// } from 'token';

// import { GeneralEntityMap } from './types';
// import { LiteralValuePToken } from 'source/token/common/literal';

// type Done = (errors: Array<Error>) => void;

// type ExpandRefParams = {
//    geDeclarationCache: GeneralEntityMap,
//    emd: EntityMetaData,
//    deliver: (data: Array<any>) => void,
// }

// function valueToSTokenSource(entityValue: EntityValuePToken, emd: EntityMetaData): STokenSource {
//    const source = new STokenSource(defaultExtractors, emd);

//    for (let element of entityValue) {
//       switch (element.type) {
//          case CHARREF_PTOKEN:
//             source.addText(String.fromCharCode(element.charCode));
//             break;
//          case TEXT_PTOKEN:
//             source.addText(element.text.str);
//             break;
//       }
//    }

//    source.endText();

//    return source;
// }

// function expandGeneralEntityReference(reference: GeneralEntityReferencePToken, params: ExpandRefParams, done: Done) {
//    const { deliver, emd, geDeclarationCache } = params;
//    const entityName = strOrBlank(reference.name);
   
//    const info = geDeclarationCache[entityName];

//    if (!info) {
//       done([]);
//    }


//    if (info.valueCache) {
//       const sTokenSource = valueToSTokenSource(info.valueCache, emd);

//       // if content
//       // into an expandContentGeRef() ?
//       // This DOES need to do WF checking optionally. At least.
//       // if (params.inContent) {
//       //    params.processSTokenSource(sTokenSource, true, params.deliver, done);
//       //    return;
//       // } 

//       // if attribute
//       // This should probably get mostly pulled into an expandAttribute() function?
//       literalValue.parse(sTokenSource, ['&'], (literalArray) => {
//          const geRefResults: { [entityNAme: string] : LiteralValuePToken } = {};
//          let geRefCount = 0;

//          for (let item of literalArray) {
//             if (item.type === GENERAL_ENTITY_REFERENCE_PTOKEN) {
//                geRefCount++;
//             }
//          }

//          if (geRefCount === 0) {
//             deliver([ new GeneralEntityStartPToken(reference), ...literalArray, new GeneralEntityEndPToken(reference) ]);
//             done([]);
//             return;
//          }

//          for (let item of literalArray) {
//             if (item.type === GENERAL_ENTITY_REFERENCE_PTOKEN) {
//                const refName = strOrBlank(item.name);
//                const localParams = { ...params };

//                geRefResults[refName] = [];
//                localParams.deliver = (results) => {
//                   geRefResults[refName].push(...results);
//                };

//                expandGeneralEntityReference(item, localParams, () => {
//                   geRefCount --;

//                   if (geRefCount === 0) {
//                      const finalResults = [];

//                      for (let item of literalArray) {
//                         if (item.type === GENERAL_ENTITY_REFERENCE_PTOKEN) {
//                            finalResults.push(...geRefResults[refName]);
//                         } else {
//                            finalResults.push(item);
//                         }
//                      }

//                      deliver([ new GeneralEntityStartPToken(reference), ...finalResults, new GeneralEntityEndPToken(reference) ]);
//                      done([]);
//                   }
//                })
//             }
//          }
//       });
//    } else {
//       const sTokenSource: STokenSource = params.retrieveExternalEntity(info.token.externalId!, emd);

//       params.processForEntityValue(sTokenSource, (entityValuePToken: EntityValuePToken) => {
//          // Why is the entity value being built for async.  It actually isn't doing taht, and there's no real value in it. Other than WF checking the PE Refs
//          // in which case we should be doing the GERefs the same.  What is our goal.
          
//          expandEntityValue(entityValuePToken, expandParams, (expandedEntityValue) => {
//             info.valueCache = expandedEntityValue;


//             errors.push(...sTokenSource.errors);

//             // do the above
//          });
//       });
//    }
// }


// // Still need expandPERefInMarkup


// export {
//    ExpandRefParams, 
//    expandGeneralEntityReference,
// };
