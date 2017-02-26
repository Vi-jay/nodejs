const koa = require('koa'),
    url = require('url'),
    routes = require('../controllers/control'),
    bodyParse = require('koa-bodyparser')(),
    staticFiles = require('../static/static-files'),
    templating = require('../views/templatings'),
    Cookies = require('cookies'),
    WebSocket = require('ws'),
    WebSocketServer = WebSocket.Server,
    log = require('./log'),
    app = new koa();
let messageIndex = 0;

const isProduction = process.env.NODE_ENV === 'production';//判断是否为生产环境 如果是就关闭缓存 如果不是就开启缓存

app.use(staticFiles('/static', __dirname.replace('build', '') + '/static'));//表示处理请求地址以/static/resource开头的,接受请求后到真实，目录的static下找
app.use(log);
app.use(templating('view', {
    noCache: !isProduction,
    watch: !isProduction
}));
app.use(async(ctx, next) => {
    ctx.state.user = parseUser(ctx.cookies.get('name') || '');
    await next()
});
app.use(bodyParse);
app.use(routes);
let server = app.listen(9000);


app.wss = createWebSocketServer(server, onConnect, onMessage, onClose);
console.log('app started at port 3000...');
function parseUser(obj) {
    if (!obj) {
        return;
    }
    console.log('try parse: ' + obj);
    let s = '';
    if (typeof obj === 'string') {
        s = obj;
    } else if (obj.headers) {
        let cookies = new Cookies(obj, null);
        s = cookies.get('name');
    }
    if (s) {
        try {
            let user = JSON.parse(Buffer.from(s, 'base64').toString());
            console.log(`User: ${user.name}, ID: ${user.id}`);
            return user;
        } catch (e) {
            // ignore
        }
    }
}


function createWebSocketServer(server, onConnection, onMessage, onClose, onError) {
    let wss = new WebSocketServer({//绑定http实例
        server: server
    });
    wss.broadcast = (data) => { //分发数据到每个连接了websocket的客户端上
        wss.clients.forEach((client) => {
            client.send(data);
        });
    };
    onConnection = onConnection || function () {//连接事件
            console.log('[WebSocket] connected.');
        };
    onMessage = onMessage || function (msg) {//获取到数据事件
            console.log('[WebSocket] message received: ' + msg);
        };
    onClose = onClose || function (code, message) {//关闭连接事件
            console.log(`[WebSocket] closed: ${code} - ${message}`);
        };
    onError = onError || function (err) {//出错事件
            console.log('[WebSocket] error: ' + err);
        };
    wss.on('connection', function (ws) {//注册连接事件监听器
        let location = url.parse(ws.upgradeReq.url, true);//ws.upgradeReq相当于request
        console.log('[WebSocketServer] connection: ' + location.href);//请求连接的地址
        ws.on('message', onMessage); //绑定指定事件
        ws.on('close', onClose);
        ws.on('error', onError);
        // if (location.pathname !== '/ws/chat') { //判断连接的地址是否为指定的地址
        //     // close ws:
        //     ws.close(4000, 'Invalid URL');   //如果不是则关闭 并响应指定内容
        // }
        // check user:
        // let user = parseUser(ws.upgradeReq);  //判断当前的cookie中是否有用户信息
        // if (!user) {                         //判断登录信息
        //     ws.close(4001, 'Invalid user');  //如果不存在则关闭
        // }
        let user = 123; //测试数据
        ws.user = user;//绑定user
        ws.wss = wss; //绑定webSocketServer
        onConnection.apply(ws);//绑定onConnect的执行域为webSocket
    });
    console.log('WebSocketServer was attached.');
    return wss;
}


function createMessage(type, user, data) {
    messageIndex++;
    return JSON.stringify({
        id: messageIndex,
        type: type,
        user: user,
        data: data
    });
}

function onConnect() {
    let user = this.user;
    let msg = createMessage('join', user, `${user.name} joined.`);//把user信息传递给createMessage方法 创建user join信息
    this.wss.broadcast(msg);//分发信息
    // build user list:
    let users = this.wss.clients.map(function (client) {//拿到每个user信息
        return client.user;
    });
    this.send(createMessage('list', user, users));//创建用户列表信息 把新加入的user和当前所有user信息刷新一遍创建信息发给客户端
    //send可以直接向客户端发送信息
    //broadcast是向每个客户端的页面上发送信息  this.send是向当前连接的用户页面上发送信息
    //该信息只会发送一次  之后客户端想刷新列表需要判断join进来的用户的信息 去添加到列表中
}

function onMessage(message) {//当客户端向服务端发送信息时
    console.log(message);//打印该信息
    if (message && message.trim()) {//如果信息存在或者信息不为空
        let msg = createMessage('chat', this.user, message.trim());//根据当前连接用户创建去掉空格的信息
        this.wss.broadcast(msg);//把信息分发到每个页面上
    }
}

function onClose() {
    let user = this.user;
    let msg = createMessage('left', user, `${user.name} is left.`);
    this.wss.broadcast(msg);//当用户离开时通知每个客户端 某个连接中的用户离开了  需要去掉列表中的该用户并且显示离开信息
}
module.exports = parseUser;

