const path = require('path');
const CircularDependencyPlugin = require('circular-dependency-plugin');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
module.exports = {
    watch: false,
    mode: 'development',
    plugins: [
        new MonacoWebpackPlugin(),
        new CircularDependencyPlugin({
            exclude: /node_modules/,
            failOnError: true,
            cwd: process.cwd()
        })
    ],
    entry: {
        monacoLangClient: './public/javascripts/monacoLangClientLoader.js'
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [
                    {
                        loader: 'style-loader'
                    },
                    {
                        loader: 'css-loader'
                    }
                ]
            },
            {
                test: /\.ttf$/,
                use: ['file-loader']
            }
        ]
    },
    resolve: {
        alias: {
            vscode: path.resolve(__dirname, './node_modules/monaco-languageclient/lib/vscode-compatibility')
        },
        fallback: {
            fs: false,
            child_process: false,
            net: false,
            crypto: false,
            path: false,
            os: false
        }
    },
    devtool: 'eval',
    output: {
        filename: '[name].bundle.js',
        chunkFilename: '[chunkhash].bundle.js',
        libraryTarget: 'umd',
        library: '[name]',
        umdNamedDefine: true,
        path: path.join(__dirname, 'public/javascripts/webpack'),
        publicPath: '/javascripts/webpack/'
    },
    stats: 'normal'
};
