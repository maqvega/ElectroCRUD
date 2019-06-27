import { 
    IPC_CHANNEL_CHECK_CONNECTION, 
    IPCCheckConnectionRequestMessage, 
    IPCCheckConnectionResponseMessage 
} from '../../shared/ipc/accounts.ipc';

import { ipcMain } from 'electron-better-ipc';
import { JsonValue } from 'type-fest';
import { TunnelService } from '../services/tunnel.service';

export class AccountsIPC {

    private tunnel:TunnelService;

    constructor() {}
    
    public listen() {
        ipcMain.answerRenderer(IPC_CHANNEL_CHECK_CONNECTION, (req: JsonValue) => this.checkConnection(req));
    }

    public async checkConnection(req: JsonValue): Promise<JsonValue> {
        let reqMessage: IPCCheckConnectionRequestMessage = new IPCCheckConnectionRequestMessage(req);
        
        try {
            if (this.tunnel != null) {
                this.tunnel.close();
            }
        } catch(error) {
            console.log("close error: ", error)
        }

        this.tunnel = new TunnelService(
            reqMessage.toMessage().ssh.hostname,
            reqMessage.toMessage().ssh.username,
            reqMessage.toMessage().ssh.password,
            reqMessage.toMessage().ssh.port,
            reqMessage.toMessage().server.hostname,
            reqMessage.toMessage().server.port
        );

        let resMessage: IPCCheckConnectionResponseMessage = new IPCCheckConnectionResponseMessage({
            server: {
                valid: true
            },
            ssh: {
                valid: false
            }
        });

        try {
            let tunnelRes:any = await this.tunnel.start();
            resMessage.sshValid = true;
        } catch (error) {
            resMessage.sshValid = false;
            resMessage.sshError = error.toString();
        }
        console.log("resMessage", resMessage.toMessage());
        return Promise.resolve(resMessage.toJsonValue());
    }

}