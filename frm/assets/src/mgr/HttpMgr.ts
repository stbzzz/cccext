import { log, sys } from "cc";
import { frm } from "../Defines";
import { Util } from "../util/Util";
import { Data } from "./DataMgr";
import { Gui } from "./GuiMgr";
import { Singleton } from "./Singleton";

const Key_StorageGameToken = 'Key_StorageGameToken';

function buildQuery(data: any): string {
    let str = '';
    for (let k in data) {
        if (str != '') {
            str += '&';
        }
        str += k + '=' + data[k];
    }
    return encodeURI(str);
}

class Request {
    private static GlobalUid = 0;

    private _uid = 0;
    private _path!: string;
    private _param: any;
    private _method!: string;
    private _retryfunc: null | frm.TRetryFunc = null;
    private _ignoreRetryFunc = false;
    private _responseCallback: null | ((data: frm.RecvDataEntity) => void) = null;
    private _timeout!: number;//毫秒
    private _autoretry!: number;
    private _isResponse: boolean = false;
    private _isRequesting: boolean = false;
    private _needauth: boolean = true;
    private _needmask: boolean = true;

    private _entity!: frm.RecvDataEntity;

    constructor(path: string, param?: any, post?: frm.IPostData) {
        this._uid = ++Request.GlobalUid;
        this.reset(path, param, post);
    }

    public get uid(): number { return this._uid; }

    public reset(path: string, param?: any, post?: frm.IPostData) {
        this._path = path;
        this._param = param;
        post = post || {};

        // 初始化参数
        this._method = post._method || 'POST';
        this._timeout = post._timeout || Http.getTimeout();
        this._autoretry = post._autoretry || Http.getAutoretryCount();
        if (post.hasOwnProperty('_needauth')) {
            this._needauth = post._needauth!;
        } else {
            this._needauth = true;
        }
        if (post.hasOwnProperty('_needmask')) {
            this._needmask = post._needmask!;
        } else {
            this._needmask = true;
        }

        // 保留向服务器发送的参数
        for (let k in param) {
            post[k] = param[k];
        }

        if (this._entity) {
            this._entity.reset(post);
        } else {
            this._entity = new frm.RecvDataEntity(post);
        }

        this._ignoreRetryFunc = post._ignoreRetryFunc || false;
        if (!this._ignoreRetryFunc) {
            this._retryfunc = post._retryfunc || Http.getRetryFunc();
        } else {
            this._retryfunc = null;
        }

        // 重置数据
        this._responseCallback = null;
        this._isResponse = false;
        this._isRequesting = false;
    }

    public setResponseCallback(callback: (data: frm.RecvDataEntity) => void) {
        this._responseCallback = callback;
    }

    public start() {
        if (this._isRequesting) return;
        this._needmask && Gui.setRequestMask(true);

        this._isRequesting = true;
        this._autoretry--;

        let xhr = new XMLHttpRequest(),
            isTimeout = false, timeout = this._timeout ? this._timeout : 3000,
            path = this._path, param = this._param, method = this._method;

        // 超时
        let timer = setTimeout(() => {
            isTimeout = true;
            this._setResponse(frm.InnerCode.TIMEOUT, '请求超时');
            xhr.abort();
        }, timeout);

        xhr.onreadystatechange = () => {
            if (xhr.readyState != 4) return;

            if (xhr.status == 200) {
                if (isTimeout) return;
                clearTimeout(timer);
                let res = null;
                try {
                    res = JSON.parse(xhr.responseText);
                    if (!res.hasOwnProperty('code')) {
                        throw new Error('数据格式错误');
                    }
                } catch (err) {
                    res = null;
                    this._setResponse(frm.InnerCode.PARSE_JSON_ERR, 'JSON解析错误');
                }
                if (res) {
                    this._setResponse(res.code, res.msg || "", res.data);
                }
            }
            else {
                this._setResponse(frm.InnerCode.STATUS_CODE_ERR, `状态码错误:${xhr.status}`);
            }
        };
        // 4xx属于应用级别不触发
        xhr.onerror = (event: any) => {
            this._setResponse(frm.InnerCode.STATUS_CODE_ERR, '状态码错误:err');
        };

        let url = path;
        if (method === 'GET') {
            let queryStr = buildQuery(param);
            if (queryStr) {
                url += `?${queryStr}`;
            }
            xhr.open('GET', url, true);
            this._needauth && xhr.setRequestHeader('Authorization', Http.getGameToken());
            xhr.send();
        }
        else if (method === 'POST') {
            xhr.open('POST', url, true);
            this._needauth && xhr.setRequestHeader('Authorization', Http.getGameToken());
            xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            xhr.send(buildQuery(param))
        }
    }

    ////
    private _retry() {
        if (this._isRequesting) return;
        this._isResponse = false;
        this.start();
    }

    private _setResponse(code: number, msg: string, data?: any) {
        if (this._isResponse) return;

        this._isResponse = true;
        this._isRequesting = false;

        let success = code == frm.InnerCode.OK;

        // 自动重试
        if (!success && this._autoretry >= 0) {
            this._retry();
            return;
        }

        // 删除遮罩
        this._needmask && Gui.setRequestMask(false);

        let res = (code: number, msg: string, data?: any) => {
            // 响应回调
            this._entity.msg = msg;
            this._entity.code = code;
            this._entity.data = data;
            this._responseCallback && this._responseCallback(this._entity);
        }

        // 重试
        if (!success && this._retryfunc) {
            this._retryfunc(code, () => {
                res(code, msg, data);
                Gui.toast(msg);
            }, () => {
                this._retry();
            });
            return;
        }
        if (!success) Gui.toast(msg);

        res(code, msg, data);
    }
}

class HttpMgr extends Singleton {

    public init(httpUrl: string) {
        this._url = httpUrl;
    }

    public setGameToken(token: string) {
        this._gameToken = token;
        sys.localStorage.setItem(Key_StorageGameToken, token);
    }

    public getGameToken(): string {
        if (this._gameToken) return this._gameToken;
        return sys.localStorage.getItem(Key_StorageGameToken) || '';
    }

    public setTimeout(timeout: number) {
        this._timeout = timeout;
    }

    public getTimeout(): number {
        return this._timeout;
    }

    public setAutoretryCount(count: number) {
        this._autoretryCount = count;
    }

    public getAutoretryCount(): number {
        return this._autoretryCount;
    }

    public setRetryFunc(func: frm.TRetryFunc) {
        this._retryfunc = func;
    }

    public getRetryFunc(): frm.TRetryFunc | null {
        return this._retryfunc;
    }

    /**
     * 请求
     * @param path 请求路径
     * @param param 上传服务器的参数
     * @param post 客户端参数
     * @returns 返回一个 Promise，并且此 Promise 只会 resolve。所以不需要 try-catch
     */
    public req<T = any>(path: string, param?: any, post?: frm.IPostData): Promise<frm.RecvDataEntity<T>> {
        return new Promise((res, _) => {
            let request = this.getRequest(path, param, post);
            let startStampMS = (new Date).getTime();

            let method = 'POST';
            if (post && post._method) method = post._method;

            request.setResponseCallback(data => {
                let duration = (new Date).getTime() - startStampMS;
                let fmtStr = Util.fmtDate('HH:MM:SS', Math.floor(startStampMS / 1000)) + `.${startStampMS % 1000}`;
                log('_________________________________________');
                log(`[HTTP ${method}] ${path} ${fmtStr}-${duration / 1000}`);
                param && log('param:', param);
                post && log('client:', post);
                log('response:', data.ok ? data.data : { code: data.code, msg: data.msg });

                // 成功返回，且注册回调
                if (data.ok && data.post && data.post._cbname) {
                    Data.processNetworkMsg('http', data.post._cbname, data.data, data.post);
                    Gui.processNetworkMsg('http', data.post._cbname, data.data, data.post);
                }
                res(data);
                this._requestCache.push(request);
            });
            request.start();
        });
    }
    ////
    private getRequest(path: string, param?: any, post?: frm.IPostData): Request {
        if (this._requestCache.length > 0) {
            let request = this._requestCache.shift()!;
            request.reset(this._url + '/' + path, param, post);
            return request;
        }
        return new Request(this._url + '/' + path, param, post);
    }
    //private
    private _url: string = "";
    private _gameToken: string = "";
    private _requestCache: Request[] = [];
    private _timeout = 3000;
    private _autoretryCount = 0;
    private _retryfunc: frm.TRetryFunc | null = null;

}
export const Http = HttpMgr.getInstance() as HttpMgr;