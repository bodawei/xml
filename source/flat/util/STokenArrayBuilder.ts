import { SToken } from 'basic';

class STokenArrayBuilder {
   public sTokenArray: Array<SToken> = [];

   add(...values: Array<SToken | Array<SToken | undefined> | undefined>): Array<SToken> {
      const arr = this.sTokenArray;

      for (const value of values) {
         if (Array.isArray(value)) {
            for (const val of value) {
               if (val) {
                  arr.push(val);
               }
            }
         } else if (value) {
            arr.push(value);
         }
      }

      return this.sTokenArray;
   }
}

export { STokenArrayBuilder };
