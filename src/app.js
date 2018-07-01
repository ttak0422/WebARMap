import 'three/VRControls';
import 'three/GLTFLoader';
const Geo = require('./modules/Geo');

/// ********* AR ********* ///
var vrFrameData,vrDisplay, vrControls, arView; 
var curPos;
var canvas, camera, scene, renderer, reticle;
var anchorManager;
/// ********* -- ********* ///

/// ********* GEO ********* ///
var geo;
/// ********* --- ********* ///

/// ********* other ********* ///
var arDebugger;
var reticle;
var hudCanvas, hudBitmap, hudCamera, hudTexture, hudMaterial;
var planeGeometry, plane, hudScene;
/// ********* ----- ********* ///

init();

function init() {
    THREEAR.ARUtils.getARDisplay().then(function (display) {            
        if (display) {        
            vrFrameData = new VRFrameData();
            vrDisplay = display;        
            alert('ようこそARの世界へ！ v0.0616');
            initArSystem();
            initReticle();
            initDebugger();
            //initHud();        
            geo = new Geo();
            update();
        } else {        
            THREEAR.ARUtils.displayUnsupportedMessage();                                        
        }
    });            
}

function update() {
    updateArSystem();
    updateReticle();
    //updateHud();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

async function test(){
    alert('おしたお');    
    let pos = await geo.getPos();
    alert("output : " + pos.x + ", " + pos.y + ", " + pos.z);
}

document.onkeydown = function(e){    
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
                
                test();
                
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
    camera = new THREEAR.ARPerspectiveCamera(
                vrDisplay,
                60, //fov
                window.innerWidth / window.innerHeight,
                vrDisplay.depthNear,
                vrDisplay.depthFar
            );    
    vrControls = new THREE.VRControls(camera);    
    document.body.appendChild(renderer.domElement);
    
    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('touchstart', onClick, false);    
}
function updateArSystem() {
    renderer.clearColor();
    arView.render();    
    camera.updateProjectionMatrix();
    vrDisplay.getFrameData(vrFrameData);
    vrControls.update();
    renderer.clearDepth();    
    renderer.render(scene, camera);             
    curPos = vrFrameData.pose.position;    
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

/// ********* HUD ********* ///
function initHud() {
    let width  = window.innerWidth;
    let height = window.innerHeight;    
    hudCanvas  = document.createElement('canvas');
    hudCanvas.width  = width;
    hudCanvas.height = height;
    hudBitmap = hudCanvas.getContext('2d');
    hudBitmap.font = "Normal 30px Arial";
    hudBitmap.textAlign = 'center';
    hudBitmap.fillStyle = 'rgba(245, 245, 245, 0.9)';
    hudBitmap.fillText('Initializing...', width / 2, height / 2);
    hudCamera  = new THREE.OrthographicCamera(-width/2, width/2, height/2, -height/2, 0, 30);
    hudScene   = new THREE.Scene();
    hudTexture = new THREE.Texture(hudCanvas);
    hudTexture.needsUpdate = true;
    hudMaterial = new THREE.MeshBasicMaterial({map: hudTexture});
    hudMaterial.transparent = true; //重そう
    planeGeometry = new THREE.PlaneGeometry(width, height);
    plane = new THREE.Mesh(planeGeometry, hudMaterial);
    hudScene.add(plane);  
}
var counter = 0; //フレーム数(動作確認用)
function updateHud() {       
    hudBitmap.clearRect(0, 0, window.innerWidth, window.innerHeight);
    hudBitmap.fillText("counter : " + counter.toString(), window.innerWidth/2, window.innerHeight/2);
    hudTexture.needsUpdate = true;
    counter++;
    renderer.render(hudScene, hudCamera);
}
/// ********* ___ ********* ///