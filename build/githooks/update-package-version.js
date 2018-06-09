#!/usr/bin/env node
/* eslint-disable no-console, no-process-exit */

const fs = require('fs');
const child_process = require('child_process'); // eslint-disable-line camelcase
const semver = require('semver');

function computeVersion(logs, final) {
   let version = semver('0.0.0');

   for (let index = logs.length - 1; index >= -1; index--) {
      let body;
      let subject = '';

      if (index === -1) {
         body = final;
      } else {
         body = logs[index].body;
         subject = logs[index].subject;
      }

      if (body.indexOf('BREAKING CHANGE') !== -1) {
         version = semver.inc(version, 'major');
      } else if (subject.indexOf('fix') === 0) {
         version = semver.inc(version, 'patch');
      } else if (subject.indexOf('feat') === 0) {
         version = semver.inc(version, 'minor');
      } else {
         // console.log('ERROR: Commit message has no keyword.', body);
      }
   }

   console.log('SELECTED VERSION: ', version);
   return version;
}

function updateVersion(version) {
   const packageString = fs.readFileSync('./package.json');
   const packageInfo = JSON.parse(packageString);

   packageInfo.version = version;
   console.log(`Preparing to commit version ${version}`);

   fs.writeFileSync('./package.json', JSON.stringify(packageInfo, undefined, 3));
}

const results = child_process.execSync('git log --pretty=format:"%sÒÒÒÒ%b"'); // eslint-disable-line camelcase
const commits = results.toString().split('');

const details = commits
   .filter((commit) => commit !== '')
   .map((commit) => {
      const parts = commit.split('ÒÒÒÒ');
      return {
         subject: parts[0].toString(),
         body: parts[1].toString(),
      };
   });

const newVersion = computeVersion(details, process.argv[2]);
updateVersion(newVersion);
process.exit(0);
