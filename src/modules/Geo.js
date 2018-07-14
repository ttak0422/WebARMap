const EARTH_R = 6378137.0;
const ua = navigator.userAgent;

class Geo {
    //TODO:コールバック地獄を回避したい
    //コンストラクタの処理に時間がかかる
    constructor(callback){
        console.log("called");
        this.isIOS =
            ua.indexOf("iPhone") >= 0 ||
            ua.indexOf("iPad")   >= 0;
        this.watchId = null;
        this.basCrd;
        this.curCrd;
        this.counter = 0;
        this.compassHeading = 0;
        this.compassAccracy = 0;
        this.init(callback);
    }

    async init(callback){
        console.log("initting geo");
        if(this.isIOS || true){
            this.basCrd = await this.getBaseLatLng().catch(msg => alert("get base position error : " + msg));
            this.curCrd = this.basCrd;
            window.addEventListener("deviceorientation", function(e) {
                if (typeof e.webkitCompassHeading !== "undefined") {
                    this.compassHeading = e.webkitCompassHeading;
                    this.compassAccracy = e.webkitCompassAccuracy;
                }
            });
            console.log("geo is ready");
            console.log(
                this.basCrd.latitude + ", " + this.basCrd.longitude
            );
            callback();
        }else{
            alert('iOS端末のみをサポートします');
        }
    }

    getBaseLatLng(){
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                function(pos){
                    resolve(pos.coords);
                },
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

    startWatchPos(){
        watchId = navigator.geolocation.watchPosition(
            function(pos){
                this.curCrd = pos.coords;
                this.counter++;
                console.log(this.counter + " : " + this.curCrd.latitude + "," + this.curCrd.longitude);

            },
            function(err){ /* 時々errは起きるが問題はない */ },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
        console.log("startWatch : " + this.watchId);
    }

    stopWatchPos(){
        geolocation.clearWatch(this.watchId);
    }

    async asyncDeg2rad(deg){
        return deg / 180.0 * Math.PI;
    }

    async asyncLatLng2Merc(lat, lng){
        const latRad = await this.asyncDeg2rad(lat);
        const lngRad = await this.asyncDeg2rad(lng);
        const yM = EARTH_R * latRad;
        const xM = EARTH_R * lngRad;
        return ({x : xM, y : yM});
    }

    async asyncLatLng2Pos(lat, lng){
        const objPoint = await this.asyncLatLng2Merc(lat, lng);
        const basPoint = await this.asyncLatLng2Merc(this.basCrd.latitude, this.basCrd.longitude);
        const x = objPoint.x - basPoint.x;
        const y = 1.0 // 適当
        const z = objPoint.y - basPoint.y;
        return ({x : x, y : y, z : z});
    }

    async asyncGetBasPos(){
        return await this.asyncLatLng2Pos(this.basCrd.latitude, this.basCrd.longitude);
    }

    async asyncGetCurPos(){
        return await this.asyncLatLng2Pos(this.curCrd.latitude, this.curCrd.longitude);
    };

    get getCurHeading(){
        return this.curCrd && this.curCrd.heading ? this.curCrd.heading : -1;
    }

    get getCounter(){
        return this.counter;
    }

    get getHeading(){
        return this.compassHeading;
    }

    get getHeadingAcc(){
        return this.compassAccracy;
    }

    get showHeading(){
        return parseInt("Heading: " + this.compassHeading).toString() + " Acc: " + parseInt(this.compassAccracy).toString();
    }

}

export default Geo;