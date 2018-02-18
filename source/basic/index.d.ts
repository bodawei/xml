declare class EntityMetaData {
   new(entityKind: string, xmlVersion: number, xmlRevision: number, location: EntityLocation): EntityMetaData;
}

declare class EntityLocation {
   new(systemId?: string, publicId?: string): EntityLocation;
}

declare class Range {
   constructor(location?: EntityLocation, index?: number, row?: number, column?: number, endIndex?: number, endRow?: number, endColumn?: number);
   location: EntityLocation;
   startIndex: number;
   startRow: number;
   startColumn: number;
   endIndex: number;
   endRow: number;
   endColumn: number;
}

export {
   EntityMetaData,
   EntityLocation,
   Range,
};