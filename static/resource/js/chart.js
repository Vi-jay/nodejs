let ws = new WebSocket('ws://192.168.1.101:9000');//创建webSocket连接 连接到指定ip上
ws.onmessage = function (event) {//返回信息监听
    let data = event.data;//返回事件中的data是服务端发来的数据
    let msg = JSON.parse(data);
    document.getElementsByClassName('text')[0].innerHTML=data;
};


ws.onclose = function (evt) {
    console.log('[closed] ' + evt.code);
};

ws.onerror = function (code, msg) {
    console.log('[ERROR] ' + code + ': ' + msg);
};
document.getElementsByClassName('submit')[0].onclick=function () {
    ws.send('Hello!');//向服务端发送信息
};

