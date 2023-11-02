export namespace frm {


    export const LayerMap = {
        View: 'ViewRoot__',
        LoadRes: 'LoadResRoot__',
        Request: 'RequestRoot__',
        Toast: 'ToastRoot__',
    };
    export const Layers = [
        LayerMap.View,
        LayerMap.LoadRes,
        LayerMap.Request,
        LayerMap.Toast,
    ];

    /**
     * 发布类型
     */
    export const Mode = {
        Dev: 'dev',
        Debug: 'debug',
        Release: 'release',
    }

    interface IServerConfig {
        ws?: string;
        http?: string;
    }

    /**
     * 游戏配置
     */
    export interface IGameConfig {
        mode: string;
        version: string;
        servers: { [mode: string]: IServerConfig };
    }

    /**
     * 内部报错码
     */
    export const InnerCode = {
        OK: 0,
        TIMEOUT: -1,
        PARSE_JSON_ERR: -2,
        STATUS_CODE_ERR: -3,
        WEBSOCKET_ERR: -4,
        None: -88889999,
    }

    export interface IPostData {
        /**Data中的回调名称 */
        _cbname?: string;
        /**请求方法 GET/POST */
        _method?: string;
        /**请求超时时间 毫秒 */
        _timeout?: number;
        /**自动重试次数 */
        _autoretry?: number;
        /**请求时是否需要遮罩 */
        _needmask?: boolean;
        /**请求是否需要鉴权 */
        _needauth?: boolean;
        /**重试处理函数 */
        _retryfunc?: (code: number, cancelFunc: () => void, confirmFunc: () => void) => void;
        /**其他需要回传字段 */
        [k: string]: any;
    }

    /**
     * 收到的网络数据实体
     */
    export class RecvDataEntity {
        constructor(post?: IPostData) { this.reset(post); }

        public reset(post?: IPostData) {
            this._post = post;

            this._msg = null;
            this._data = null;
            this._code = InnerCode.None;
        }

        public is(code: number): boolean { return this._code == code; }

        public get ok(): boolean { return this._code == InnerCode.OK; }

        public set code(code: number) { this._code = code; }

        public get data(): any { return this._data; }
        public set data(data: any) { this._data = data; }

        public get msg(): any { return this._msg; }
        public set msg(msg: any) { this._msg = msg; }

        public get post(): IPostData | undefined { return this._post; }
        //private
        private _code = InnerCode.None;
        // 服务器发送的数据
        private _data: any;
        // 客户端携带的数据
        private _post: IPostData | undefined;
        private _msg: string | null = null!;
    }

}