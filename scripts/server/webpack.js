const fs = require('fs');
const path = require('path');
const glob = require('glob');
const webpack = require('webpack');
const getConfig = require('../webpack/dev');
const loaders = require('../webpack/loaders');
const { parseMD } = require('../utils');

const babelConfig = require('@alifd/babel-preset-next')({ runtime: true });

babelConfig.babelrc = false;
const babelLoader = loaders.js(babelConfig);
const loadersPath = path.join(__dirname, 'loaders');
const cwd = process.cwd();

module.exports = function getWebpackConfig(options) {
    const config = getConfig();
    const { componentName, componentPath, disableAnimation, lang, dir, devA11y, mode } = options;

    const indexPath = path.join(componentPath, lang === 'zh' ? 'index.md' : 'index.en-us.md');
    const demoPaths = glob.sync(path.join(componentPath, 'demo', '*.md'));
    const themePaths = glob.sync(path.resolve(componentPath, 'theme/**/*.jsx'));
    const entry = getEntry([indexPath, ...demoPaths, ...themePaths], componentName, mode);
    config.entry = entry;

    config.output = {
        publicPath: '/',
        filename: '[name].js',
    };

    config.resolveLoader = {
        alias: {
            'index-loader': path.join(loadersPath, 'index/index.js'),
            'demo-loader': path.join(loadersPath, 'demo/index.js'),
            'theme-loader': path.join(loadersPath, 'theme/index.js'),
        },
    };

    const babelLoaderIndex = config.module.rules.findIndex(rule => {
        return rule.test.toString().indexOf('js') > -1;
    });
    config.module.rules[babelLoaderIndex] = babelLoader;

    let links = getLinks(demoPaths);
    links = [
        {
            href: componentName,
            title: '首页',
            filename: 'index',
        },
        {
            href: null,
            title: '使用示例',
            filename: 'Usage',
        },
    ].concat(links);

    links.push({
        href: null,
        title: '主题配置',
        filename: 'Usage of theme',
    });

    config.module.rules.push({
        test: /theme\/.+\.jsx$/,
        use: [
            babelLoader,
            {
                loader: 'theme-loader',
                options: {
                    disableAnimation,
                    componentName,
                },
            },
        ],
    });

    config.plugins.unshift(new webpack.HotModuleReplacementPlugin());
    config.plugins.push(
        new webpack.optimize.CommonsChunkPlugin({
            name: 'common',
            chunks: Object.keys(entry).filter(entryPath => !/docs\/[^/]+\/index\.((en-us)\.)?$/.test(entryPath)),
        })
    );

    config.externals = {
        react: 'var window.React',
        'react-dom': 'var window.ReactDOM',
        moment: 'var window.moment',
    };

    return config;
};

function getEntry(entryPaths, componentName, mode) {
    const entry = entryPaths.reduce((ret, entryPath) => {
        const name = path.basename(entryPath, path.extname(entryPath));
        const pathWithoutExt = path.join(path.dirname(entryPath), name);
        let cssArr = [];
        // 通过 mode 判断引入的样式文件
        if (mode === 'css') {
            cssArr = [
                path.join(process.cwd(), 'lib', componentName, 'variable.css'),
                path.join(process.cwd(), 'lib', componentName, 'style2.js'),
                path.join(process.cwd(), 'lib', 'core2', 'index.css'),
            ];
        } else if (componentName !== 'core') {
            cssArr = [path.join(process.cwd(), 'src', componentName, 'style.js')];
        }
        ret[pathWithoutExt] = [
            'react-dev-utils/webpackHotDevClient',
            // css var should only be included once.
            // import it from 'src/core/index-noreset.scss'
            // will produce many duplicates,
            // making dev app slow
            // path.join(process.cwd(), 'src', 'core', 'css-var-def.scss'),
            ...cssArr,
            entryPath,
        ];
        return ret;
    }, {});

    return entry;
}

function getLinks(demoPaths) {
    const demoMetas = demoPaths.reduce((ret, demoPath) => {
        const content = fs.readFileSync(demoPath, 'utf8');
        const result = parseMD(content, demoPath);
        ret[demoPath] = result.meta;
        return ret;
    }, {});
    const demoOrders = demoPaths.reduce((ret, demoPath) => {
        const meta = demoMetas[demoPath];
        let order = 9999;
        if (meta) {
            const number = parseInt(meta.order, 10);
            if (!isNaN(number)) {
                order = number;
            }
        }
        ret[demoPath] = order;
        return ret;
    }, {});
    const orderedDemoPaths = demoPaths.sort((prev, next) => demoOrders[prev] - demoOrders[next]);
    return orderedDemoPaths.map(demoPath => {
        const href = path.relative(path.join(cwd, 'docs'), demoPath).replace(/\.md$/, '.html');
        let title = (demoMetas[demoPath] || {}).title;
        if (!title) {
            title = path.basename(demoPath, '.md');
        }

        return { href, title, filename: path.basename(demoPath, '.md') };
    });
}
