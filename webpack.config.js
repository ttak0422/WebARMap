const webpack = require('webpack');
const path    = require('path');

module.exports = {
    entry: {
        bundle: './src/app.js'
    },
    output: {
        path: path.join(__dirname,'dist'),
        filename: 'bundle.js'
    },
    resolve: {
        // 使用したいコントロールやレンダラを定義しておきます。(下記は一例です。)
        alias: {            
            //// カメラ制御
            //'three/OrbitControls': path.join(__dirname, 'node_modules/three/examples/js/controls/OrbitControls.js'),
        }
    },
    plugins: [
        //THREE
        new webpack.ProvidePlugin({
            'THREE':'three/build/three'
        }),
        //THREE.AR
        new webpack.ProvidePlugin({
            'THREEAR':'three.ar.js/dist/three.ar'
        })
    ]
}