## Filenames
* Filenames are camelCase

## File structure
* Comment at the top of each file in the form: `/* Copyright ® 2020 by 柏大衛. All rights reserved. */`
   * If a file updated on multiple years, the name should include a range from first to last (e.g. `2020-2021`)


## Test files
* Should import jest globals via
   `import { describe, expect, it } from '@jest/globals';`
* Test descriptions should be present active singular ("(it) does x"). If more details are needed, should be of the form "(it) does x when y")

## Errors
* WellFormed, Validity, Error and Fatal ErrotTokens should reference spec sections at the end in the form `(§1.2.3)`