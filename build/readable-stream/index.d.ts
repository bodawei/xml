declare module "readable-stream" {
   namespace streamx {
      class Transform {
         constructor(params: Object);
         on(event: string, cb: Function): any;
         push(value: any): any;
         write(value: any): void;
         read(): any;
         end(): void;
         pause(): void;
         resume(): void;
      }
   }
   export default streamx;
}
