/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { ContentModelP } from 'pToken';

import { CmGraph } from './cmGraphTypes';
import { cmToCmGraph } from './cmToCmGraph';
import { collapseAutoTrans } from './collapseAutoTrans';
import { pruneCmGraph } from './pruneCmGraph';

function makeCmGraph(contentModel: ContentModelP): CmGraph {
   const graph = cmToCmGraph(contentModel);
   collapseAutoTrans(graph);
   return pruneCmGraph(graph);
}

export { makeCmGraph };
