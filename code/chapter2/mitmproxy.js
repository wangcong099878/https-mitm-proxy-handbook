var http = require('http');
var https = require('https');
var url = require('url');
//var colors = require('colors');

//无效

http.createServer()
    .on('request', function (clientRequest, clientResponse) {
        http.request({
            hostname: clientRequest.headers.host,
            path: clientRequest.url,
            headers: clientRequest.headers
        })
            .on('response', function (serverResponse) {

                // log requests
                console.log(clientRequest.method.green + ' ' + clientRequest.url);
                console.log(serverResponse.statusCode.toString().blue + ' ' + (serverResponse.headers['content-length'] || '??').white + 'Bytes');

                clientResponse.writeHead(serverResponse.statusCode, serverResponse.headers);
                serverResponse.on('data', function (chunk) {
                    clientResponse.write(chunk);
                })
                    .on('end', function () {
                        clientResponse.end();
                    });
            })
            .end();
    })
    .on('connect', function (request, connect, head) {
        // connect to an origin server
        var srvUrl = url.parse('http://' + request.url);
        var srvSocket = net.connect(4443, '127.0.0.1', function() {
            cltSocket.write('HTTP/1.1 200 Connection Established\r\n' +
                'Proxy-agent: Node.js-Proxy\r\n' +
                '\r\n');
            srvSocket.write(head);
            srvSocket.pipe(cltSocket);
            cltSocket.pipe(srvSocket);
        });
    })
    .listen(18080);

https.createServer()
    .on('request', function (clientRequest, clientResponse) {
        http.request({
            hostname: clientRequest.headers.host,
            path: clientRequest.url,
            headers: clientRequest.headers
        })
            .on('response', function (serverResponse) {

                // log requests
                console.log(clientRequest.method.green + ' ' + clientRequest.url);
                console.log(serverResponse.statusCode.toString().blue + ' ' + (serverResponse.headers['content-length'] || '??').white + 'Bytes');

                clientResponse.writeHead(serverResponse.statusCode, serverResponse.headers);
                serverResponse.on('data', function (chunk) {
                    clientResponse.write(chunk);
                })
                    .on('end', function () {
                        clientResponse.end();
                    });
            })
            .end();
    })
    .listen(4443);