module.exports = Geo = function() {   
    const EARTH_R = 6378137.0;    
            
    let self = this;

    var watchId = null;
    var basCrd;    
    var curCrd;
    var basPos;
    var counter = 0;
    var compassHeading = 0;
    var compassAccracy = 0;


    //TODO: Promise -> async
    function checkReady4GPS(){
        return new Promise((resolve, reject) => {
            if(navigator.geolocation){
                console.log("your device is ready for gps tracking!");
                resolve();
            }else{
                alert('not suppoered!');
                reject();
            }
        });        
    }

    function getBaseLatLng() {    
        return new Promise((resolve, reject) => {     
            navigator.geolocation.getCurrentPosition(
                function(pos){   
                    basCrd = pos.coords;  
                    resolve();
                },
                function(err){ 
                    switch(err.code) {
                        case 1: //PERMISSION_DENIED
                            alert("位置情報の利用が許可されていません");
                            break;
                        case 2: //POSITION_UNAVAILABLE
                            alert("現在位置が取得できませんでした");
                            break;
                        case 3: //TIMEOUT
                            alert("タイムアウトになりました");
                            break;
                        default:
                            alert("その他のエラー(エラーコード:"+error.code+")");
                            break;
                    }
                    reject();                    
                }            
            );
        });
    }    

    function startWatchPos(){     
        return new Promise((resolve, reject) => {       
            watchId = navigator.geolocation.watchPosition(        
                function(pos){  
                    curCrd = pos.coords;             
                    counter++;   
                    console.log(counter + " : " + curCrd.latitude + "," + curCrd.longitude);    
                    resolve();                                        
                },
                function(err){ /* 時々errは起きるが問題はない */ },
                {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0
                }
            );      
            console.log("startWatch : " + watchId);  
        });
    }
    
    function stopWatchPos(){        
        geolocation.clearWatch(watchId);
    }

    async function asyncDeg2rad(deg){ return deg / 180.0 * Math.PI; }    
    async function asyncLatLng2Merc(lat, lng){
        const latRad = await asyncDeg2rad(lat);
        const lngRad = await asyncDeg2rad(lng);
        const yM = EARTH_R * latRad;
        const xM = EARTH_R * lngRad;        
        return ({x : xM, y : yM});
    }
    async function asyncLatLng2Pos(lat, lng){        
        const objPoint = await asyncLatLng2Merc(lat, lng);
        const basPoint = await asyncLatLng2Merc(basCrd.latitude, basCrd.longitude);            
        const x = objPoint.x - basPoint.x;
        const y = 1.0 // 適当
        const z = objPoint.y - basPoint.y;        
        return ({x : x, y : y, z : z});
    }
    function init(){
        //TODO:fix 起動と同時にGPSにアクセスするのはだめ
        // console.log("--- init Geo ---");
        checkReady4GPS()
        .then(getBaseLatLng, function(){ alert('getBaseLatLng error.') })
        .then(startWatchPos, function(){ alert('startWatchPos error.') })
        .then(function(){ 
            window.addEventListener("deviceorientation", function(e) {
                if (typeof e.webkitCompassHeading !== "undefined") {
                    compassHeading = e.webkitCompassHeading;
                    compassAccracy = e.webkitCompassAccuracy;
                } 
            });          
            alert("Geo System is Ready!");            
        });
    }

    //--- new ----//     
    init();
    //--- --- ----//

    self.getOffsetPos = async function(){
        const pos = await asyncLatLng2Pos(basCrd.latitude, bas.longitude);
        console.log("input  : " + basCrd.latitude + ", " + basCrd.longitude);
        console.log("output : " + pos.x + ", " + pos.y + ", " + pos.z);
        return pos;
    }

    self.getCurPos = async function(){        
        const pos = await asyncLatLng2Pos(curCrd.latitude, curCrd.longitude);
        console.log("input  : " + curCrd.latitude + ", " + curCrd.longitude);        
        console.log("output : " + pos.x + ", " + pos.y + ", " + pos.z);        
        return pos;
    };    

    self.debugPos = async function(lat, lng){        
        const pos = await asyncLatLng2Pos(lat, lng);
        console.log("input  : " + lat + ", " + lng);        
        console.log("output : " + pos.x + ", " + pos.y + ", " + pos.z);        
        return pos;
    };

    self.getCurHeading = function(){
        //by gps
        return curCrd && curCrd.heading ? curCrd.heading : -1;
    }

    self.getCounter = function(){
        return counter;
    }

    self.getHeading = function(){
        return parseInt(compassHeading).toString() + parseInt(compassAccracy).toString();
    }    

}