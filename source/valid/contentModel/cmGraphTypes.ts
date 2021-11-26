/* Copyright ® 2018-2021 by 柏大衛. All rights reserved. */

type CmStateId = number;

/*
 * CmTransition is used to represent an arc from one Cmstate to another. It is
 * "triggered" by a name found in the original NameList. The "ref" value
 * is the numeric path to this Cmtransition in the original expression.
 * Thus, "foo" in (a, b, ( c | foo | d), z) is at "3/2" (which means the third item
 * the top list, and the second in the list at position three).
 * Note that a ref may contain multiple such paths in the case that this
 * Cmtransition has been combined with others.
 */
interface MutableCmTransition {
   ref: string;
   stateId: CmStateId;
}

interface MutableCmState {
   autoTrans?: Array<CmStateId>;
   done?: boolean; // true if you can stop when you reach this Cmstate.
   id: CmStateId;
   trans: MutableCnNameToCmTransitionMap;
}

interface MutableCnNameToCmTransitionMap {
   [name: string]: MutableCmTransition | undefined;
}

interface MutableCmStateIdToCmStateMap {
   [CmstateId: string]: MutableCmState;
}

interface MutableCmGraph {
   endId: CmStateId;
   startId: CmStateId;
   states: MutableCmStateIdToCmStateMap;
}

type CmTransition = Readonly<MutableCmTransition>;

interface CnNameToCmTransitionMap {
   readonly [name: string]: CmTransition | undefined;
}

interface CmState {
   readonly autoTrans?: ReadonlyArray<CmStateId>;
   readonly done?: boolean; // true if you can stop when you reach this Cmstate.
   readonly id: CmStateId;
   readonly trans: CnNameToCmTransitionMap;
}

interface CmStateIdToCmStateMap {
   readonly [CmstateId: string]: CmState;
}

interface CmGraph {
   readonly endId: CmStateId;
   readonly startId: CmStateId;
   readonly states: CmStateIdToCmStateMap;
}

export {
   CmGraph,
   CmState,
   CmStateId,
   CmStateIdToCmStateMap,
   CmTransition,
   MutableCmGraph,
   MutableCmStateIdToCmStateMap,
   MutableCmState,
   MutableCmTransition,
};
