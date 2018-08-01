// importが必要なmodule
// import 'three/VRControls';
// import Geo from './Geo';

module.exports = NBasedCrdSys = function(scene,cam,callback){
    const self = this;

    const vrControls = new THREE.VRControls(cam);
    /**
     * 北を基準をする座標系
     * 現実空間に配置するオブジェクト用
     */
    const northBasedCoordinateSystem  = new THREE.Group();
    /**
     * 起動時の端末の向きを基準とする座標系
     * カメラなどのオブジェクト用
     */
    const deviceBasedCoordinateSystem = new THREE.Group();
    let heading;
    const geo  = new Geo(init);

    function init(){
        scene.add(northBasedCoordinateSystem);
        scene.add(deviceBasedCoordinateSystem);
        deviceBasedCoordinateSystem.add(cam);
        heading = deg2Rad(geo.GetBasHeading());
        northBasedCoordinateSystem.rotation.y = heading;
        callback();
    }

    function deg2Rad(deg){
        return deg / 180 * Math.PI;
    }

    function pos2str(pos) {
        return 'pos: ' + pos.x.toFixed(2) + ', ' + pos.y.toFixed(2) + ', ' + pos.z.toFixed(2);
    }

    self.update = function(){
        vrControls.update();
    }

    self.add = function(obj){
        northBasedCoordinateSystem.add(obj);
    }

    self.add2LatLng = async function(obj, lat, lng){
        northBasedCoordinateSystem.add(obj);
        const pos = await geo.AsyncGetLatLng2Pos(lat, lng);
        alert(pos2str(pos));
        obj.position.set(pos.x, pos.y, pos.z);
    }
}