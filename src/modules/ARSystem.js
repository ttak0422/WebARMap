/**
 * ARControlsは初期データの取得に，不定時間かかる．
 * オブジェクトの配置などはcallback関数以後に実行する．
 */
module.exports = ARSystem = function(scene, cam, callback){
    const self = this;

    // *** Debug ***
    const cubeSize = 0.3;
    const geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
    const material = new THREE.MeshNormalMaterial();
    const cube     = new THREE.Mesh(geometry, material);

    const dataRef    = firebase.database().ref('data');
    const storageRef = firebase.storage().ref();

    // TODO: firebase関連をモジュール化
    // const dataRef    = firebase.database().ref('data');
    // const storageRef = firebase.storage().ref();

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

    const deg2Rad   = (deg) => deg / 180.0 * Math.PI;
    const rad2Deg   = (rad) => rad * 180.0 / Math.PI;
    const ToSafeDeg = (deg) => deg < 0 ? deg + 360 : deg > 360 ? deg % 360 : deg;
    const getWorldRotation = (obj) => {
        const addRotation = (rot1, rot2) =>
            new THREE.Vector3(rot1.x + rot2.x, rot1.y + rot2.y, rot1.z + rot2.z);
        return (obj === null || obj === undefined) ? new THREE.Vector3()
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
        nBasSys.rotation.set(new THREE.Vector3(0, compasHeadingDeg, 0));

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

    const createText2D = (text, params) => {
        // TODO: フォントサイズとARとのサイズの対応関係について調査
        // TODO: ほしいテキストの大きさは物理的な距離によっても変化する．

        // unityと同様に文字がにじむので，強大なcanvasを作成．その後
        // それを縮小したspriteを生成する

        // 座標による計算のみを行っているので基本的にy座標は0になる．相対的に見て高い位置にある方が見やすい．
        const addHeight = 1.5;
        const x = params.x || 0;
        const y = (params.y || 0) + addHeight;
        const z = params.z || 0;
        const scale     = params.scale     || 2;
        const textSize  = params.textSize  || 50;
        const bgMargine = params.bgMargine || 15;
        const textColor = params.textColor || '#ffffff';
        const bgColor   = params.bgColor   || '#000000';

        console.log(`x:${x} y:${y} z:${z} textSize:${textSize} textColor:${textColor} bgColor:${bgColor} bgMargine:${bgMargine}`);

        // キャンバスの作成
        const canvas     = document.createElement('canvas');
        const context    = canvas.getContext('2d');
        const lines      = text.split("\n");
        const lineHeight = 1.1618; // 経験と実績から...
        const lineWidth  = Math.max.apply(null, lines.map(x => context.measureText(x).width));
        // const charInLine = Math.max.apply(null, lines.map(x => x.length));

        console.log(`canvas:${canvas} context:${context} line:${lines} lineHeight:${lineHeight} lineWidth:${lineWidth}`);
        context.font = textSize + "px Arial";

        const canvasWidth  = lineWidth + bgMargine * 2;
        const canvasHeight = textSize * lines.length * lineHeight + bgMargine * 2;

        console.log(`canvasWidth:${canvasWidth} canvasHeight:${canvasHeight}`);

        canvas.width        = canvasWidth;
        canvas.height       = canvasHeight;
        context.globalAlpha = 0.5;
        context.fillStyle   = bgColor;
        context.fillRect(0, 0, canvasWidth, canvasHeight);
        console.log(`contextRect x:${0} y:${0} w:${canvasWidth} h:${canvasHeight}`);

        // 文字の描写開始
        context.beginPath();
        // フォントサイズとスタイルの定義
        context.font = textSize + "px Arial";
        // 文字の表示位置の指定
        context.textAlign    = "left";
        context.textBaseline = "middle";
        // 文字の色
        context.fillStyle   = textColor;
        // 文字の透明度
        context.globalAlpha = 1;

        // 1行ずつ描画
        for(let i = 0; i < lines.length; i++){
            const line = lines[i];
            const addY = textSize / 2 + textSize * lineHeight * i;
            context.fillText(line, bgMargine, addY + bgMargine);
            context.fill();
        }
        console.log(`canvasSize w:${canvas.width} h:${canvas.height}`);

        // テクスチャの作成
        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        texture.minFilter   = THREE.LinearFilter;

        // リサイズの大きさを求める
        const spriteWidth  = canvas.width  / 100 * scale;
        const spriteHeight = canvas.height / 100 * scale;
        const material     = new THREE.SpriteMaterial({map: texture});
        const sprite       = new THREE.Sprite(material);
        sprite.scale.x = spriteWidth;
        sprite.scale.y = spriteHeight;
        sprite.position.set(x, y, z);
        // scene.add(sprite);
        nBasSys.add(sprite);
        // self.Add2LatLng(cube, lat, lng);
        console.log("add 3d text");
        console.log(`@sprite pos: ${crdConv.Pos2Str(sprite.getWorldPosition())}`);
        console.log(`@cube pos: ${crdConv.Pos2Str(cube.getWorldPosition())}`);
    }

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
        const crd = await gps.AsyncGetLatLng().catch(msg => alert(msg));

        console.log(`lat:${crd.latitude}, lng:${crd.longitude}, acc:${crd.accuracy}`);

        bestGpsAcc = crd.accuracy;
        crdConv = new CrdConverter(crd);

        // firebase
        dataRef.on('child_added', async (snapshot) => {
            const data = snapshot.val();
            const lat = data.lat;
            const lng = data.lng;
            const pos = await crdConv.AsyncLatLng2Poition(lat, lng);

            // self.Add2LatLng(cube, lat, lng);

            switch(data.valueType){
                case "text":
                    // TODO: add2latlngに切り替え
                    createText2D(data.value,
                        {x:pos.x, y:0, z:pos.z, scale:1},
                        scene);
                    console.log("call");
                    break;
            }
            console.log(JSON.stringify(data, null , "\t"));
        });

        callback();
    };

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