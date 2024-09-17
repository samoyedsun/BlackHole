import { EventTarget } from 'cc';

enum ENetStatus {
    Unconnect,
    Waiting,
    Connected
}

class Network {
    private ws: WebSocket;
    private eventTarget: EventTarget;
    private static instance: Socket;
    private status: number;
    private constructor() {
        this.eventTarget = new EventTarget();
        this.status = ENetStatus.Unconnect;
    }
    public static getInstance(): Network {
        if (!this.instance) {
            this.instance = new Network();
        }
        return this.instance;
    }
    public isUnconnect() {
        return this.status == ENetStatus.Unconnect;
    }
    public connect(addr: string, next: any) {
        if (this.status != ENetStatus.Unconnect) {
            return;
        }
        next();
        this.ws = new WebSocket(addr);
        this.ws.binaryType = "arraybuffer";
        this.ws.addEventListener("open", function (event) {
            this.status = ENetStatus.Connected
            console.log("WebSocket open: ", event);
            this.eventTarget.emit("onOpen", event);
        }.bind(this));
        this.ws.addEventListener("close", function (event) {
            this.status = ENetStatus.Unconnect;
            console.log("WebSocket close: ", event);
            this.eventTarget.emit("onClose", event);
        }.bind(this));
        this.ws.addEventListener("error", function (event) {
            this.status = ENetStatus.Unconnect;
            console.log("WebSocket error: ", event);
            this.eventTarget.emit("onError", event);
        }.bind(this));
        this.ws.addEventListener("message", function (event) {
            const msg = JSON.parse(event.data)
            this.eventTarget.emit(msg.name, msg.data);
        }.bind(this));
    }
    public on(type: string, handle: any) {
        if (this.eventTarget.hasEventListener(type)) {
            return;
        }
        this.eventTarget.on(type, handle);
    }
    public send(name, data) {
        let msg = { name : name, data : data}
        console.log(JSON.stringify(msg))
        this.ws.send(JSON.stringify(msg));
    }
}

export { Network }
