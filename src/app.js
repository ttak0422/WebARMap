import 'three/VRControls';


/// ********* AR ********* ///
var vrFrameData,vrDisplay, vrControls, arView; 
var canvas, camera, scene, renderer, reticle;
/// ********* -- ********* ///


/// ********* other ********* ///
var arDebugger;
var reticle;

/// ********* ----- ********* ///


THREEAR.ARUtils.getARDisplay().then(function (display) {
    if (display) {
        vrFrameData = new VRFrameData();
        vrDisplay = display;
        init();        
    } else {        
        THREEAR.ARUtils.displayUnsupportedMessage();
    }
});


function init() {
    initArSystem();
    initReticle();
    initDebugger();
    update();
}


function update() {
    updateArSystem();
    updateReticle();
}


function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}


function initArSystem() {
    renderer = new THREE.WebGLRenderer({alpha: true});
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.autoClear = false;    
    scene  = new THREE.Scene();
    arView = new THREEAR.ARView(vrDisplay, renderer);
    camera = new THREEAR.ARPerspectiveCamera(
                vrDisplay,
                60, //fov
                window.innerWidth / window.innerHeight,
                vrDisplay.depthNear,
                vrDisplay.depthFar
            );    
    vrControls = new THREE.VRControls(camera);    
    canvas = renderer.domElement;
    document.body.appendChild(canvas);    
}


function updateArSystem() {
    camera.updateProjectionMatrix();
    vrDisplay.getFrameData(vrFrameData);
    vrControls.update();
    arView.render();    
    renderer.clearDepth();    
    renderer.render(scene, camera);
    vrDisplay.requestAnimationFrame(update);
}

function initDebugger() {
    arDebugger = new THREEAR.ARDebug(vrDisplay);
    document.body.appendChild(arDebugger.getElement());
}

function initReticle() { 
    reticle = new THREEAR.ARReticle(vrDisplay, 0.03, 0.04, 0xff0077, 0.25); 
    scene.add(reticle);
}

function updateReticle() { 
    reticle.update(0.5, 0.5); 
}