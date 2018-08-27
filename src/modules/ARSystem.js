/**
 * ARControlsは初期データの取得に，不定時間かかる．
 * オブジェクトの配置などはcallback関数以後に実行する．
 */
module.exports = ARSystem = function(scene, cam, callback){
    const self = this;

    // scene
    //     L nBasSys     (拡張世界と現実世界の角度の差異を吸収)
    //        L objectA  (現実世界の位置を基準に配置するオブジェクト)
    //          ...
    //     L dBasSys     (拡張世界と現実世界の位置の差異を吸収)
    //         L cam     (端末自身)
    //           object1 (端末の位置を基準に配置するオブジェクト)
    //           ...

    /**
     * 拡張世界と現実世界の角度の差異を吸収
     */
    const nBasSys = new THREE.Group();

    /**
     * 拡張世界と現実世界の位置の差異を吸収
     */
    const dBasSys = new THREE.Group();

    /**
     * arkitを用いたカメラの移動を行う．
     */
    const vrControls = new THREE.VRControls(cam);

    const compass = new Compass();
    const gps     = new Gps();
    let   crdConv = null;

    /**
     * コンパスの精度のベスト．<deg>
     */
    let bestCompassAcc = 180.0;

    /**
     * gpsの精度のベスト．<m>
     */
    let bestGpsAcc = 1000.0;

    awake();

    function awake(){
        scene.add(nBasSys);
        scene.add(dBasSys);
        dBasSys.add(cam);

        compass.StartWatchiHeading();
        gps.StartWatchiLatLng();

        // getBasHeading
        const intervalTime = 500;
        const get = this.setInterval(function(){
            const heading = compass.GetHeading();

            if(heading !== null){
                console.log(`getBasHeading:${heading}`);

                bestCompassAcc = compass.GetAccuracy();
                nBasSys.rotation.y = heading;

                start();

                clearInterval(get);
            }
        }, intervalTime);
    }

    async function start(){
        const crd = await gps.AsyncGetLatLng();

        console.log(`lat:${crd.latitude}, lng:${crd.longitude}, acc:${crd.accuracy}`);

        bestGpsAcc = crd.accuracy;
        crdConv = new CrdConverter(crd);

        callback();
    }

    /**
     * 基準となる角度の更新
     */
    function updateHeading(newHeading){
        // オイラー角var??????
        const basHeading = nBasSys.rotation.y;
        const diffHeading = basHeading - newHeading;

        nBasSys.rotation.y = diffHeading;
    }

    /**
     * 角度の更新を行うべきか判断
     */
    function isNeedUpdateHeading(acc){
        return acc <= bestCompassAcc;
    }

    /**
     * 基準となる位置の更新
     */
    async function updatePosition(newLat, newLng){
        const gPos = await crdConv.AsyncLatLng2Poition(newLat, newLng);
        const aPos = cam.position;
        const dPos = {
            x: gPos.x - aPos.x,
            y: gPos.y - aPos.y,
            z: gPos.z - aPos.z
        };

        dBasSys.position.set(
            dBasSys.position.x + dPos.x,
            dBasSys.position.y + dPos.y,
            dBasSys.position.z + dPos.z
        );
    }

    /**
     * 基準となる位置の更新を行うべきか判断
     */
    function isNeedUpdatePosiotion(acc){
        return acc <= bestGpsAcc;
    }

    self.UpdateHeading = function(){
        const heading = compass.GetHeading();
        const acc     = compass.GetAccuracy();

        if(isNeedUpdateHeading(acc)){
            updateHeading(heading);
            bestCompassAcc = acc;
            console.log("角度の更新．");
        }else{
            console.log("角度の更新は不要．");
        }
    }

    self.UpdatePosition = function(){
        const crd = gps.GetCrd();
        const acc = crd.accuracy;
        if(isNeedUpdatePosiotion(acc)){
            updatePosition(crd.latitude, crd.longitude);
            bestGpsAcc = acc;
            console.log("位置の更新．");
        }else{
            console.log("位置の更新は不要．");
        }
    }

    self.Update = function(){
        vrControls.update();
    }

    self.Add = function(obj){
        nBasSys.add(obj);

        console.log("Add");
    }

    self.Add2LatLng = async function(obj, lat, lng){
        const pos = await crdConv.AsyncLatLng2Poition(lat, lng);

        nBasSys.add(obj);
        obj.position = pos;

        console.log(`Add lat:${lat}, lng:${lng} -> ${crdConv.Pos2Str(pos)}`);
    }

}