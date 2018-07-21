module.exports = Geo = function(callback){

    const self = this;
    const cb = callback;
    const ua = navigator.userAgent;
    const isIOS =
        ua.indexOf("iPhone") >= 0 ||
        ua.indexOf("iPad")   >= 0;
    const EARTH_R = 6378137.0;

    var watchId = null;
    var basCrd;
    var curCrd;
    var basHeading = -1;
    var curHeading = -1;
    var compassAccracy = -1;

    window.addEventListener("deviceorientation", function(e) {
        if (typeof e.webkitCompassHeading !== "undefined"){
            curHeading = e.webkitCompassHeading;
            compassAccracy = e.webkitCompassAccuracy;
        }
    });

    window.onload = function(){
        //0.5秒ごとに方角が検出できているか確認
        //大方一発目で認識できるはず
        const getBasHeading = this.setInterval(function(){
            if(curHeading !=- 1){
                basHeading = curHeading;
                clearInterval(getBasHeading);
                init();
            }
        }, 500);
    }

    async function init(){
        if(isIOS){
            basCrd = await getBasLatLng().catch(msg => alert("get base position error : " + msg));
            curCrd = basCrd;
            cb();
        }else{
            alert('iOS端末のみをサポートします');
        }
    }

    function getBasLatLng(){
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                function(pos){ resolve(pos.coords); },
                function(err){
                    switch(err.code) {
                        case 1: reject("位置情報の利用が許可されていません");
                        case 2: reject("現在位置が取得できませんでした");
                        case 3: reject("タイムアウトになりました");
                        default:reject("その他のエラー(エラーコード:"+error.code+")");
                    }
                }
            );
        });
    }

    function startWatchPos(){
        watchId = navigator.geolocation.watchPosition(
            function(pos){ curCrd = pos.coords; },
            function(err){ /* 時々errは起きるが問題はない */ },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
    }

    function stopWatchPos(){
        geolocation.clearWatch(watchId);
    }

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
        const basPoint = await asyncLatLng2Merc(basCrd.latitude, basCrd.longitude);
        const x = objPoint.x - basPoint.x;
        const y = 1.0 // 適当
        const z = objPoint.y - basPoint.y;
        return ({x : x, y : y, z : z});
    }

    function getBasHeading(){
        return basHeading < 0 ? basHeading + 360 : basHeading;
    }

    self.AsyncGetBasPos = async function(){
        return await asyncLatLng2Pos(basCrd.latitude, basCrd.longitude);
    }

    self.AsyncGetCurPos = async function(){
        return await asyncLatLng2Pos(curCrd.latitude, curCrd.longitude);
    }

    self.AsyncGetLatLng2Pos = async function(lat, lng){
        return await asyncLatLng2Pos(lat, lng);
    }

    self.GetCurHeading = function(){
        return curCrd && curCrd.heading ? curCrd.heading : -1;
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

    self.GetDiffFromNorth = function(){
        return getBasHeading();
    }

}