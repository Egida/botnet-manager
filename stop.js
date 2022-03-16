import vps from "./config/vps.js";
import {createConnect} from "./core/connection.js";

init()

async function init(){
    for (const v of vps) {
        let ssh = await createConnect(v);
        await putFile(ssh);
        await execFile(ssh);
    }
}

/**
 * Копирование файла.
 *
 * @param ssh
 */
async function putFile(ssh){
    await ssh.putFile('/Users/qa/projects/war/bash/stop.sh', '/home/stop.sh');
    console.log("stop.sh copy")
}

/**
 * Старт процесса
 */
async function execFile(ssh) {
    await ssh.exec('chmod +x /home/stop.sh', [])
    await ssh.exec('/home/stop.sh', []).catch(() => {})
    await ssh.exec('rm /home/stop.sh', []).catch(e => {console.log(e)})

    console.log("stop.sh stop")
}