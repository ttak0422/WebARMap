import 'three/VRControls';

import Geo from './modules/Geo';
import SimpleHud from './modules/SimpleHud';

/// ********* AR ********* ///
const renderer = new THREE.WebGLRenderer({alpha: true});
const scene    = new THREE.Scene();
const trackObj = new THREE.Object3D();
var vrFrameData, vrDisplay, vrControls, arView;
var cam;

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
var geometry = new THREE.BoxGeometry(0.1,0.1,0.1);
var material = new THREE.MeshPhongMaterial( { color: '#ffffff' } );
var cube = new THREE.Mesh( geometry, material );
    cube.position.set(1000, 1000, 1000);
    scene.add(cube);
var standingMatrix = new THREE.Matrix4();
var arDebugger;
var reticle;
var heading = 0;
var frame = 0;
function pos2str(pos) {
    return 'pos: ' + pos.x.toFixed(2) + ', ' + pos.y.toFixed(2) + ', ' + pos.z.toFixed(2);
}
/// ********* --- ********* ///

init();

function init() {
    THREEAR.ARUtils.getARDisplay().then(async function (display) {
        if (display) {
            vrDisplay = display;
            vrFrameData = new VRFrameData();
            alert('ようこそARの世界へ！ v0.102');
            initArSystem();
            initDebugger();

            cube.position.set(0, 0, 2);

            hud = new SimpleHud(renderer);
            geo = new Geo(async function(){
                offsetPos = await geo.AsyncGetBasPos();
                heading   = geo.GetBasHeading() / 180 * Math.PI;
                update();
            });
        } else {
            THREEAR.ARUtils.displayUnsupportedMessage();
        }
    });
}

function update() {
    updateArSystem();
    hud.update(pos2str(cam.position));
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
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.autoClear = false;
    arView = new THREEAR.ARView(vrDisplay, renderer);
    anchorManager = new THREEAR.ARAnchorManager(vrDisplay);
    cam = new THREEAR.ARPerspectiveCamera(
        vrDisplay,
        60, //fov
        window.innerWidth / window.innerHeight,
        vrDisplay.depthNear,
        2000 //vrDisplay.depthFar
    );
    cam.useQuaternion = true;
    vrControls = new THREE.VRControls(trackObj);
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
    //カメラの位置の更新
    const trackPos = trackObj.position;
    const trackPosRecalcX = trackPos.x * Math.cos(heading) - trackPos.z * Math.sin(heading);
    const trackPosRecalcZ = trackPos.z * Math.cos(heading) + trackPos.x * Math.sin(heading);
    const pose = vrFrameData.pose;
    //cam.position.fromArray(pose.position);
    cam.position.fromArray(trackPos);
    cam.quaternion.fromArray(pose.orientation);
    cam.position.set(
        trackPosRecalcX,
        trackPos.y,
        trackPosRecalcZ
    );
    //カメラの回転の更新

    //cam.updateMatrix();



    // const trackRot = trackObj.rotation;
    // cam.rotation.set(
    //     trackRot.x,
    //     trackRot.y,
    //     trackRot.z
    // );

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