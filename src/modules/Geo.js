module.exports = Geo = function(callback){
    const self = this;

    /**
     * 以後の処理を行うにあたって，センサで初期値を取得している必要がある
     * 処理を呼び出すものはcallback以後に
     */
    const cb = callback;

    let watchId   = null;

    let basCrd;
    let curCrd;
    let basPoint = null;
    let basHeading = -1;
    let curHeading = -1;
    let compassAccracy = -1;

    const timeOut = 8000;
    const errorMessage = {
        0: "原因不明のエラーが発生しました",
        1: "位置情報の利用が許可されていません",
        2: "現在位置が取得できませんでした",
        3: "タイムアウトになりました"
    };
    const gpsOption = {
        enableHighAccuracy : true,     //高精度な情報を要求
        timeout            : timeOut,
        maximumAge         : 0         //測定結果のキャッシュ時間
    }

    const ua = navigator.userAgent;
    /**
     * ブラウザ上でコンパスを利用できるのが現状iOSのみであるため
     * iOSのみをサポートすることにする
     */
    const isIOS =
        ua.indexOf("iPhone") >= 0 ||
        ua.indexOf("iPad")   >= 0;

    const EARTH_R = 6378137.0;

    function log(msg){
        console.log("[Geo] " + msg);
    }

    window.addEventListener("deviceorientation", function(e) {
        if (typeof e.webkitCompassHeading !== "undefined"){
            curHeading     = e.webkitCompassHeading;
            compassAccracy = e.webkitCompassAccuracy;
        }
    });

    //TODO:ボタンなどによる操作に切り替え
    /**
     * センサのキャリブレーション及び，初期処理を行う．ユーザに端末を静止させるよう支持．
     * 0.5秒ごとに方角が検出できているか確認
     * 確認出来次第，次のステップへ移行
     */
    window.onload = function(){
        log("onload");
        const getBasHeading = this.setInterval(function(){
            if(curHeading !=- 1){
                basHeading = curHeading;
                log("get basHeading : " + basHeading);
                clearInterval(getBasHeading);
                init();
            }
        }, 500);
    }

    async function init(){
        if(isIOS){
            log("your device is iOS");
            basCrd   = await getLatLng().catch(msg => alert(`get base position error : ${msg}`));
            log(`basCrd: ${basCrd.latitude}, ${basCrd.longitude}`);
            curCrd   = basCrd;
            startWatchLatLng();
            cb();
        }else{
            alert('iOS端末のみをサポートします');
        }
    }

    function getLatLng(){
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                function(pos){ resolve(pos.coords); },
                function(err){ reject(errorMessage[err.code]); },
                gpsOption
            );
        });
    }

    function startWatchLatLng(){
        watchId = navigator.geolocation.watchPosition(
            function(pos){ curCrd = pos.coords; },
            function(err){ /* 無視 */ },
            gpsOption
        );
    }

    function stopWatchLatLng(){
        geolocation.clearWatch(watchId);
    }

    /**
     * 初回起動時のキャリブレーションと同様に，ユーザーに端末を静止させるように指示を出すべき．
     */
    function updateBasPosition(){
        basCrd     = curCrd;
        basHeading = curHeading;
        basPoint   = null;
    }

    // 連打で動作が重くなるようであれば対応を考える
    // /**
    //  * 計算に利用する起点位置情報が最新のものであるか
    //  */
    // function isUpdated(){
    //     return basCrd === curCrd;
    // }

    async function asyncDeg2rad(deg){
        return deg / 180.0 * Math.PI;
    }

    async function asyncLatLng2Merc(latDeg, lngDeg){
        const latRad = await asyncDeg2rad(latDeg);
        const lngRad = await asyncDeg2rad(lngDeg);
        const yM = EARTH_R * latRad;
        const xM = EARTH_R * lngRad;
        return ({x : xM, y : yM});
    }

    async function asyncLatLng2Pos(latDeg, lngDeg){
        const objPoint = await asyncLatLng2Merc(latDeg, lngDeg);
        if(basPoint === null)
            basPoint = await asyncLatLng2Merc(basCrd.latitude, basCrd.longitude);
        const x = objPoint.x - basPoint.x;
        const y = 0 // 適当
        const z = (objPoint.y - basPoint.y) * (-1);
        return ({x : x, y : y, z : z});
    }

    function getBasHeading(){
        return basHeading < 0 ? basHeading + 360 : basHeading;
    }

    self.AsyncGetBasPos = async function(){
        return await asyncLatLng2Pos(basCrd.latitude, basCrd.longitude);
    }

    self.AsyncGetLatLng2Pos = async function(lat, lng){
        return await asyncLatLng2Pos(lat, lng);
    }

    self.GetBasHeading = function(){
        return getBasHeading();
    }

    self.GetHeading = function(){
        return curHeading;
    }

    self.GetHeadingAcc = function(){
        return compassAccracy;
    }

    self.UpdateBasPosition = function(){
        updateBasPosition();
    }

}