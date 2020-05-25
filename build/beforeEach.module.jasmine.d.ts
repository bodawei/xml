declare global {
   interface console {
       json(...args: Array<any>): void;
   }
}

export {};  // needed to allow the declare global