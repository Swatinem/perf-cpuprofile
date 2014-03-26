/* vim: set shiftwidth=2 tabstop=2 noexpandtab textwidth=80 wrap : */
"use strict";

var Lines = require('./lines');
var Samples = require('./samples');

module.exports = Reader;

function Reader(input) {
	return input.pipe(new Lines()).pipe(new Samples());
}
