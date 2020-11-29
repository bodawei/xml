/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { Graph } from './nameListGraphTypes';
import nameListGraph from './nameListGraph';
import { ContentModelX } from 'source/xToken/common/contentModelX';



function graphFromNameList(children: ContentModelX): Graph {
   const graph = nameListGraph.nameListToGraph(children);
   nameListGraph.collapseAutoTrans(graph);
   nameListGraph.pruneNameListGraph(graph);

   return graph;
}

export {
   graphFromNameList,
};