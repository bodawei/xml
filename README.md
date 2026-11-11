# YAXT: Yet-Another XML Toolkit
or
# XXUT: eXtensible XML Utility Toolkit
or
# ???

# What Is It

# Goals
* Standards compliant XML parser
	* The XML standard test suite all passes
* Accepts very, very poor quality XML
	* Can report in detail on locations of errors and problems
* Can be used to process XML documents larger than memory
* Usable in browser and node

Technical goals

* Composable: Parts can be added and removed without deep technical knowledge of the system
* Stream-like at its heart: new functionality can be added by composing streams


# Linting and formatting

`oxfmt` owns formatting and import ordering (`.oxfmtrc.json`); `oxlint` owns everything else
(`.oxlintrc.jsonc`). `npm run lint` only reports — it changes nothing on disk.

`.vscode/settings.json` runs both on save for anyone using the `oxc.oxc-vscode` extension,
with the three fixers below switched off.

## `npm run lint:fix` is dangerous — do not run it casually

It applies every available oxlint fixer across `source/`, which today rewrites **140 files**
and drops the finding count from 1785 to 712. The result still type-checks and both test
suites still pass, so nothing is *broken* — but three of those fixers produce changes you do
not want arriving unreviewed in a diff:

*  `sort-keys` reorders the keys of about a thousand object literals. ESLint's version of this
   rule had no fixer at all, so this hazard is new as of the oxlint cutover.
*  `no-unnecessary-type-assertion` strips `!` and `as any` (15 sites). A human wrote each of
   those on purpose, and the `eslint-disable` comment above it gets left behind, now stale.
*  `no-redundant-type-constituents` drops `| undefined` from optional parameters (8 sites) but
   leaves the whitespace where it was, so the file then fails `oxfmt --check`.

If you want a fixer applied, scope it to the files you are working on — `npx oxlint --fix
<paths>` — and read the diff before committing. Note that `-A`/`--allow` will not narrow it to
a single rule, because `.oxlintrc.jsonc` lists every rule explicitly and per-rule settings beat
the category flags.

# Other Projects
* [https://github.com/Leonidas-from-XIV/node-xml2js](https://github.com/Leonidas-from-XIV/node-xml2js)
* [https://github.com/EXIficient/exificient.js](https://github.com/EXIficient/exificient.js)
https://github.com/rgrove/parse-xml