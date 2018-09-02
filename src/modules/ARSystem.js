/**
 * ARControlsは初期データの取得に，不定時間かかる．
 * オブジェクトの配置などはcallback関数以後に実行する．
 */
module.exports = ARSystem = function(scene, cam, callback){
    const self = this;

    // scene
    //     L nBasSys     (拡張世界と現実世界の角度の差異を吸収)
    //         L objectA  (現実世界の位置を基準に配置するオブジェクト)
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

    const awake = () => {
        scene.add(nBasSys);
        scene.add(dBasSys);
        dBasSys.add(cam);

        compass.StartWatchiHeading();
        gps.StartWatchiLatLng();

        // getBasHeading
        const intervalTime = 500;
        let   get = setInterval( () => {
            const heading = compass.GetHeading();

            if(heading !== null){
                console.log(`getBasHeading:${heading}`);

                bestCompassAcc = compass.GetAccuracy();
                nBasSys.rotation.y = heading;

                start();

                clearInterval(get);
            }
        }, intervalTime);

    };

    const start = async () => {
        const crd = await gps.AsyncGetLatLng();

        console.log(`lat:${crd.latitude}, lng:${crd.longitude}, acc:${crd.accuracy}`);

        bestGpsAcc = crd.accuracy;
        crdConv = new CrdConverter(crd);

        callback();
    };

    const deg2Rad   = (deg) => deg / 180.0 * Math.PI;
    const rad2Deg   = (rad) => rad * 180.0 / Math.PI;
    const ToSafeDeg = (deg) => deg < 0 ? deg + 360 : deg > 360 ? deg % 360 : deg;
    const getWorldRotation = (obj) => {
        const addRotation = (rot1, rot2) =>
            new THREE.Vector3(rot1.x + rot2.x, rot1.y + rot2.y, rot1.z + rot2.z);
        return (obj === null) ? new THREE.Vector3()
            : addRotation(obj.rotation, getWorldRotation(obj.parent));
    };

    /**
     * 基準となる角度の更新．
     * @param {Number} rawCompasHeadingDeg
     */
    const updateHeading = (rawCompasHeadingDeg) => {

        // nBasSys
        //     L cam (コンパスが取得するのは)

        console.log(`before: ${nBasSys.rotation.y}`);

        const deviceHeadingDeg = rad2Deg(getWorldRotation(cam).y);
        const compasHeadingDeg = ToSafeDeg(rawCompasHeadingDeg - deviceHeadingDeg);
        nBasSys.rotation.set(new Vector3(0, compasHeadingDeg, 0));

        console.log(`after: ${getWorldRotation(nBasSys.rotation).y}`);
    };

    /**
     * 角度の更新を行うべきか判断
     */
    const isNeedUpdateHeading = (acc) => acc <= bestCompassAcc

    /**
     * 基準となる位置の更新
     */
    const updatePosition = async (newLat, newLng) => {
        console.log(`更新前 ${crdConv.Pos2Str(dBasSys.position)}`);

        const gPos = await crdConv.AsyncLatLng2Poition(newLat, newLng);
        const aPos = cam.getWorldPosition();
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

        console.log(`更新後 ${crdConv.Pos2Str(dBasSys.position)}`);
    };

    /**
     * 基準となる位置の更新を行うべきか判断
     */
    const isNeedUpdatePosiotion = (acc) => acc <= bestGpsAcc;

    awake();

    /**
     * 基準となる角度の再計算を行う．
     * アプリの利用範囲内でのコンパスの測定結果は
     * 精度を無視して一定になるものと仮定する．
     */
    self.UpdateHeading = () => {
        const heading = compass.GetHeading();
        const acc     = compass.GetAccuracy();

        if(isNeedUpdateHeading(acc)){
            console.log("角度の更新が必要．");
            updateHeading(heading);
            bestCompassAcc = acc;
            console.log("角度の更新．");
        }else{
            console.log("角度の更新は不要．");
        }
    };

    /**
     * 基準となる位置の再計算を行う．
     * 長距離の移動に向かないarkitによる移動結果を
     * GPSによって補足された位置に移動させることで補正させる．
     */
    self.UpdatePosition = () => {
        const crd = gps.GetCrd();
        const acc = crd.accuracy;
        if(isNeedUpdatePosiotion(acc)){
            updatePosition(crd.latitude, crd.longitude);
            bestGpsAcc = acc;
            console.log("位置の更新．");
        }else{
            console.log("位置の更新は不要．");
        }
    };

    self.Update = () => {
        vrControls.update();
    };

    self.Add = (obj) => {
        nBasSys.add(obj);

        console.log("Add");
    };

    self.Add2LatLng = async (obj, lat, lng) => {
        const pos = await crdConv.AsyncLatLng2Poition(lat, lng);

        nBasSys.add(obj);
        obj.position = pos;

        console.log(`Add lat:${lat}, lng:${lng} -> ${crdConv.Pos2Str(pos)}`);
    };

}