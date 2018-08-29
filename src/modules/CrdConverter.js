module.exports = CrdConverter = (crd) => {
    const self = this;

    const EARTH_R = 6378137.0;

    /**
     * 座標変換の計算の起点となる座標．
     */
    const basCrd = crd;

    /**
     * basCrdの緯度経度情報をもとに，メルカトル座標に変換した座標．
     * 計算される座標はこの座標との相対的な座標となる．
     */
    let basPoint = null;

    const asyncDeg2Rad = async (deg) => {
        return deg / 180.0 * Math.PI;
    };

    const asyncLatLng2Merc = async (latDeg, lngDeg) => {
        const latRad = await asyncDeg2Rad(latDeg);
        const lngRad = await asyncDeg2Rad(lngDeg);
        return ({
            x : EARTH_R * lngRad,
            y : EARTH_R * latRad
        });
    };

    self.AsyncLatLng2Poition = async (latDeg, lngDeg) => {
        const objPoint = await asyncLatLng2Merc(latDeg, lngDeg);
        // TODO: ダサくない書き方
        if(basPoint === null) basPoint = await asyncLatLng2Merc(basCrd.latitude, basCrd.longitude);
        return ({
            x : objPoint.x - basPoint.x,
            y : 0, // 高さは適当
            z : (objPoint.y - basPoint.y) * (-1)
        });
    };

    self.Pos2Str = (pos) => {
        return `x: ${pos.x.toFixed(2)}, y: ${pos.y.toFixed(2)}, z:${pos.z.toFixed(2)}`;
    };

};