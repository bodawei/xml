/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { ElementDeclarationPToken, pTokenArrayToString } from 'pToken';
import { SToken, strOrBlank } from 'sToken';
import { ElementStartPToken, ElementEmptyPToken, ELEMENT_EMPTY_PTOKEN } from 'token';

import { ElementContext, ElDeclType, ValidateState, ValidateStateProps } from '../validateState';

function updateFromAttributes(
   el: ElementStartPToken | ElementEmptyPToken,
   state: ValidateState,
): ValidateStateProps {
   const ids: ValidateStateProps = {};

   const elName = strOrBlank(el.name);
   const attDefs = state.attributeDefs[elName];

   if (!attDefs) {
      return ids;
   }

   for (const att of el.attributes) {
      const attName = strOrBlank(att.name);
      const attValue = pTokenArrayToString(att.value);
      const defType = strOrBlank(attDefs[attName]?.def.type).toUpperCase();

      if (defType === 'ID' && !state.ids[attValue]) {
         ids.ids = {
            ...state.ids,
            [attValue]: {
               elName,
               attName,
            },
         };
      }
   }

   return ids;
}

function updateCurrentElContext(elName: string, state: ValidateState): ValidateState {
   const activeContext = state.elementContext.activeContext;

   if (activeContext?.declDetails.type === ElDeclType.ELEMENT) {
      const currentState = activeContext.declDetails.graph.states[activeContext.stateId];
      const destState = currentState.trans[elName];

      if (destState) {
         const newContext: ElementContext = { ...activeContext, stateId: destState.stateId };
         const temp = [...state.elementContext.contextStack];
         temp.pop();
         temp.push(newContext);

         return {
            ...state,
            elementContext: {
               ...state.elementContext,
               contextStack: temp,
               activeContext: newContext,
            },
         };
      }
   }

   return state;
}

function elementStartUpdateState(
   el: ElementStartPToken | ElementEmptyPToken,
   state: ValidateState,
): ValidateState {
   const elName = strOrBlank(el.name);
   const declDetails = state.elementDeclarations[elName];
   const newState: ValidateState = updateCurrentElContext(elName, state);
   let context: ElementContext;
   let elementContext = newState.elementContext;

   if (el.type === ELEMENT_EMPTY_PTOKEN) {
      // Why are we only checking empty elements?
      // And why aren't we checking the end more often?
      // And might it be better to check all conditions even if past the end?
      if (newState.elementContext.contextStack.length === 0) {
         return {
            ...newState,
            elementContext: {
               ...state.elementContext,
               pastEnd: true,
            },
         };
      }
   } else {
      if (declDetails) {
         context = {
            declDetails,
            parentName: elName,
            stateId: declDetails.type === ElDeclType.ELEMENT ? declDetails.graph.startId : 0,
         };
      } else {
         // @@@@ this seems like we should be reporting an error here.  What error is that?
         context = {
            declDetails: {
               // Add a dummy declaration to keep the types happy.
               token: new ElementDeclarationPToken({
                  open: new SToken('<!', '<!', []),
               }),
               type: ElDeclType.ANY,
            },
            parentName: elName,
            stateId: 0,
         };
      }

      const newElementContxt = newState.elementContext;
      elementContext = {
         ...newElementContxt,
         contextStack: [...newElementContxt.contextStack, context],
         activeContext: context,
      };
   }

   const attrState = updateFromAttributes(el, state);

   return {
      ...newState,
      ...attrState,
      elementContext,
   };
}

export { elementStartUpdateState };
