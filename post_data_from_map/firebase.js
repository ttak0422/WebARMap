// firebase への参照
const dataRef = firebase.database().ref('data');
// firebase storage への参照
const storageRef = firebase.storage().ref();

const signInButtonElement = document.getElementById("sign_in_btn");
const signOutButtonElement = document.getElementById("sign_out_btn");
const userNameElement = document.getElementById("user_name");
const registrationButtonElement = document.getElementById('registration_btn');
const deleteButtonElement = document.getElementById('delete_btn');
const latElement = document.getElementById('lat');
const lngElement = document.getElementById('lng');
const selectElement = document.getElementById("select");

///////////////////////////////////////////////////////////////////////////////////
// 以下googleアカウントの認証

// Signs-in
// サインインするボタンにはこの関数を設定する
const signIn = () => {
    // Sign in Firebase using popup auth and Google as the identity provider.
    var provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider);
    console.log("signIn()");
}

// Signs-out
const signOut = () => {
    // Sign out of Firebase.
    firebase.auth().signOut();
    console.log("signOut()");
}

// Initiate firebase auth.
const initFirebaseAuth = () => {
    // Listen to auth state changes.
    firebase.auth().onAuthStateChanged(authStateObserver);
}

// Returns the signed-in user's display name.
const getUserName = () => {
    return firebase.auth().currentUser.displayName;
}

const getUid = () => {
    return firebase.auth().currentUser.uid;
}

// Returns true if a user is signed-in.
const isUserSignedIn = () => {
    return firebase.auth().currentUser;
}

// Triggers when the auth state change for instance when the user signs-in or signs-out.
const authStateObserver = (user) => {
    if (user) { // User is signed in!
        // Get the signed-in user's profile name.
        var userName = getUserName();
        console.log("authStateObserver()\nuser name: " + userName);

        // Set the user's profile name.
        userNameElement.innerHTML = userName;
        //alert("auth: " + userName);
        
        // Show user's profile and sign-out button.
        userNameElement.style.display = '';
        signOutButtonElement.style.display = '';
        // Hide sign-in button.
        signInButtonElement.style.display = 'none';


        // サインインしたらfirebaseからデータを読み込みマップにマーカーを表示
        dataRef.on('child_added', function (snapshot) {
            //取得したデータ
            let data = snapshot.val();
            let lat = data.lat;
            let lng = data.lng;
            console.log(JSON.stringify(data, null , "\t"));
          
            // データの位置にマーカーを表示
            let position = mapfit.LatLng([lat, lng]);
            let tmpMarker = mapfit.Marker(position);
          
            if (data.uid == getUid() ) {
                // マーカーをクリックした時の処理
                tmpMarker.on('click', function (e) {
                    console.log("maker clicked");
                    console.log(e.latlng);
                    markerFunction(snapshot, tmpMarker);
                });
            } else {
                // マーカーの画像を指定
                let customDataIcon = mapfit.Icon();
                customDataIcon.setIconUrl('./data.png');
                customDataIcon.setWidth(50);
                customDataIcon.setHeight(55);
                tmpMarker.setIcon(customDataIcon);

                tmpMarker.on('click', function (e) {
                    console.log("maker clicked");
                    console.log(e.latlng);

                    alert("you can't edit this data!");

                }); 
            }
            
            map.addMarker(tmpMarker);
        });

    } else { // User is signed out!
        // Hide user's profile and sign-out button.
        userNameElement.style.display = 'none';
        signOutButtonElement.style.display = 'none';

        // Show sign-in button.
        signInButtonElement.style.display = '';
    }
}

///////////////////////////////////////////////////////////////////////////////////


// 画像のアップロード
const uploadImage = (imageData, name) => {
    if (imageData) {
        let reader  = new FileReader();
        reader.readAsDataURL(imageData);
        
        let uploadRef = storageRef.child('images/' + name);
        uploadRef.put(imageData).then(function(snapshot) {
            console.log('Uploaded a blob or file!');
        });
    }
}

// firebaseにデータを保存
const pushData = (data) => {
    console.log('pushData()');
    console.log(JSON.stringify(data, null , "\t"));
    dataRef.push(data);

    // 画像の場合はfirebase strageにも保存
    if (data.valueType == 'image') {
        var imageData = document.getElementById("input_image").files[0];
        uploadImage(imageData, data.value);
    } 
}


// 特定のデータの取得
const getData = (key) => {
    console.log("getData(): " + key);

    dataRef.child(key).once('value', function(snapshot) {
        const data = snapshot.val();
        console.log(JSON.stringify(data, null , "\t"));
        return data;
    });
}

// 特定のデータの削除
const deleteData = (key, imagePath) => {
    // データの削除
    dataRef.child(key).set(null);

    // 画像のパスが渡された場合はその画像も削除
    if(imagePath !== undefined) {
        var imageRef = storageRef.child('images/' + imagePath);
        // Delete the file
        imageRef.delete().then(function() {
            // File deleted successfully
            console.log("Successfully removed image!");
        }).catch(function(error) {
            // Uh-oh, an error occurred!
            console.log("Failed to delete image!");
        });
    }

    console.log("deleteData()");
    alert("deleted the data!");
}

// initialize Firebase
initFirebaseAuth();



let marker;      // クリックした箇所に立てるマーカー
let editMarker;  // 現在参照しているマーカー
let editDataKey; // 編集したいデータのキー
let editImage;   // 編集したいデータが画像の場合はそのパスを格納する


// データをfirebaseに登録する
// 登録ボタンの関数
const registrationData = () => {
    console.log("resistrarionData()")
    
    // googleにログインしていなければreturn
    if(!isUserSignedIn()){
        console.log("not sign in!")
        alert("please sign in!");
        return;
    }
    
    // firebaseに保存するデータ
    let data = {uid: null,
                valueType: null,
                value: null,
                lat: null,
                lng: null};

    // select で選択されているもの
    const idx = selectElement.selectedIndex;
    const selectedValue = selectElement.options[idx].value;
    const lat = latElement.value;
    const lng = lngElement.value;

    if (lat == "" || lng == "") {
      alert("select place");
      return;
    }

    // データを格納
    let inputElement
    switch( selectedValue ) {
        case 'text':
            inputElement = document.getElementById("input_text");
            if(inputElement.value == "") {
                alert("input text");
                return;
            }
            data.value = inputElement.value;
            inputElement.value = "";
            break;
    
        case 'image':
            if(document.getElementById("input_image").files.length == 0) {
                alert("input image");
                return;
            }
            let time = new Date()/1;
            data.value = time + getUid();
            break;
    
        case 'movie':
            inputElement = document.getElementById("input_url");
            if(inputElement.value == "") {
                alert("input url");
                return;
            }
            const url = inputElement.value;
            const array = url.split("?v=");
            data.value = array[array.length-1];
            inputElement.value = "";
            break;
    }

    data.uid = getUid();
    data.valueType = selectedValue;
    data.lat = lat;
    data.lng = lng;

    // データをfirebaseにアップ
    pushData(data);
    alert("Data was registered!");

    // editDataKeyがundefined出なければ編集処理としてデータを消し、
    // 新しくデータを登録し直す
    if (editDataKey !== undefined) {
      deleteData(editDataKey, editImage);
      editDataKey = undefined;
      editImage = undefined;
    }
    if (editMarker !== undefined) {
      map.removeMarker(editMarker);
      editMarker = undefined;
    }
    console.log("resistrarionData() complete")
}

// 削除ボタンを押した時に実行する関数
const deleteDataBtn = () => {

    // googleにサインインしてなければ処理を実行しない
    if(!isUserSignedIn()){
        console.log("not sign in!")
        alert("please sign in!");
        return;
    }

    if (editDataKey !== undefined) {
        deleteData(editDataKey, editImage);
        editDataKey = undefined;
        editImage = undefined;
        map.removeMarker(editMarker);
    } else {
        alert("select the data to be deleted!");
    }
}



// クリックした箇所にマーカーを立てる
map.on('click', function(e) {
    console.log(e.latlng);
    
    // 前回立てたマーカーを消す
    if (marker !== undefined) {
        map.removeMarker(marker);
    }

    // タップした位置にマーカーをセット
    marker = mapfit.Marker(e.latlng);
    // マーカーの画像を指定
    const customDataIcon = mapfit.Icon();
    customDataIcon.setIconUrl('./edit_marker.png');
    customDataIcon.setWidth(50);
    customDataIcon.setHeight(55);
    marker.setIcon(customDataIcon);

    map.addMarker(marker);

    // タップした位置を表示
    latElement.value = e.latlng.lat;
    lngElement.value = e.latlng.lng;

    // 編集項目を初期化
    // document.getElementById("input_text").value = "";
    // document.getElementById("input_image").value = "";
    // document.getElementById("input_url").value = "";

    editDataKey = undefined;
    editImage = undefined;
    editMarker = marker;

    // マーカーをクリックした際の処理
    marker.on('click', function (e) {
        console.log("maker clicked");
        console.log(e.latlng);

        latElement.value = e.latlng.lat;
        lngElement.value = e.latlng.lng;
    });
});

// テキストボックスから緯度経度を書き換えた時に実行する関数
// マップのマーカーも入力した座標に移動させる
function changeLatLngElelment() {
    console.log("changeLatLngElelment()");
    const lat = latElement.value;
    const lng = lngElement.value;

    if (marker !== undefined) {
      map.removeMarker(marker);
    } 

    // 緯度経度のどとらかの値が数値でなければreturn
    if(isNaN(lat) || isNaN(lng)) {
      return;
    }

    // マーカーの位置を連動させて変更
    const position = mapfit.LatLng([lat, lng]);
    marker = mapfit.Marker(position);
    map.addMarker(marker);
}


// マーカーをクリックした時に実行
// マーカーの位置に投稿した情報を編集画面(上画面)に表示
function markerFunction(snapshot, selectMarker) {
  
    editDataKey = snapshot.key;
    editMarker  = selectMarker;
    editImage   = undefined;

    // マーカーの座標をテキストボックスに表示
    let data    = snapshot.val();
    latElement.value = data.lat;
    lngElement.value = data.lng;

    let valueType = data.valueType;

    // 選択したマーカーのデータを表示
    switch( valueType ) {
        case 'text':
        document.getElementById("input_text").value = data.value;
        selectElement.selectedIndex = 0;
        createForm(); // form.js: 入力フォームの書き換え
        break;

        case 'image':
        selectElement.selectedIndex = 1;
        createForm(); // form.js: 入力フォームの書き換え
        editImage = data.value;
        break;

        case 'movie':
        document.getElementById("input_url").value = data.value;
        selectElement.selectedIndex = 2;
        createForm(); // form.js: 入力フォームの書き換え
        break;
    }

    console.log("editDataKey: " + editDataKey + 
                "\neditMarker: " + editMarker + 
                "\neditImage: " + editImage);
}


// 画面が読み込まれたらサインインさせる
window.onload = function () {
  console.log("onload!!!!!!!!!!!!");
  createForm();
  signIn();
}


// ボタン類のリスナーの登録
signInButtonElement.addEventListener("click", signIn);
signOutButtonElement.addEventListener("click", signOut);
registrationButtonElement.addEventListener("click", registrationData);
deleteButtonElement.addEventListener("click", deleteDataBtn);
latElement.addEventListener("input", changeLatLngElelment);
lngElement.addEventListener("input", changeLatLngElelment);


userNameElement.style.display = 'none';
signInButtonElement.style.display = '';
signOutButtonElement.style.display = 'none';
