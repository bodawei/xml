declare module "readable-stream" {
   namespace stream {
      class Transform {
         constructor(params: Object);
         on(event: string, cb: Function): any;
         push(value: any): any;
         pipe(other: any): any;
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

      class PassThrough {
         constructor(params: Object);
         on(event: string, cb: Function): any;
         push(value: any): any;
         pipe(other: any): any;
         read(): any;
         write(value: any): void;
         end(): void;
         pause(): void;
         resume(): void;
      }
   }
   export default stream;
}
