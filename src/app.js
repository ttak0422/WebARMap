import 'three/VRControls';

import Geo from './modules/Geo';
import SimpleHud from './modules/SimpleHud';

/// ********* AR ********* ///
var vrFrameData,vrDisplay, vrControls, arView;
var cam, camGroup;
var scene, renderer, reticle;
var anchorManager, curDevicePos;
/// ********* -- ********* ///

/// ********* GEO ********* ///
var geo;
var offsetPos;
var angle;
/// ********* --- ********* ///

/// ********* HUD ********* ///
var hud;
/// ********* --- ********* ///

/// ********* other ********* ///
var arDebugger;
var reticle;
var frame = 0;
var cameraman;

/// ********* ----- ********* ///

init();

function init() {
    THREEAR.ARUtils.getARDisplay().then(async function (display) {
        if (display) {
            vrFrameData = new VRFrameData();
            vrDisplay = display;
            alert('ようこそARの世界へ！ v0.07014');
            initArSystem();
            initDebugger();
            hud = new SimpleHud(renderer);
            geo = new Geo(async function(){
                offsetPos = await geo.asyncGetBasPos();

                camGroup.position.set(100,100,100);
                camGroup.add(cam);
                scene.add(camGroup);
                const pos = cam.getWorldPosition();
                alert('pos: ' + pos.x.toFixed(2) + ', ' + pos.y.toFixed(2) + ', ' + pos.z.toFixed(2));
                update();
            });
        } else {
            THREEAR.ARUtils.displayUnsupportedMessage();
        }
    });
}

function update() {
    updateArSystem();
    let pos = cam.getWorldPosition();
    hud.update('pos: ' + pos.x.toFixed(2) + ', ' + pos.y.toFixed(2) + ', ' + pos.z.toFixed(2));
}

function onWindowResize() {
    cam.aspect = window.innerWidth / window.innerHeight;
    cam.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

async function asyncTouchFunc(){
}

document.onkeydown = async function(e){
};

function onClick(e) {
    //タップ
    switch(e.touches.length){
        case 1:
            let x = e.touches[0].pageX / window.innerWidth;
            let y = e.touches[0].pageY / window.innerHeight;
            let hits = vrDisplay.hitTest(x,y);
            if(hits && hits.length){
                let hit = hits[0];
                let mm = hit.modelMatrix;
                let x = mm[12];
                let y = mm[13];
                let z = mm[14];

                console.log(x + " " + y + " " + z);

                asyncTouchFunc();

            }
            break;
        case 2:
            break;
    }
}

/// ********* AR System ********* ///
function initArSystem() {
    renderer = new THREE.WebGLRenderer({alpha: true});
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.autoClear = false;
    scene  = new THREE.Scene();
    arView = new THREEAR.ARView(vrDisplay, renderer);
    anchorManager = new THREEAR.ARAnchorManager(vrDisplay);
    cam = new THREEAR.ARPerspectiveCamera(
                vrDisplay,
                60, //fov
                window.innerWidth / window.innerHeight,
                vrDisplay.depthNear,
                2000 //vrDisplay.depthFar
            );
    camGroup = new THREE.Group();
    vrControls = new THREE.VRControls(cam); //カメラの移動について上書き
    document.body.appendChild(renderer.domElement);

    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('touchstart', onClick, false);
}
function updateArSystem() {
    renderer.clearColor();
    arView.render();
    cam.updateProjectionMatrix();
    vrDisplay.getFrameData(vrFrameData);
    vrControls.update();
    renderer.clearDepth();
    renderer.render(scene, cam);
    curDevicePos = vrFrameData.pose.position;
    vrDisplay.requestAnimationFrame(update);
}
/// ********* _________ ********* ///

/// ********* AR Debugger ********* ///
function initDebugger() {
    arDebugger = new THREEAR.ARDebug(vrDisplay,scene);
    document.body.appendChild(arDebugger.getElement());
}
/// ********* ___________ ********* ///

/// ********* Reticle ********* ///
function initReticle() {
    reticle = new THREEAR.ARReticle(vrDisplay, 0.03, 0.04, 0xff0077, 0.25);
    scene.add(reticle);
}
function updateReticle() {
    reticle.update(0.5, 0.5);
}
/// ********* _______ ********* ///