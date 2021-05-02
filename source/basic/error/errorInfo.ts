import { XmlErrorPosition } from './XmlErrorToken';

interface ErrorInfo {
   position: XmlErrorPosition;
   id: string;
   params?: ReadonlyArray<string>;
   lastPosition?: XmlErrorPosition;
}

export { ErrorInfo };
