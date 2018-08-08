/**
 * 簡単なデバッグ用に画面中央にテキストを表示するだけ
 */
module.exports = SimpleHud = function(renderer){
    const self = this;
    let width  = window.innerWidth;
    let height = window.innerHeight;
    let posX   = width / 2;
    let posY   = height / 2;
    const hudCanvas     = document.createElement('canvas');
    const hudBitmap     = hudCanvas.getContext('2d');
    const hudCamera     = new THREE.OrthographicCamera(-posX, posX, posY, -posY, 0, 30);
    const hudScene      = new THREE.Scene();
    const hudTexture    = new THREE.Texture(hudCanvas);
    const hudMaterial   = new THREE.MeshBasicMaterial({map: hudTexture});
    const planeGeometry = new THREE.PlaneGeometry(width, height);
    const plane         = new THREE.Mesh(planeGeometry, hudMaterial);
    hudCanvas.width  = width;
    hudCanvas.height = height;
    hudBitmap.font   = "Normal 30px Arial";
    hudBitmap.textAlign = 'center';
    hudBitmap.fillStyle = 'rgba(245, 245, 245, 0.9)';
    hudBitmap.fillText('Initializing...', posX, posY);
    hudTexture.needsUpdate  = true;
    hudMaterial.transparent = true;
    hudScene.add(plane);

    window.addEventListener('resize', onWindowResize)

    self.update = function(msg){
        hudBitmap.clearRect(0, 0, width, height);
        hudBitmap.fillText(msg, posX, posY);
        hudTexture.needsUpdate = true;
        renderer.render(hudScene, hudCamera, false);
    }

    function onWindowResize() {
        self.height = window.innerHeight
        self.width  = window.innerWidth;
        self.posY = height / 2;
        self.posX = width / 2;
        hudCanvas.width  = width;
        hudCanvas.height = height;
    }

}