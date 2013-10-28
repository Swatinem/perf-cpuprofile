#!/usr/bin/env node

// This is the same bullshit that mocha mocha does.
// We need this so we can actually pass `--harmony` to the real process

var spawn = require('child_process').spawn
  , args = [ __dirname + '/_perf-cpuprofile.js' ];

spawn(process.argv[0], ['--harmony'].concat(args), { customFds: [0,1,2] });
