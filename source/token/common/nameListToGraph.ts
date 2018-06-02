/* Copyright ® 2018 by 柏大衛. All rights reserved. */

import { XNameList, XName, isXName } from './nameList'
import { Transition, State, NameToTransitionMap, StateIdToStateMap, Graph } from './nameListGraphTypes';

let nextStateId = 0;

/*
 * Takes a XNameList and produces a graph that can be used to evaluate
 * whether an input stream matches the expression implicit in the XNameList
 */
function nameListToGraph(list: XNameList): Graph {
   nextStateId = 0;
   const graph = processList(list, makeState(), makeState(), '/');

   graph.states[graph.endId].done = true;

   return graph;
}

/*
 * Produce a (sub-)graph given the provided list.
 * It is important to note that in this processing, we do not try to be smart about
 * "ambiguous" transitions.  That is, while the XML Spec disallows ambiguous
 * transitions, we want to be able to cope with them nonetheless. But, at this stage
 * of the processing it is hard to do that as we go, do we will instead be quite
 * willing to build "empty" states (that is, ones with only autoTransitions) in order
 * to assure that each trans only has a single source.  See processChoiceList() for
 * an example.
 */
function processList(list: XNameList, start: State, end: State, baseRef: string): Graph {
   const graph: Graph = {
      startId: start.id,
      endId: end.id,
      states: {
         [start.id]: start,
         [end.id]: end,
      },
   };

   // Set up the autoTransitions for the graph
   switch (list.repeat) {
      case 'ZEROONE':
         addAutoTrans(start, end);
         break;
      case 'ZEROPLUS':
         addAutoTrans(start, end);
         addAutoTrans(end, start);
         break;
      case 'ONEPLUS':
         addAutoTrans(end, start);
         break;
      case 'ONE':
         // nothing.
         break;
   }

   if (list.listType === 'CHOICE') {
      processChoiceList(list, graph, baseRef);
   } else {
      processSequenceList(list, graph, baseRef);
   }

   return graph;
}

/*
 * Choice lists always produce transitions from the start to the end.
 * For choice items that are XNames, we just create an ordinary XName transition.
 *    [start] --name--> [end]
 * For sub-lists, however, we create new start and end states, and then produce
 * autoTransitions from the start and the end of the graph we were provided. 
 *    [start] --auto--> [substart]...[subend] --auto--> [end]
 * We do this because it allows subend to transition
 * back to substart, without interfering with start we were given. This allows us
 * to express (a | b | (a | b) | c) without the a's conflicting (you'll note that
 * this setup has two different paths we could take if an 'a' is found). This is,
 * technically, ambiguous. So, for example, we build:
 *             /-name1------------------------------>\
 *            /               /--name1-->\            \
 *    [start] --auto--> [substart]...[subend] --auto--> [end]
 */
function processChoiceList(list: XNameList, graph: Graph, refBase: string): void {
   for (let index = 0; index < list.names.length; index++) {
      const particle = list.names[index];
      const start = graph.states[graph.startId];
      const end = graph.states[graph.endId];

      if (isXName(particle)) {
         processXNameInChoice(graph, particle, start, end, `${refBase}${index + 1}`);
      } else {
         const innerGraph = processList(particle, makeState(), makeState(), `${refBase}${index + 1}/`);

         graph.states = Object.assign(graph.states, innerGraph.states) as StateIdToStateMap;
         addAutoTrans(start, innerGraph.states[innerGraph.startId]);
         addAutoTrans(innerGraph.states[innerGraph.endId], end);
      }
   }
}

/*
 * Sequence lists always produce a series of states with transitions between
 * them.
 * For items that are XNames, we just create an ordinary XName transition.
 *    [start] ... [stateN] --name--> [stateN+1] ... [end]
 * For sublists, however, we do something different than processChoiceList().
 * In this case, we can always safely use the currentState as the start
 * state for the sub-list (if it is a choice we'll autoTrans from it,
 * and if it is a sequence, we'll just keep chaining off of it).
 * However, again we create a new end start and auto-transition from that to
 * this next state, allowing that state to be used by the sublist as
 * it sees fit.
 *         /<--auto--\            
 *    [start]...[subend] --auto--> [end]
 */
function processSequenceList(list: XNameList, graph: Graph, refBase: string): void {
   let current = graph.states[graph.startId];
   let next: State;

   for (let index = 0; index < list.names.length; index++) {
      const particle = list.names[index];

      if (index === list.names.length - 1) {
         next = graph.states[graph.endId];
      } else {
         next = makeState(graph);
      }

      if (isXName(particle)) {
         processXNameInSequence(graph, particle, current, next, `${refBase}${index + 1}`);
      } else {
         const innerGraph = processList(particle, current, makeState(), `${refBase}${index + 1}/`);

         graph.states = Object.assign(graph.states, innerGraph.states) as StateIdToStateMap;
         addAutoTrans(innerGraph.states[innerGraph.endId], next);
      }

      current = next;
   }
}

/*
 * Set up the transitions for a single XName.
 *    name:  [current] --name--> [next]
 * 
 *                   /---auto--->\
 *    name?: [current] --name--> [next]
 * 
 *                   /-----------auto----------->\
 *    name*: [current] --name--> [mid] --auto--> [next]
 *                              /    \
 *                              <-name
 * 
 *                                   /---auto--->\
 *    name+: [current] --name--> [mid]           [next]
 *                              /    \
 *                              <-name
 */
function processXNameInChoice(graph: Graph, name: XName, current: State, next: State, transRef: string): void {
   switch(name.repeat) {
      case 'ONE':
         addTrans(current, next, name.name, transRef);
         break;
      case 'ZEROONE':
         addAutoTrans(current, next);
         addTrans(current, next, name.name, transRef);
         break;
      case 'ZEROPLUS':
         const zpMid = makeState(graph);
         addAutoTrans(current, next);
         addAutoTrans(zpMid, next);
         addTrans(current, zpMid, name.name, transRef);
         addTrans(zpMid, zpMid, name.name, transRef);
         break;
      case 'ONEPLUS':
         const opMid = makeState(graph);
         addAutoTrans(opMid, next);
         addTrans(current, opMid, name.name, transRef);
         addTrans(opMid, opMid, name.name, transRef);
         break;
   }
}

/*
 * Set up the transitions for a single XName. Note that we avoid making assumptions about
 * whether we can auto-transition from next back, since that end may be the start of
 * the next transition in the sequence what may use "name" to move forward
 * (e.g. (x, y, z+, z, w).  This is, technically, not valid.  But we want to not break
 * if we encounter this.
 *    name:  [current] --name--> [next]
 * 
 *                   /---auto--->\
 *    name?: [current] --name--> [next]
 * 
 *                   /---auto--->\
 *    name*: [current]           [next]
 *              /    \
 *              <-name
 *                                   /--auto-->\
 *    name+: [current] --name--> [mid]         [next]
 *                              /    \
 *                              <-name
 */
function processXNameInSequence(graph: Graph, name: XName, current: State, next: State, transRef: string): void {
   switch(name.repeat) {
      case 'ONE':
         addTrans(current, next, name.name, transRef);
         break;
      case 'ZEROONE':
         addAutoTrans(current, next);
         addTrans(current, next, name.name, transRef);
         break;
      case 'ZEROPLUS':
         addAutoTrans(current, next);
         addTrans(current, current, name.name, transRef);
         break;
      case 'ONEPLUS':
         const opMid = makeState(graph);
         addAutoTrans(opMid, next);
         addTrans(current, opMid, name.name, transRef);
         addTrans(opMid, opMid, name.name, transRef);
         break;
   }
}

function makeState(graph?: Graph): State {
   const state: State = {
      id: nextStateId,
      autoTrans: [],
      trans: {}
   };

   if (graph) {
      graph.states[nextStateId] = state;
   }

   nextStateId ++;

   return state;
}

function addAutoTrans(state: State, autoTransToState: State): void {
   const index = state.autoTrans!.indexOf(autoTransToState.id); // We always have an autotrans, because we create all the states
   
   if (index === -1) {
      state.autoTrans!.push(autoTransToState.id);
   }
}

function addTrans(sourceState: State, destState: State, transName: string, transRef: string): void {
   sourceState.trans[transName] = {
      ref: transRef,
      stateId: destState.id,
   };
}

export default nameListToGraph;