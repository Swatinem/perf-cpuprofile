
var Lines = require('./lines');
var Samples = require('./samples');

module.exports = Reader;

function Reader(input) {
	return input.pipe(new Lines()).pipe(new Samples());
}
