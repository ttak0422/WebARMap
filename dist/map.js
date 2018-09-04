// add api key
mapfit.apikey = "591dccc4e499ca0001a4c6a447d9bf979df9487f845e5fc4be7189c1";

// draw map
const map = mapfit.MapView('mapfit', {theme: 'day'}); // 'day','night','grayscale'
let myLatLngMarker;     // 自分の位置に立てるマーカー


// gpsで正しく受信できた時に実行する関数
const locationUpdate = (position) => {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    const pos = mapfit.LatLng([lat, lng]);

    if (myLatLngMarker !== undefined) {
        map.removeMarker(myLatLngMarker);
    }

    // create a custom icon
    const myCustomIcon = mapfit.Icon();
    myCustomIcon.setIconUrl('./here.png');
    myCustomIcon.setWidth(55);
    myCustomIcon.setHeight(55);

    myLatLngMarker = mapfit.Marker(pos);
    myLatLngMarker.setIcon(myCustomIcon);
    map.addMarker(myLatLngMarker);
}

// 初回にマップの中心を現在位置にする
const locationUpdateOnece = (position) => {
    locationUpdate(position);
    let pos = mapfit.LatLng([position.coords.latitude, position.coords.longitude]);
    map.setCenter(pos);
    map.setZoom(15);
}

// gpsで正しく受信でなかった時に実行する関数
const locationUpdateFail = (error) => {
    console.log("location fail: ", error);
}

// 現在地を継続して取得
if( navigator.geolocation ) {
    navigator.geolocation.watchPosition(locationUpdate, locationUpdateFail, {
        enableHighAccuracy: false,
        maximumAge: 0,
        timeout: 5000
    });
}


window.onload = function() {
    // 現在位置を一度だけ取得(初回起動時にマップの中心を自分の位置に合わせる)
    if( navigator.geolocation ) {
        navigator.geolocation.getCurrentPosition(locationUpdateOnece, locationUpdateFail, {
            enableHighAccuracy: false, // trueにするとより精度の高い値の取得を試みる
            maximumAge: 0,             // 再び現在位置を取得する時に、ここで指定した秒数だけ、今回のデータをキャッシュしておく
            timeout: 10000              // 制限時間
        });
    }

    // 最初にマップを非表示にしておくと正しく表示されないので
    // マップを最初に表示しておき、ここでメイン画面を表示するようにする
    document.getElementById("main").checked = true;
}
