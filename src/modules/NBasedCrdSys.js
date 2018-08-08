// importが必要なmodule
// import 'three/VRControls';
// import Geo from './Geo';
module.exports = NBasedCrdSys = function(scene, cam, callback){
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

    /**
     * 起動時の端末の向きと北とのズレ
     */
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

    function log(msg){
        console.log("[NBasedCrdSys] " + msg);
    }

    function pos2str(pos) {
        return `pos: ${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)}`;
    }

    self.updatePosition = async function(){

        log("UpdatePosition Start");

        // 起点位置情報を更新
        geo.updateBasPosition();

        // 起点位置情報をもとに位置を再計算
        for(let i = 0; i < northBasedCoordinateSystem.children.length; ++i){
            if(northBasedCoordinateSystem[i].lat && northBasedCoordinateSystem[i].lng){
                const pos = await geo.AsyncGetLatLng2Pos(
                    northBasedCoordinateSystem[i].lat,
                    northBasedCoordinateSystem[i].lng);
                northBasedCoordinateSystem[i].recalcPosition = pos;
            }
        }

        //TODO:一定時間による線形補間移動化
        for(let i = 0; i < northBasedCoordinateSystem.children.length; ++i){
            if(northBasedCoordinateSystem[i].recalcPosition)
                northBasedCoordinateSystem[i].position =
                    northBasedCoordinateSystem[i].recalcPosition;
        }

        log("UpdatePosition Finished");

    }

    self.Test = function(){
        alert("test");
        for(let i = 0; i < northBasedCoordinateSystem.children.length; ++i){
            alert(northBasedCoordinateSystem.children[i].name);
        }
    }

    self.update = function(){
        vrControls.update();
    }

    self.add = function(obj){
        northBasedCoordinateSystem.add(obj);
        log("Add");
    }

    self.add2LatLng = async function(obj, lat, lng){
        const pos  = await geo.AsyncGetLatLng2Pos(lat, lng);
        northBasedCoordinateSystem.add(obj);
        obj.position = pos;
        log(`Add2LatLng: (${lat}, ${lng}) -> ${pos2str(pos)}`);
        //オブジェクトの緯度経度情報(不変)
        obj.lat = lat;
        obj.lng = lng;
    }
}