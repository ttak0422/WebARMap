module.exports = Geo = function() {   
    const EARTH_R = 6378137.0;    
    
    //
    var alpha = -1;
    var beta  = -1;
    var gamma = -1;
    //

    let self = this;

    var watchId = null;
    var basCrd;
    var curCrd;        
    var counter = 0;
    
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
        let latRad = await asyncDeg2rad(lat);
        let lngRad = await asyncDeg2rad(lng);
        let yM = EARTH_R * latRad;
        let xM = EARTH_R * lngRad;        
        return ({x : xM, y : yM});
    }
    async function asyncLatLng2Pos(lat, lng){        
        let objPoint  = await asyncLatLng2Merc(lat, lng);
        let basPoint = await asyncLatLng2Merc(basCrd.latitude, basCrd.longitude);            
        let x = objPoint.x - basPoint.x;
        let y = 1.0 // 適当
        let z = objPoint.y - basPoint.y;        
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
                alpha = e.alpha;
                beta  = e.beta;
                gamma = e.gamma;
            }, true);          
            alert("Geo System is Ready!");            
        });
    }

    //--- new ----//     
    init();
    //--- --- ----//

    self.getOffsetPos = async function(){
        let pos = await asyncLatLng2Pos(basCrd.latitude, bas.longitude);
        console.log("input  : " + basCrd.latitude + ", " + basCrd.longitude);
        console.log("output : " + pos.x + ", " + pos.y + ", " + pos.z);
        return pos;
    }

    self.getCurPos = async function(){        
        let pos = await asyncLatLng2Pos(curCrd.latitude, curCrd.longitude);
        console.log("input  : " + curCrd.latitude + ", " + curCrd.longitude);        
        console.log("output : " + pos.x + ", " + pos.y + ", " + pos.z);        
        return pos;
    };    

    self.debugPos = async function(lat, lng){        
        let pos = await asyncLatLng2Pos(lat, lng);
        console.log("input  : " + lat + ", " + lng);        
        console.log("output : " + pos.x + ", " + pos.y + ", " + pos.z);        
        return pos;
    };

    self.getCurHeading = function(){
        return curCrd && curCrd.heading ? curCrd.heading : -1;
    }

    self.getCounter = function(){
        return counter;
    }

    self.getHeading = function(){
        //http://w3c.github.io/deviceorientation/spec-source-orientation.html#worked-example
        var degtorad = Math.PI / 180; // Degree-to-Radian conversion

        var _x = beta  ? beta  * degtorad : 0; // beta value
        var _y = gamma ? gamma * degtorad : 0; // gamma value
        var _z = alpha ? alpha * degtorad : 0; // alpha value

        var cX = Math.cos(_x);
        var cY = Math.cos(_y);
        var cZ = Math.cos(_z);
        var sX = Math.sin(_x);
        var sY = Math.sin(_y);
        var sZ = Math.sin(_z);

        // Calculate Vx and Vy components
        var Vx = -cZ * sY - sZ * sX * cY;
        var Vy = -sZ * sY + cZ * sX * cY;

        // Calculate compass heading
        var compassHeading = Math.atan(Vx / Vy);

        // Convert compass heading to use whole unit circle
        if (Vy < 0) {
        compassHeading += Math.PI;
        } else if (Vx < 0) {
        compassHeading += 2 * Math.PI;
        }

        return parseInt(compassHeading * ( 180 / Math.PI )); // Compass Heading (in degrees)
    }    
    
}