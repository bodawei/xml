/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { ElementDeclarationPToken } from 'pToken';
import { SToken, strOrBlank } from 'sToken';
import { ElementStartPToken, ElementEmptyPToken, ELEMENT_EMPTY_PTOKEN } from 'token';

import { ElementContext, ElDeclType, ValidateState } from '../validateState';

function updateCurrentElContext(elName: string, state: ValidateState): ValidateState {
   const activeContext = state.elementContext.activeContext;

   if (activeContext?.declDetails.type === ElDeclType.CHILDREN) {
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

   if (el.type === ELEMENT_EMPTY_PTOKEN) {
      if (newState.elementContext.contextStack.length === 0) {
         return {
            ...newState,
            elementContext: {
               ...state.elementContext,
               pastEnd: true,
            },
         };
      }

      return newState;
   }

   if (declDetails) {
      context = {
         declDetails,
         parentName: elName,
         stateId: declDetails.type === ElDeclType.CHILDREN ? declDetails.graph.startId : 0,
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

   return {
      ...newState,
      elementContext: {
         ...newElementContxt,
         contextStack: [...newElementContxt.contextStack, context],
         activeContext: context,
      },
   };
}

export { elementStartUpdateState };
