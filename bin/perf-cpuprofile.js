#!/usr/bin/env node

// This is the same bullshit that mocha mocha does.
// We need this so we can actually pass `--harmony` to the real process

var spawn = require('child_process').spawn
  , args = [ __dirname + '/_perf-cpuprofile.js' ].concat(process.argv.slice(2));

spawn(process.argv[0], ['--harmony'].concat(args), {stdio: [0,1,2]});
