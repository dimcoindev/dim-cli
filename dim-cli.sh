#!/bin/bash
DIRNAME=`pwd`
$DIRNAME/node_modules/babel-cli/bin/babel-node.js build/dim-cli.js "$@"
