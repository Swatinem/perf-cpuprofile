# PerfCpuprofile

Converts linux `perf` tool output to .cpuprofile files readable by chromiums devtools

[![Build Status](https://travis-ci.org/Swatinem/perf-cpuprofile.png?branch=master)](https://travis-ci.org/Swatinem/perf-cpuprofile)
[![Coverage Status](https://coveralls.io/repos/Swatinem/perf-cpuprofile/badge.png?branch=master)](https://coveralls.io/r/Swatinem/perf-cpuprofile)
[![Dependency Status](https://gemnasium.com/Swatinem/perf-cpuprofile.png)](https://gemnasium.com/Swatinem/perf-cpuprofile)

## Installation

    $ npm install -g perf-cpuprofile

## Usage

Generate a `perf` trace: 

    $ perf record -p `pidof sourceview` -g dwarf

Then simply run:

    $ perf-cpuprofile

Or if you have custom file names or just love to pipe:

    $ cat custom.perf.data | perf script | perf-cpuprofile -- > custom.cpuprofile

Calling `perf-cpuprofile` with the argument `--` makes it output to stdout instead
of writing to the default `perf.cpuprofile` file.

Then just open up the file in chromiums devtools profile tab, and voilà:

![chromiums profiler next to perf](example.png?raw=true)

It still has some issues with unresolvable functions and finding the callers for
`_mcount`, but overall, I’m very happy with it :-)

## Helpers

Run node with `--perf-basic-prof` to prodive js stacks.
You can then try to filter the output as explained in
[this gist](https://gist.github.com/trevnorris/9616784).

## License

  GPLv3

