#!/usr/bin/env node

var spawn = require('child_process').spawn;
var write = require('fs').writeFileSync;
var perfCpuprofile = require('../');

var input = process.stdin;
if (input.isTTY) {
	var perf = spawn('perf', ['script']);
	input = perf.stdout;
}

perfCpuprofile(input, function (profile) {
	var out = JSON.stringify(profile);
	if (process.argv[2] == '--')
		console.log(out);
	else
		write('perf.cpuprofile', out);
});
