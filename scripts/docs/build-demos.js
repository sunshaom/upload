const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
const getWebpackConfig = require('./configs/webpack/theme');
const { logger } = require('../utils');

const cwd = process.cwd();
/*
 *
 *  docs/xxxx/theme/index.jsx
 *
 * ->
 *
 * demos/xxxx/index.html
 * demos/xxxx/deps.json
 * demos/xxxx/build/index.css
 *
 */
module.exports = function*(options) {
    const webpackEntry = {};
    const deps = {};

    // get config
    const config = getWebpackConfig({
        entry: webpackEntry,
        target: cwd,
        deps: deps,
    });
    // build
    const compiler = webpack(config);

    yield new Promise((resolve, reject) => {
        compiler.run((err, stats) => {
            if (err) {
                reject(err);
            } else if (stats.hasErrors()) {
                logger.info(
                    stats.toString({
                        colors: true,
                        profile: true,
                        chunkModules: false,
                    })
                );
                reject();
            } else {
                resolve();
            }
        });
    });
};

function fstat(file) {
    try {
        return fs.statSync(file);
    } catch (err) {
        return false;
    }
}
