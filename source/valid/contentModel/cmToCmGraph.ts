/* Copyright ® 2018-2021 by 柏大衛. All rights reserved. */

import { ContentModelP, ContentNameP, isContentModelP } from 'pToken';
import { SToken, strOrBlank } from 'sToken';
import { CmState, CmGraph } from './cmGraphTypes';

type StateMaker = (graph?: CmGraph) => CmState;

function addAutoTrans(state: CmState, autoTransToState: CmState): void {
   // We always have an autotrans, because we create all the states in this file, and always give them an autoTrans.
   // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
   const index = state.autoTrans!.indexOf(autoTransToState.id);

   if (index === -1) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      state.autoTrans!.push(autoTransToState.id);
   }
}

function addTrans(
   sourceState: CmState,
   destState: CmState,
   transName: SToken | undefined,
   transRef: string,
): void {
   const entry = sourceState.trans[strOrBlank(transName)];
   let actualTransRef = transRef;

   if (entry) {
      actualTransRef = `${entry.ref},${transRef}`;
   }

   sourceState.trans[strOrBlank(transName)] = {
      ref: actualTransRef,
      stateId: destState.id,
   };
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
function processNameInSequence(
   graph: CmGraph,
   name: ContentNameP,
   current: CmState,
   next: CmState,
   transRef: string,
   makeState: StateMaker,
): void {
   switch (strOrBlank(name.repeat)) {
      case '':
         addTrans(current, next, name.name, transRef);
         break;
      case '?':
         addAutoTrans(current, next);
         addTrans(current, next, name.name, transRef);
         break;
      case '*':
         addAutoTrans(current, next);
         addTrans(current, current, name.name, transRef);
         break;
      case '+':
         const opMid = makeState(graph);
         addAutoTrans(opMid, next);
         addTrans(current, opMid, name.name, transRef);
         addTrans(opMid, opMid, name.name, transRef);
         break;
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
function processNameInChoice(
   graph: CmGraph,
   name: ContentNameP,
   current: CmState,
   next: CmState,
   transRef: string,
   makeState: StateMaker,
): void {
   switch (strOrBlank(name.repeat)) {
      case '':
         addTrans(current, next, name.name, transRef);
         break;
      case '?':
         addAutoTrans(current, next);
         addTrans(current, next, name.name, transRef);
         break;
      case '*':
         const zpMid = makeState(graph);
         addAutoTrans(current, next);
         addAutoTrans(zpMid, next);
         addTrans(current, zpMid, name.name, transRef);
         addTrans(zpMid, zpMid, name.name, transRef);
         break;
      case '+':
         const opMid = makeState(graph);
         addAutoTrans(opMid, next);
         addTrans(current, opMid, name.name, transRef);
         addTrans(opMid, opMid, name.name, transRef);
         break;
   }
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
function processContentModelInChoice(
   list: ContentModelP,
   graph: CmGraph,
   refBase: string,
   makeState: StateMaker,
): void {
   for (let index = 0; index < list.delimitedParticles.length; index++) {
      const delimitedParticle = list.delimitedParticles[index];
      const start = graph.states[graph.startId];
      const end = graph.states[graph.endId];

      if (!delimitedParticle.particle) {
         continue;
      }

      if (isContentModelP(delimitedParticle.particle)) {
         // eslint-disable-next-line @typescript-eslint/no-use-before-define
         const innerGraph = processList(
            delimitedParticle.particle,
            makeState(),
            makeState(),
            `${refBase}${index + 1}/`,
            makeState,
         );

         graph.states = Object.assign(graph.states, innerGraph.states);
         addAutoTrans(start, innerGraph.states[innerGraph.startId]);
         addAutoTrans(innerGraph.states[innerGraph.endId], end);
      } else {
         processNameInChoice(
            graph,
            delimitedParticle.particle,
            start,
            end,
            `${refBase}${index + 1}`,
            makeState,
         );
      }
   }
}

/*
 * Sequence lists always produce a series of states with transitions between
 * them.
 * For items that are XNames, we just create an ordinary XName transition.
 *    [start] ... [stateN] --name--> [stateN+1] ... [end]
 * For sublists, however, we do something different than processContentModelInChoice().
 * In this case, we can always safely use the currentState as the start
 * state for the sub-list (if it is a choice we'll autoTrans from it,
 * and if it is a sequence, we'll just keep chaining off of it).
 * However, again we create a new end start and auto-transition from that to
 * this next state, allowing that state to be used by the sublist as
 * it sees fit.
 *         /<--auto--\
 *    [start]...[subend] --auto--> [end]
 */
function processContentModelInSequence(
   list: ContentModelP,
   graph: CmGraph,
   refBase: string,
   makeState: StateMaker,
): void {
   let current = graph.states[graph.startId];
   let next: CmState;

   for (let index = 0; index < list.delimitedParticles.length; index++) {
      const delimitedParticle = list.delimitedParticles[index];

      if (index === list.delimitedParticles.length - 1) {
         next = graph.states[graph.endId];
      } else {
         next = makeState(graph);
      }

      if (!delimitedParticle.particle) {
         continue;
      }

      if (isContentModelP(delimitedParticle.particle)) {
         // eslint-disable-next-line @typescript-eslint/no-use-before-define
         const innerGraph = processList(
            delimitedParticle.particle,
            current,
            makeState(),
            `${refBase}${index + 1}/`,
            makeState,
         );

         graph.states = {
            ...graph.states,
            ...innerGraph.states,
         };
         addAutoTrans(innerGraph.states[innerGraph.endId], next);
      } else {
         processNameInSequence(
            graph,
            delimitedParticle.particle,
            current,
            next,
            `${refBase}${index + 1}`,
            makeState,
         );
      }

      current = next;
   }
}

/*
 * Produce a (sub-)graph given the provided list.
 * It is important to note that in this processing, we do not try to be smart about
 * "ambiguous" transitions.  That is, while the XML Spec disallows ambiguous
 * transitions, we want to be able to cope with them nonetheless. But, at this stage
 * of the processing it is hard to do that as we go, do we will instead be quite
 * willing to build "empty" states (that is, ones with only autoTransitions) in order
 * to assure that each trans only has a single source.  See processContentModelInChoice() for
 * an example.
 */
function processList(
   list: ContentModelP,
   start: CmState,
   end: CmState,
   baseRef: string,
   makeState: StateMaker,
): CmGraph {
   const graph: CmGraph = {
      endId: end.id,
      startId: start.id,
      states: {
         [start.id]: start,
         [end.id]: end,
      },
   };

   // Set up the autoTransitions for the graph
   switch (strOrBlank(list.repeat)) {
      case '?':
         addAutoTrans(start, end);
         break;
      case '*':
         addAutoTrans(start, end);
         addAutoTrans(end, start);
         break;
      case '+':
         addAutoTrans(end, start);
         break;
      case '':
         // nothing.
         break;
   }

   const delimited = list.delimitedParticles[0];
   let delimiter: string | undefined;

   if (list.delimitedParticles[0]) {
      delimiter = strOrBlank(delimited.delimiter);
   }

   if (delimiter === ',') {
      processContentModelInSequence(list, graph, baseRef, makeState);
   } else {
      processContentModelInChoice(list, graph, baseRef, makeState);
   }

   return graph;
}

function makeStateMaker() {
   let nextStateId = 0;
   function makeState(graph?: CmGraph): CmState {
      const state: CmState = {
         autoTrans: [],
         id: nextStateId,
         trans: {},
      };

      if (graph) {
         graph.states[nextStateId] = state;
      }

      nextStateId++;

      return state;
   }

   return makeState;
}

/*
 * Takes a ContentModelP and produces a graph that can be used to evaluate
 * whether an input stream matches the expression implicit in the ContentModelP
 */
function cmToCmGraph(list: ContentModelP): CmGraph {
   const makeState = makeStateMaker();

   const graph = processList(list, makeState(), makeState(), '/', makeState);

   graph.states[graph.endId].done = true;

   return graph;
}

export { cmToCmGraph };
