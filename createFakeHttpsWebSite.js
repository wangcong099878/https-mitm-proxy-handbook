const path = require('path');
const forge = require('node-forge');
const pki = forge.pki;
const tls = require('tls');
const url = require('url');
const http = require('http');
const https = require('https');
const fs = require('fs');



/*const caCertPath = path.join(__dirname, '../../rootCA/rootCA.crt');
const caKeyPath = path.join(__dirname, '../../rootCA/rootCA.key.pem');*/

const caCertPath = '/Users/wangcong/node-mitmproxy/node-mitmproxy.ca.crt';
const caKeyPath = '/Users/wangcong/node-mitmproxy/node-mitmproxy.ca.key.pem';

try {
    fs.accessSync(caCertPath, fs.F_OK);
    fs.accessSync(caKeyPath, fs.F_OK);
} catch (e) {
    console.log(`在路径下：${caCertPath} 未找到CA根证书`, e);
    process.exit(1);
}

fs.readFileSync(caCertPath);
fs.readFileSync(caKeyPath);

const caCertPem = fs.readFileSync(caCertPath);
const caKeyPem = fs.readFileSync(caKeyPath);
const caCert = forge.pki.certificateFromPem(caCertPem);
const caKey = forge.pki.privateKeyFromPem(caKeyPem);

/**
 * 根据CA证书生成一个伪造的https服务
 * @param  {[type]} ca         [description]
 * @param  {[type]} domain     [description]
 * @param  {[type]} successFun [description]
 * @return {[type]}            [description]
 */
function createFakeHttpsWebSite(domain, successFun) {

    const fakeCertObj = createFakeCertificateByDomain(caKey, caCert, domain)
    var fakeServer = new https.Server({
        key: fakeCertObj.key,
        cert: fakeCertObj.cert,
        SNICallback: (hostname, done) => {
            let certObj = createFakeCertificateByDomain(caKey, caCert, hostname)
            done(null, tls.createSecureContext({
                key: pki.privateKeyToPem(certObj.key),
                cert: pki.certificateToPem(certObj.cert)
            }))
        }
    });

    fakeServer.listen(0, () => {
        var address = fakeServer.address();
        successFun(address.port);
    });
    fakeServer.on('request', (req, res) => {

        // 解析客户端请求
        var urlObject = url.parse(req.url);
        let options =  {
            protocol: 'https:',
            hostname: req.headers.host.split(':')[0],
            method: req.method,
            port: req.headers.host.split(':')[1] || 80,
            path: urlObject.path,
            headers: req.headers
        };
        res.writeHead(200, { 'Content-Type': 'text/html;charset=utf-8'});
        res.write(`<html><body>我是伪造的: ${options.protocol}//${options.hostname} 站点</body></html>`)
        res.end();
    });
    fakeServer.on('error', (e) => {
        console.error(e);
    });

}

/**
 * 根据所给域名生成对应证书
 * @param  {[type]} caKey  [description]
 * @param  {[type]} caCert [description]
 * @param  {[type]} domain [description]
 * @return {[type]}        [description]
 */
function createFakeCertificateByDomain(caKey, caCert, domain) {
    var keys = pki.rsa.generateKeyPair(2046);
    var cert = pki.createCertificate();
    cert.publicKey = keys.publicKey;

    cert.serialNumber = (new Date()).getTime()+'';
    cert.validity.notBefore = new Date();
    cert.validity.notBefore.setFullYear(cert.validity.notBefore.getFullYear() - 1);
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notAfter.getFullYear() + 1);
    var attrs = [{
      name: 'commonName',
      value: domain
    }, {
      name: 'countryName',
      value: 'CN'
    }, {
      shortName: 'ST',
      value: 'GuangDong'
    }, {
      name: 'localityName',
      value: 'ShengZhen'
    }, {
      name: 'organizationName',
      value: 'https-mitm-proxy-handbook'
    }, {
      shortName: 'OU',
      value: 'https://github.com/wuchangming/https-mitm-proxy-handbook'
    }];

    cert.setIssuer(caCert.subject.attributes);
    cert.setSubject(attrs);

    cert.setExtensions([{
        name: 'basicConstraints',
        critical: true,
        cA: false
    },
    {
        name: 'keyUsage',
        critical: true,
        digitalSignature: true,
        contentCommitment: true,
        keyEncipherment: true,
        dataEncipherment: true,
        keyAgreement: true,
        keyCertSign: true,
        cRLSign: true,
        encipherOnly: true,
        decipherOnly: true
    },
    {
        name: 'subjectAltName',
        altNames: [{
          type: 2,
          value: domain
        }]
    },
    {
        name: 'subjectKeyIdentifier'
    },
    {
        name: 'extKeyUsage',
        serverAuth: true,
        clientAuth: true,
        codeSigning: true,
        emailProtection: true,
        timeStamping: true
    },
    {
        name:'authorityKeyIdentifier'
    }]);
    cert.sign(caKey, forge.md.sha256.create());


    //console.log(cert);

    return {
        key: keys.privateKey,
        cert: cert
    };
}

module.exports = createFakeHttpsWebSite
