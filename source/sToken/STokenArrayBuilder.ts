import SToken from './SToken';

class STokenArrayBuilder {
   public sTokenArray: Array<SToken> = [];

   add(...values: Array<SToken | Array<SToken | undefined> | undefined>) {
      const arr = this.sTokenArray;

      for (let index = 0; index < values.length; index++) {
         const value = values[index];

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

      return this.sTokenArray;
   }
}

export default STokenArrayBuilder;
