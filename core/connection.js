import {NodeSSH} from "node-ssh";


export async function createConnect(vps){
    const ssh = new NodeSSH()

    let data = {
        host: vps.ip,
        username: vps.login,
    }
    if(vps.port){
        data.port = vps.port
    }

    if(vps.password) {
        data.password = vps.password
    }else{
        data.privateKey = '/Users/qa/.ssh/id_rsa'
    }


    return await ssh.connect(data)
}