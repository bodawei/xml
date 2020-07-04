/* Copyright ® 20178-2020 by 柏大衛. All rights reserved. */

interface Descriptor {
   name: string;
   type: string;
   allowed?: RegExp;
   flatten?: boolean;
}

type DescriptorArray = Array<Descriptor>;

export { Descriptor, DescriptorArray };
