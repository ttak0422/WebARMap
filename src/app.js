const msg = 'ようこそARの世界へ！@1.5';

//TODO:モジュールのインポート方法の改善
//NBasedCrdSysで使用するモジュール
import 'three/VRControls';
import Geo from './modules/Geo';
//
import NBasedCrdSys from './modules/NBasedCrdSys';
import SimpleHud    from './modules/SimpleHud';

/// ********* AR ********* ///
const renderer = new THREE.WebGLRenderer({alpha: true});
const scene    = new THREE.Scene();
let vrFrameData, vrDisplay, arView, anchorManager;
let nSystem;
let cam;

/// ********* for debug ********* ///
let hud;
const cubeSize = 0.30;
const geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
const material = new THREE.MeshPhongMaterial( { color: '#ffffff' } );
const cube1 = new THREE.Mesh( geometry, material );
const cube2 = new THREE.Mesh( geometry, material );
let arDebugger;
function pos2str(pos) {
    return 'pos: ' + pos.x.toFixed(2) + ', ' + pos.y.toFixed(2) + ', ' + pos.z.toFixed(2);
}

init();

function init() {
    THREEAR.ARUtils.getARDisplay().then(async function (display) {
        if (display) {
            alert(msg);
            vrDisplay   = display;
            vrFrameData = new VRFrameData();
            arInit();

            //init debugger
            arDebugger = new THREEAR.ARDebug(vrDisplay,scene);
            document.body.appendChild(arDebugger.getElement());

            hud     = new SimpleHud(renderer);
            nSystem = new NBasedCrdSys(scene, cam, update);

            //キューブを北に習って配置
            nSystem.add(cube1);
            nSystem.add(cube2);
            cube1.position.set(0, 0, -1);
            cube2.position.set(0, 0, -2);

            window.addEventListener('resize', onWindowResize, false);
            window.addEventListener('touchstart', onClick, false);
        } else {
            THREEAR.ARUtils.displayUnsupportedMessage();
        }
    });
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
    cam.updateProjectionMatrix();
    vrDisplay.getFrameData(vrFrameData);
    nSystem.update();
    renderer.clearDepth();
    renderer.render(scene, cam);
    vrDisplay.requestAnimationFrame(update);
}

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
        console.log(x + " " + y + " " + z);
    }
}

async function doubletap(e){
}