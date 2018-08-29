module.exports = Gps = () => {
    const self = this;

    /**
     * 継続的な位置情報の更新を行うnavigatorのid
     */
    let watchId = null;

    /**
     * gpsによる最新の測定結果．
     */
    let crd = null;

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
    };

    /**
     * 現在の位置を取得して，それを返す．
     */
    self.AsyncGetLatLng = () => {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    crd = pos.coords;
                    resolve(crd);
                },
                (err) => { reject(errorMessage[err.code]); },
                gpsOption
            );
        });
    };

    /**
     * 最新の位置情報を返す．
     */
    self.GetCrd = () => crd;

    self.StartWatchiLatLng = () => {
        watchId = navigator.geolocation.watchPosition(
            (pos) => { crd = pos.coords; },
            (err) => { /* 無視 */ },
            gpsOption
        );
    };

    self.StopWatchiLatLng = () => geolocation.clearWatchi(watchId);

};