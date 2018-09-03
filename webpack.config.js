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
        alias: {
            'three/VRControls': path.join(__dirname, 'node_modules/three/examples/js/controls/VRControls.js'),
            'three/GLTFLoader': path.join(__dirname, 'node_modules/three/examples/js/loaders/GLTFLoader.js'),
            'three/examples/js/renderers/CSS3DRenderer': path.join(__dirname, 'node_modules/three/examples/js/renderers/CSS3DRenderer.js'),
            'three/src/geometries/PlaneGeometry': path.join(__dirname, 'node_modules/three/src/geometries/PlaneGeometry.js')
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