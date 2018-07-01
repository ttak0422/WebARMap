module.exports = Geo = function() {   
    const EARTH_R = 6378137.0;     
    
    let self = this;

    var watchId = null;
    var baseLat,baseLng;    
    var curLat,curLng;
    var counter = 0;
    
    //TODO: Promise -> async
    function checkReady4GPS(){
        return new Promise(function(resolve, reject){
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
        return new Promise(function(resolve, reject){
            navigator.geolocation.getCurrentPosition(
                function(pos){   
                    let crd = pos.coords; 
                    baseLat = crd.latitude;
                    baseLng = crd.longitude;                 
                    console.log("base position:" + baseLat.toString() + "," + baseLng.toString());
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
        return new Promise(function(resolve, reject){        
            watchId = navigator.geolocation.watchPosition(        
                function(pos){  
                    let crd = pos.coords;            
                    curLat = crd.latitude;
                    curLng = crd.longitude;  
                    console.log(counter + " : " + curLat + "," + curLng);                
                    counter++;   
                    resolve();             
                },
                function(err){ /* 時々errは起きるが問題はない */ },
                {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0
                }
            );      
            console.log("test : " + watchId);  
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
        let basePoint = await asyncLatLng2Merc(baseLat, baseLng);            
        let x = objPoint.x - basePoint.x;
        let y = 1.0 // 適当
        let z = objPoint.y - basePoint.y;        
        return ({x : x, y : y, z : z});
    }
    function init(){
        //TODO:fix 起動と同時にGPSにアクセスするのはだめ
        console.log("--- init Geo ---");
        checkReady4GPS()
        .then(getBaseLatLng, function(){ alert('getBaseLatLng error.') })
        .then(startWatchPos, function(){ alert('startWatchPos error.') })
        .then(function(){ console.log("Geo System is Ready...."); });
    }
    
    //--- new ----// 
    init();
    //--- --- ----//

    self.getPos = async function(){        
        let pos = await asyncLatLng2Pos(curLat, curLng);
        console.log("input  : " + curLat + ", " + curLng);        
        console.log("output : " + pos.x + ", " + pos.y + ", " + pos.z);        
        return pos;
    };    

    self.debugPos = async function(lat, lng){        
        let pos = await asyncLatLng2Pos(lat, lng);
        console.log("input  : " + lat + ", " + lng);        
        console.log("output : " + pos.x + ", " + pos.y + ", " + pos.z);        
        return pos;
    };    

}