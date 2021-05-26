'use strict'
/**
 *  HTTP Tunnel 支持https
 */
const http = require('http');
const url = require('url');
const net = require('net');

let httpTunnel = new http.Server();
// 启动端口
let port = 16789;

httpTunnel.listen(port, () => {
    console.log(`HTTP中间人代理启动成功，端口：${port}`);
});

httpTunnel.on('error', (e) => {
    if (e.code == 'EADDRINUSE') {
        console.error('HTTP中间人代理启动失败！！');
        console.error(`端口：${port}，已被占用。`);
    } else {
        console.error(e);
    }
});
//http://nodejs.cn/api/net.html#net_server_close_callback
// https的请求通过http隧道方式转发
httpTunnel.on('connect', (req, cltSocket, head) => {
    try {
        // connect to an origin server
        var srvUrl = url.parse(`http://${req.url}`);

        console.log(`CONNECT ${srvUrl.hostname}:${srvUrl.port}`);

        var srvSocket = net.connect(srvUrl.port, srvUrl.hostname, () => {
            try {
                cltSocket.write('HTTP/1.1 200 Connection Established\r\n' +
                    'Proxy-agent: MITM-proxy\r\n' +
                    '\r\n');
                srvSocket.write(head);
                srvSocket.pipe(cltSocket);
                cltSocket.pipe(srvSocket);
            } catch (e) {
                console.log(e);
            }

        });
        srvSocket.on('error', (e) => {
            //console.error(e);
        });

        srvSocket.on('close', (e) => {
            //console.error(e);
            console.log('关闭链接');
        });
    } catch (e) {
        console.log(e);
    }


});
