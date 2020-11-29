/* Copyright ® 2018 by 柏大衛. All rights reserved. */

import { StateId, Transition, State, NameToTransitionMap, StateIdToStateMap, Graph } from './nameListGraphTypes';

type VisitedMap = { [stateId: number]: true };

let nextStateId: StateId;

/*
 * In nameListToGraph(), we create various "autoTrans" transitions for situations
 * where we are allowed to automatically transition from one state to another without
 * first matching any input. However, we can technically remove all of those.
 * It is very hard to do it while converting the original expression into a graph,
 * since this needs to be able to look ahead.
 * 
 * This routine, then, takes the output from a nameListToGraph() call, and re-arranges
 * the whole graph to remove all autoTrans transitions.
 * 
 * The basic observation here is that if we auto-transition from the current state to
 * a target one, we can copy the target's transitions into the current state, thereby
 * removing the need for autoTransitioning.  We need to do this recursively since
 * the target state may, itself, have auto transitions and we need to have performed
 * the same operation there, first, to make sure we have all the transitions we can
 * reach from the current state.
 * 
 * A byproduct of this is that we may end up a situation where the same input can
 * transition to multiple states. We cope with this by introducing an "artifical"
 * state that that input transitions to, and then that state will recieve the next
 * input to decide where to transition next. Naturally, this operation needs to
 * be processed recursively, since in so doing the artificial state may end up
 * with conflicting transitions.
 * 
 * Note that we change the refs, in the case of one of these conflicts, to be
 * a comma separated list of the refs that were there before.
 */
function collapseAutoTrans(graph: Graph) {
   const todo: Array<StateId> = [];
   const queued: VisitedMap = {};

   nextStateId = findNextId(graph);

   todo.push(graph.startId);

   // Walk through the graph depth first, removing auto-transitions on each state
   while (todo.length > 0) {
      const id = todo.pop() as number;
      const targetState = graph.states[id];

      replaceAutoTrans(targetState, graph.states);

      const names = Object.keys(targetState.trans);

      for (let index = 0; index < names.length; index++) {
         const name = names[index];
         const transition = targetState.trans[name];
         const transToId = transition.stateId;

         if (queued[transToId]) {
            continue;
         }

         queued[transToId] = true;
         todo.push(transToId);
      }
   }

}

// Determine what stateId to use for any states we create.
function findNextId(graph: Graph): StateId {
   const stateIds = Object.keys(graph.states).map((idString) => parseInt(idString, 10));

   const max = stateIds.reduce((base, id) => Math.max(base, id), 0);

   return max + 1;
}

/*
 * Remove the auto transitions from this state.  Note that we keep track of which
 * states we have already traversed. We do this not in order to avoid re-processing
 * a state (in that case it would be a noop), but rather to avoid infinite loops,
 * since it is common to have loops in the states.
 * In this case, we retain the autoTrans value, which will later be removed.
 */
function replaceAutoTrans(currState: State, allStates: StateIdToStateMap, traversed: VisitedMap = {}): true | void {
   if (traversed[currState.id]) {
      return true;
   }
   if (!currState.autoTrans || currState.autoTrans.length === 0) {
      return;
   }

   traversed[currState.id] = true;

   const oldAutoTrans = currState.autoTrans;
   currState.autoTrans = [];

   for (let index = 0; index < oldAutoTrans.length; index++) {
      const transToState = allStates[oldAutoTrans[index]];

      const result = replaceAutoTrans(transToState, allStates, traversed);
      if (result) {
         currState.autoTrans.push(transToState.id);
         continue;
      }

      if (transToState.done) {
         currState.done = true;
      }

      addAllTransitions(currState, transToState, allStates);
   }
}

function addAllTransitions(base: State, originator: State, allStates: StateIdToStateMap) {
   const names = Object.keys(originator.trans);

   for (let index = 0; index < names.length; index++) { //
      const name = names[index];
      const originTrans = originator.trans[name];
      const baseTrans = base.trans[name];

      if (!baseTrans) {
         base.trans[name] = originTrans;
         continue;
      }

      if (baseTrans.ref === originTrans.ref) {
         continue;
      }

      // @@@ here is the problem

      // Create a state that we will transition to when we see 'name'.
      // It will then contain the transitions that can be done from there.
      const newState = makeState(allStates);
      const state1 = allStates[originTrans.stateId];
      const state2 = allStates[baseTrans.stateId];

      replaceAutoTrans(state1, allStates);
      replaceAutoTrans(state2, allStates);

      base.trans[name] = {
         ref: `${baseTrans.ref},${originTrans.ref}`,
         stateId: newState.id,
      };

      newState.autoTrans = (state1.autoTrans || []).concat(state2.autoTrans || []);
      newState.trans = Object.assign({}, state1.trans) as NameToTransitionMap;
      const newDone = state1.done || state2.done;
      if (newDone) {
         newState.done = true;
      }
   
      addAllTransitions(newState, state2, allStates);
   };
}

function makeState(map: StateIdToStateMap): State {
   const state: State = {
      id: nextStateId,
      autoTrans: [],
      trans: {}
   };

   map[nextStateId] = state;

   nextStateId ++;

   return state;
}

export default collapseAutoTrans;
