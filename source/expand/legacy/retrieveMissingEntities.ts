import { EntityMetaData } from 'basic';
import { STokenSource, strOrBlank } from 'sToken';
import { EntityValuePToken } from 'token';

// import { ParameterEntityInfo, ParameterEntityMap } from '../types';

type ExpandUnassignedProps = {
   paramEntitiesByName: any;
   retrieveExternalEntity: (externalId: any, emd: EntityMetaData) => STokenSource;
   processForEntityValue: (
      sTokenSource: STokenSource,
      done: (results: EntityValuePToken) => void,
   ) => void;
   emd: EntityMetaData;
};

function filterMissingPEs(names: Array<string>, peByName: any): Array<any> {
   const neededPEs: Array<any> = [];

   for (const name of names) {
      const peInfo = peByName[name];

      if (peInfo && !(peInfo as any).ppEntityValue) {
         neededPEs.push(peInfo);
      }
   }

   return neededPEs;
}

type WorkingMap = { [name: string]: boolean };

function retrieveMissingEntities(
   neededEntities: Array<string>,
   props: ExpandUnassignedProps,
   done: () => void,
) {
   const missingInfos = filterMissingPEs(neededEntities, props.paramEntitiesByName);

   const workingOn: WorkingMap = {};
   let workingCount = 0;
   let working = false;

   for (const missingPEInfo of missingInfos) {
      const tokenName = strOrBlank(missingPEInfo.token.name);

      if (workingOn[tokenName]) {
         continue;
      }

      workingOn[tokenName] = true;

      if (missingPEInfo.isInternal) {
         (missingPEInfo as any).ppEntityValue = missingPEInfo.token.value as any; // typehack
      } else {
         working = true;
         workingCount++;
         const sTokenSource = props.retrieveExternalEntity(
            missingPEInfo.token.externalId!,
            props.emd,
         );

         // eslint-disable-next-line
         props.processForEntityValue(sTokenSource, (result: any) => {
            (missingPEInfo as any).ppEntityValue = result;
            // Must recursively retrieve missing values and then fold those in
            // The latter should be a pre-defined routine as it should have been used in the internal ones at the point of encountering them
            // see EntityExpander.expandEntityValue
            workingCount--;

            if (workingCount === 0) {
               done();
            }
         });
      }
   }

   if (!working) {
      done();
   }
}

/*
 * Given a set of parameter entity info's for entities that we have no values for (these are always external)
 * Retrieve them, and parse into a PassOneParse array and store
 *
 * This essentially normalizes the
 */
export { retrieveMissingEntities, ExpandUnassignedProps };
