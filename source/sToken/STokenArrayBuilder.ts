import { SToken } from '../sToken';

class STokenArrayBuilder {
   public sTokenArray: ReadonlyArray<SToken> = [];

   add(value: SToken | Array<SToken> | undefined) {
      const arr = this.sTokenArray as Array<SToken>;

      if (Array.isArray(value)) {
         for (let index = 0; index < value.length; index++) {
            const val = value[index];

            if (val) {
               arr.push(val);
            }
         }
      } else if (value) {
         arr.push(value);
      }
   }
}

export default STokenArrayBuilder;