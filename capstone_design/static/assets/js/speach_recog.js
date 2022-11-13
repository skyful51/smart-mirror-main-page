// IoT 종류
IoTs = ['fan', 'window', 'light'];

var startRecog = document.getElementById('button scrolly');
var result = document.getElementById('speach-recog');
var mainLink = document.getElementById('main-link');
var newsLink = document.getElementById('news-link');
var iotLink = document.getElementById('iot-link');

// 220717 추가 : IoT 제어 중에는 업데이트가 안되도록 하는 변수 (임시, 나중에 개선할 수 있으면 개선할 것)
var isUpdateAble = false;

// // (임시) 제스처 시작 버튼 이벤트 리스너
// startRecog.addEventListener('click', function() {
//     sendGestureRequest();

//     // 220905 제스처 인식 시작 버튼으로 변경
//     // if (annyang) {
    
//     //     //annyang.addCommands(commands);
//     //     //annyang.debug();
//     //     annyang.setLanguage('ko');
//     //     annyang.start();
//     //     console.log('annyang started');

//     //     setTimeout(function() {
//     //         annyang.abort();
//     //         console.log("annyang aborted");
//     //     }, 5000);
//     // }
// });

// 음성 인식 결과 처리 콜백
annyang.addCallback('result', function(userSaid) {
    annyang.abort();
    console.log("annyang stopped");
    result.innerHTML = "";
    result.innerHTML = userSaid[0];
    // isUpdateAble = false;

    // 3초동안 화면에 음성 인식 결과 표시
    setTimeout(function() {
        result.innerHTML = ''
    }, 10000);

    sendVoiceRequest(userSaid);
	
	// // make json and send it to server
    // const json_dict = {'speech_recog_result': userSaid};
    // const stringify = JSON.stringify(json_dict);
	
	// // 음성 인식 결과를 서버로 전송
    // $.ajax({
    //     url: '/speech_recog',
    //     type: 'POST',
    //     contentType: 'application/json',
    //     //data: JSON.stringify(stringify),
	// 	data: stringify,
    //     success: function(json_data) {
    //         console.log(json_data);
	// 		changeIotUi(json_data);
    //         isUpdateAble = true;
    //     }
    // });
});

// 220905 음성 인식 시작 함수
function startVoiceRecog() {
    if (annyang) {
        annyang.setLanguage('ko');
        annyang.start();
        console.log('start annyang record');
        result.innerHTML = "명령어를 말씀하세요.";

        setTimeout(function() {
            result.innerHTML = "";
        }, 90000);
        
        setTimeout(function() {
            if (annyang.isListening() === true) {
                console.log("annyang still running?: " + annyang.isListening());
                annyang.pause();
                console.log('pause annydsfsdfang record');
                result.innerHTML = "";
                sendGestureRequest();
            }
        }, 10000);
    }
}

// 220905 제스처 시작 함수
function sendGestureRequest() {
    const json_dict = {'gesture': 'request'};
    console.log(json_dict);
    const stringify = JSON.stringify(json_dict);
    result.innerHTML = "제스처 인식 중입니다...";

    $.ajax({
        type: 'POST',
        url: '/gesture_recog',
        contentType: 'application/json',
        data: stringify
    }).done(function(json_data) {
        console.log(json_data);

        // 221107 제스처에 따라 다른 기능 수행
        // ok -> 음성 인식 시작
        // main -> 메인 섹션으로 이동
        // news -> 뉴스 섹션으로 이동
        // iot -> iot 섹션으로 이동
        if (Object.values(json_data)[0] === "ok") {
            startVoiceRecog();
        }
        else if (Object.values(json_data)[0] === "main_page") {
            result.innerHTML = "메인 섹션 이동...";
            console.log("here");
            mainLink.click()
            sendGestureRequest();
            }
        else if (Object.values(json_data)[0] === "news_page") {
            result.innerHTML = "뉴스 섹션 이동...";
            console.log("here");
            newsLink.click()
            sendGestureRequest();
            }
        else if (Object.values(json_data)[0] === "iot_page") {
            result.innerHTML = "IoT 제어 섹션 이동...";
            console.log("here");
            iotLink.click()
            sendGestureRequest();
            }
        else {
            result.innerHTML = "제스처 인식 오류, 재시도 중...";
            sendGestureRequest();
        }

    }).fail(function(xhr, status, error) {
        console.log('error occured');
    });
}

// 220905 음성 인식 결과를 서버로 전송하는 함수
// 음성 인식 -> UI 변경
function sendVoiceRequest(speechResult) {
    const json_dict = {'speech_recog_result': speechResult};
    const stringify = JSON.stringify(json_dict);

    $.ajax({
        url: '/speech_recog',
        type: 'POST',
        data: stringify,
        contentType: 'application/json'
    }). done(function(json_data){
            console.log(json_data);
            changeIotUi(json_data);
            isUpdateAble = true;
            sendGestureRequest();
            //update();
    }).fail(function(xhr, status, error) {
        console.log('error occured');
    });
}

// 최초 웹 페이지 접속 시 IoT on/off 여부를 json 형식으로 받아오는 함수
function setInitialIotStatus() {
    $.ajax({
        type: 'GET',
        url: '/initial_setting',
        contentType: 'application/json'
    }).done(function(json_data) {
        changeIotUi(json_data);
		console.log(json_data);
        isUpdateAble = true;
    }).fail(function(xhr, status, error) {
        console.log('error');
        isUpdateAble = true;
    });
}

// 웹 페이지 IoT UI 바꿔주는 함수
function changeIotUi(json_data) {
    for (var key in json_data) {
        if (IoTs.includes(key)) {
            var ui = document.getElementById(key);
            var msg = document.getElementById(key + "-msg");
            
            if (json_data[key].includes('on')) {
                ui.style.visibility = 'visible';
                msg.innerHTML = "ON";
            }
            else {
                ui.style.visibility = 'hidden';
                msg.innerHTML = "OFF";
            }
        }
    }
}

// 220717 추가 : n초마다 IoT 상태 업데이트 받아오는 거로 변경
function update() {
    // setInterval(function() {
    //     if (isUpdateAble) {
    //         $.ajax({
    //             type: 'GET',
    //             url: '/update_iot',
    //             contentType: 'application/json'
    //         }).done(function(json_data) {
    //             changeIotUi(json_data);
    //             console.log(json_data);
    //         }).fail(function(xhr, status, error) {
    //             console.log('error');
    //         });
    //     }
    //     else {
    //         console.log('cannot update now');
    //     }
    // }, 3000);
    console.log("here")
    if (isUpdateAble) {
        $.ajax({
            type: 'GET',
            url: '/update_iot',
            contentType: 'application/json'
        }).done(function(json_data) {
            changeIotUi(json_data);
            console.log(json_data);
        }).fail(function(xhr, status, error) {
            console.log('error');
        });
    }
    else {
        console.log('cannot update now');
    }
}

// 최초 접속 시 IoT 상태 UI 갱신
//setInitialIotStatus();
isUpdateAble = true;

update();

sendGestureRequest();
