/**
 * @author ttak0422 https://github.com/ttak0422
 */

module.exports = GeoBaseARControls = function(object){
    //呼び出されたときの端末の位置を(0, 0, 0)とし，
    //北を基準としたvrcontrolsの挙動を実現する
    const self = this;
    const isIOS = function(){
        const ua = navigator.userAgent;
        return  ua.indexOf("iPhone") >= 0 ||
                ua.indexOf("iPad")   >= 0;
    }
    let basHeading = -1.0;
    let curHeading = -1.0;
    let compassAcc = -1.0;

    window.addEventListener("deviceorientation", function(e) {
        if (typeof e.webkitCompassHeading !== "undefined"){
            curHeading = e.webkitCompassHeading;
            compassAcc = e.webkitCompassAccuracy;
        }
    });

    window.onload = function(){
        const checkIntervalTime = 100;
        const getBasHeading = this.setInterval(function(){
            if(curHeading !=- 1){
                basHeading = curHeading;
                clearInterval(getBasHeading);
                init();
            }
        }, checkIntervalTime);
    }

}