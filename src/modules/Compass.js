module.exports = Compass = function(){
    const self = this;

    const ua = navigator.userAgent;

    /**
     * ブラウザ上でコンパスを利用できるのが現状iOSのみであるため
     * iOSのみをサポートすることにする
     */
    const isIOS = ua.indexOf("iPhone") >= 0 || ua.indexOf("iPad")   >= 0;

    if(!isIOS){
        // TODO: そういったページを用意
        alert("非サポート端末です");
    }

    /**
     * コンパスによる最新の測定結果．
     */
    let heading = null;

    /**
     * コンパスによる最新の測定結果の精度． +- 0 .. 180
     */
    let accuracy = 180.0;

    /**
     * null   -> null,
     * number -> number
     * @param {Number} deg
     */
    function convertDeg(deg){
        return deg < 0 ? deg + 360 : deg;
    }

    self.StartWatchiHeading = function(){
        window.addEventListener("deviceorientation", function(e) {
            if (typeof e.webkitCompassHeading !== "undefined"){
                heading  = e.webkitCompassHeading;
                accuracy = e.webkitCompassAccuracy;
            }
        });
    }

    self.GetHeading = function(){
        return convertDeg(heading);
    }

    self.GetAccuracy = function(){
        return accuracy;
    }

}