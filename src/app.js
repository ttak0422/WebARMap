const msg = 'ようこそARの世界へ！@1.61';

//TODO:モジュールのインポート方法の改善
//NBasedCrdSysで使用するモジュール
import 'three/VRControls';
import Geo from './modules/Geo';

import NBasedCrdSys from './modules/NBasedCrdSys';
import SimpleHud    from './modules/SimpleHud';

/// ********* AR ********* ///
const renderer = new THREE.WebGLRenderer({alpha: true});
const scene    = new THREE.Scene();
const ambient  = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambient);
let vrFrameData, vrDisplay, arView, anchorManager;
let nSystem;
let cam;

/// ********* for debug ********* ///
const hud       = new SimpleHud(renderer);
const cubeSize0 = 30;
const cubeSize1 = 0.30;
const geometry0 = new THREE.BoxGeometry(cubeSize0, cubeSize0, cubeSize0);
const geometry1 = new THREE.BoxGeometry(cubeSize1, cubeSize1, cubeSize1);
const materialW = new THREE.MeshPhongMaterial( { color: '#ffffff' } );
const materialR = new THREE.MeshPhongMaterial( { color: '#ff0000' } );
const cube0Lib  = new THREE.Mesh( geometry0, materialW );
const cube0Lab  = new THREE.Mesh( geometry1, materialR );
const cube1     = new THREE.Mesh( geometry1, materialW );
const cube2     = new THREE.Mesh( geometry1, materialR );
cube1.name = 'white_cube';
cube2.name = 'red_cube';
let arDebugger;
function log(msg){
    console.log("[app] " + msg);
}
function pos2str(pos) {
    return `pos: ${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)}`;
}

awake();

function awake() {
    log("awake called");

    THREEAR.ARUtils.getARDisplay().then(async function (display) {
        if (display) {
            log("your device is ready for our app!");

            alert(msg);
            vrDisplay   = display;
            vrFrameData = new VRFrameData();
            arInit();

            //init debugger
            arDebugger = new THREEAR.ARDebug(vrDisplay,scene);
            document.body.appendChild(arDebugger.getElement());

            nSystem = new NBasedCrdSys(scene, cam, start);

            window.addEventListener('resize', onWindowResize, false);
            window.addEventListener('touchstart', onClick, false);
        } else {
            log("your device is not supported!")
            THREEAR.ARUtils.displayUnsupportedMessage();
        }
    });
}

function start(){
    log("start called");
    //キューブを北にならって配置
    // nSystem.add(cube1);
    // nSystem.add(cube2);
    // cube1.position.set(0, 0, -1);
    // cube2.position.set(0, 0, -2);
    nSystem.add2LatLng(cube0Lib, 34.403058, 132.714301);
    nSystem.add2LatLng(cube0Lab, 34.40186953458748, 132.71486369469042);
    update()
}

function update() {
    arUpdate();
    hud.update(pos2str(cam.getWorldPosition()));
}

function onWindowResize() {
    cam.aspect = window.innerWidth / window.innerHeight;
    cam.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onClick(e) {
    switch(e.touches.length){
        case 1: singletap(e); break;
        case 2: doubletap(e); break;
    }
}

function arInit() {
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.autoClear = false;
    arView        = new THREEAR.ARView(vrDisplay, renderer);
    anchorManager = new THREEAR.ARAnchorManager(vrDisplay);
    cam = new THREEAR.ARPerspectiveCamera(
        vrDisplay,
        60, //fov
        window.innerWidth / window.innerHeight,
        vrDisplay.depthNear,
        2000 //vrDisplay.depthFar
    );
    document.body.appendChild(renderer.domElement);
}

function arUpdate() {
    renderer.clearColor();
    arView.render();
    vrDisplay.getFrameData(vrFrameData);
    nSystem.update();
    renderer.clearDepth();
    renderer.render(scene, cam);
    vrDisplay.requestAnimationFrame(update);
}

/**
 * タップした地点の座標を取得
 * @param {*} e event
 */
async function singletap(e){
    const hitX = e.touches[0].pageX / window.innerWidth;
    const hitY = e.touches[0].pageY / window.innerHeight;
    const hits = vrDisplay.hitTest(hitX,hitY);
    if(hits && hits.length){
        const hit = hits[0];
        const mm = hit.modelMatrix;
        const x = mm[12];
        const y = mm[13];
        const z = mm[14];
        log(`tapped pos: ${x}, ${y}, ${z}`)
    }
}

async function doubletap(e){
    nSystem.Test();
}