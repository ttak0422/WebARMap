module.exports = Geo = function() {   
    const EARTH_R = 6378137.0;     
    
    let self = this;

    var watchId = null;
    var baseLat,baseLng;
    var baseX,baseY,baseZ;
    var curLat,curLng;
    var counter = 0;
    //TODO: Promise -> async
    function checkReady4GPS(){
        return new Promise(function(resolve, reject){
            if(navigator.geolocation){
                console.log("your device is ready for this tracking!");
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
                    console.log("base position:", baseLat, baseLng);
                    resolve();
                },
                function(err){ 
                    alert('error!'); 
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

    async function asyncDeg2rad(deg){
        return deg / 180.0 * Math.PI;
    }    
    async function asyncLatLng2Merc(lat, lng){
        let latRad = await asyncDeg2rad(lat);
        let lngRad = await asyncDeg2rad(lng);
        let xM = EARTH_R * lngRad;
        let yM = EARTH_R * Math.log((Math.sin(latRad) + 1) / Math.cos(latRad));        
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
        checkReady4GPS()
        .then(getBaseLatLng, function(){ alert('getBaseLatLng') })
        .then(startWatchPos, function(){ alert('startWatchPos') })
        .then(function(){ console.log("Geo System is Ready...."); });
    }
    
    //--- new ----// 
    init();
    //--- --- ----//

    self.getPos = async function(lat, lng){
        console.log("input : " + lat + ", " + lng);
        let pos = await asyncLatLng2Pos(lat, lng);
        console.log("output1 : " + pos.x + ", " + pos.y + ", " + pos.z);        
        return tmp;
    };    
}