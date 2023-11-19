import { frm } from "../Defines";
import { Singleton } from "./Singleton";
import { Timer } from "./TimerMgr";


export type ConnectCallback = (code: number, msg: string) => void;

const MaxAutoReconnectCount = 3;
const AutoReconnectInterval = 3;
const LostPongLimit = 3;
const PingInterval = 2;

class WsMgr extends Singleton {

    public init(url: string) {
        this._url = url;
    }

    public ping() {
        if (this._pingCount >= LostPongLimit) {
            this._pingCount = 0;
            this.reconnect();
            return;
        }
        // ping action
        this._pingCount++;
    }

    public connect(cb: ConnectCallback, token?: string) {
        let handler = this._handler;
        if (handler) {
            const readyState = handler.readyState;
            // 正在连接
            if (readyState == handler.CONNECTING) return;
            // 如果已经连接，则关闭当前连接
            this.disconnect();
        }
        this._needConnectActive = false;
        this._connectCb = cb;
        let url = this._url;
        if (token) {
            url += `?token=${token}`;
        }
        this._handler = new WebSocket(url);
        this._handler.binaryType = 'arraybuffer';
        this._handler.onopen = this._onopen.bind(this);
        this._handler.onclose = this._onclose.bind(this);
        this._handler.onerror = this._onerror.bind(this);
        this._handler.onmessage = this._onmessage.bind(this);
    }

    public disconnect() {
        let handler = this._handler;
        if (handler) {
            if (handler.readyState == handler.OPEN) {
                handler.close(0, '主动断连');
            }
            handler.onopen = null;
            handler.onclose = null;
            handler.onerror = null;
            handler.onmessage = null;
            this._handler = null;
        }
    }

    public send(data: any) {
        if (!this._connected) return;
        this._handler?.send(data);
    }
    ////
    protected onCreate(): void {
    }
    ////
    private _onopen() {
        this._connected = true;
        this._autoReconnect = false;
        this._autoReconnectCount = MaxAutoReconnectCount;
        this._connectCb && this._connectCb(frm.InnerCode.OK, "connected");
    }

    private _onclose() {
        this._connected = false;
        this.reconnect();
    }

    private _onerror() {
        this._connected = false;
        this.reconnect();
    }

    private _onmessage(ev: any) {
        // pong reset _pingCount
        // this._pingTimer.reset()
        this._onMessageCb(ev.data);
    }

    private reconnect() {
        if (this._autoReconnect || this._needConnectActive) return;
        this._autoReconnect = true;

        if (this._autoReconnectCount <= 0) {
            this._needConnectActive = true;
            this._autoReconnect = false;
            this._autoReconnectCount = MaxAutoReconnectCount;
            this._connectCb && this._connectCb(frm.InnerCode.WEBSOCKET_ERR, "网络连接失败，请重试！");
            return;
        }
        this._autoReconnectCount--;

        // 超时检查
        Timer.delay(() => {
            if (!this._connected) this.tryReconnect();
        }, AutoReconnectInterval, 9999);
        this.connect(this._connectCb);
    }

    private tryReconnect() {
        this.disconnect();
        this._autoReconnect = false;
        this.reconnect();
    }
    //private
    private _url = "";
    private _connected = false;
    private _autoReconnect = false;
    private _autoReconnectCount = MaxAutoReconnectCount;
    private _needConnectActive = false;
    private _pingCount = 0;
    private _handler: WebSocket | null = null;
    private _connectCb: (code: number, msg: string) => void = null!;
    private _onMessageCb: (data: any) => void = null!;
}

export const Ws = WsMgr.getInstance() as WsMgr;