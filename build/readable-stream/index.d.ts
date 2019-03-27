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

      class Readable {
         constructor(params: Object);
         on(event: string, cb: Function): any;
         push(value: any): any;
         pipe(other: Transform): Transform;
         read(): any;
         pause(): void;
         resume(): void;
      }

      class PassThrough extends Transform {
         constructor(params: Object);
         on(event: string, cb: Function): any;
         push(value: any): any;
         pipe(other: Transform): Transform;
         read(): any;
         pause(): void;
         resume(): void;
      }
   }
   export default streamx;
}
