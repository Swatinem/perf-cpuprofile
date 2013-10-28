#!/usr/bin/env node

var perfCpuprofile = require('../');

// TODO: detect if we are running through a pipe, and automatically
// pipe through `perf script` into `perf.cpuprofile` if not

perfCpuprofile(process.stdin, function (profile) {
	console.log(JSON.stringify(profile));
});
