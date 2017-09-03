#!/usr/bin/env node
/* eslint-disable no-console, no-process-exit */

const fs = require('fs');
const semver = require('semver');

const gitLogToJson = require('git-log-to-json');

const promise = gitLogToJson('./');

function computeVersion(logs, final) {
   let version = semver('0.0.0');

   for (let index = logs.length - 1; index >= -1; index--) {
      let body;

      if (index === -1) {
         body = final;
      } else {
         body = logs[index].body;
      }

      if (body.indexOf('fix') !== -1) {
         version = semver.inc(version, 'patch');
      } else if (body.indexOf('feat') !== -1) {
         version = semver.inc(version, 'minor');
      } else if (body.indexOf('BREAKING CHANGE') !== -1) {
         version = semver.inc(version, 'major');
      } else {
         console.log('ERROR: Commit message has no keyword.', body);
      }
   }

   return version;
}

function updateVersion(version) {
   const packageString = fs.readFileSync('./package.json');
   const packageInfo = JSON.parse(packageString);

   packageInfo.version = version;
   console.log(`Preparing to commit version ${version}`);

   fs.writeFileSync('./package.json', JSON.stringify(packageInfo, undefined, 3));
}

function reportError(error) {
   console.error('ERROR in pre-commit git hook (.git/hooks/pre-commit).');
   console.error(JSON.stringify(error, undefined, 3));
   process.exit(-1);
}

promise
   .then((logs) => {
      const newVersion = computeVersion(logs, process.argv[2]);

      updateVersion(newVersion);

      process.exit(0);
   })
   .catch(reportError);
