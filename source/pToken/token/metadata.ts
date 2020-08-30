/* Copyright ® 2020 by 柏大衛. All rights reserved. */

const METADATA_PTOKEN = 'METADATA_PTOKEN';

/*
 * This type is used to define various metadata that
 * can flow through the system. in practice, any
 * will actually be subtypes with a `subtype` property
 * and other properties that carry extra information.
 */
interface MetadataPToken {
   readonly type: typeof METADATA_PTOKEN;
   readonly subtype: string;
}

export { METADATA_PTOKEN, MetadataPToken };
