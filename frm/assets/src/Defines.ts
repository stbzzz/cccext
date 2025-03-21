import { Node } from "cc";

export namespace frm {

    export const LayerMap = {
        View: 'ViewRoot__',
        Mask: 'MaskRoot__', // LoadRes | Request
        Toast: 'ToastRoot__',
    };
    export const Layers = [
        LayerMap.View,
        LayerMap.Mask,
        LayerMap.Toast,
    ];

    /////////////////////////////////////////////
    // ListView
    /////////////////////////////////////////////
    /**
     * 列表包装类
     */
    export class ListData<T = any> {
        constructor(index: number, data: T, extra?: any) {
            this._extra = extra;
            this._origin = data;
            this._index = index;
        }

        public get extra(): any { return this._extra; }
        public get index(): number { return this._index; }

        public set origin(d: T) { this._origin = d; }
        public get origin(): T { return this._origin; }

        public set selected(b: boolean) { this._selected = b; }
        public get selected(): boolean { return this._selected; }

        //private
        private _origin: T;
        private _index = 0;
        private _extra: any;
        private _selected = false;
    }

    /**
     * 列表包装函数
     * 排序、从对象变为列表，应当在外部操作
     * @param arrSource 源数据
     * @param condFunc 过滤函数
     * @param extraFunc 将原数据添加额外数据
     * @returns
     */
    export function WrapListData<T>(arrSource: T[], condFunc?: (data: T) => boolean, extraFunc?: (data: T) => any): ListData<T>[] {
        if (!arrSource) return [];
        let list: ListData<T>[] = [];
        for (let v of arrSource) {
            let pass = true;
            if (condFunc) {
                pass = condFunc(v);
            }
            if (!pass) continue;

            let index = list.length;
            let extra = void 0;
            if (extraFunc) {
                extra = extraFunc(v);
            }
            let data = new ListData(index, v, extra);
            list.push(data);
        }
        return list;
    }

    /**
     *
     * @param arrSource 源数据
     * @param childCount 孩子数量
     * @param condFunc 过滤函数
     * @param extraFunc 将原数据添加额外数据
     * @returns
     */
    export function WrapListDataGroup<T>(arrSource: T[], childCount: number, condFunc?: (data: T) => boolean, extraFunc?: (data: T) => any): ListData<T>[][] {
        if (!arrSource) return [];

        let list: ListData<T>[][] = [];

        let row = 0;
        let rank = 0;
        for (let i = 0, l = arrSource.length; i < l; ++i) {
            let v = arrSource[i];

            let pass = true;
            if (condFunc) {
                pass = condFunc(v);
            }
            if (!pass) continue;

            if (!list[row]) {
                list[row] = [];
            }
            if (list[row].length == childCount) {
                row++;
            }
            if (!list[row]) {
                list[row] = [];
            }

            let extra = void 0;
            if (extraFunc) {
                extra = extraFunc(v);
            }
            let data = new ListData(rank++, v, extra);
            list[row].push(data);
        }

        return list;
    }
    export type ListViewItemClick<T> = (node: Node, data: ListData<T>, cmd?: string) => void;

    /////////////////////////////////////////////
    // 网络请求
    /////////////////////////////////////////////
    export type TRetryFunc = (code: number, cancelFunc: () => void, confirmFunc: () => void) => void;
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
        _retryfunc?: TRetryFunc;
        _ignoreRetryFunc?: boolean;
        _baseUrl?: string;
        _contentType?: string;
        /**其他需要回传字段 */
        [k: string]: any;
    }

    /**
     * 收到的网络数据实体
     */
    export class RecvDataEntity<T = any> {
        constructor(post?: IPostData) { this.reset(post); }

        public reset(post?: IPostData) {
            this._post = post;

            this._msg = '';
            this._data = {};
            this._code = InnerCode.None;
        }

        public is(code: number): boolean { return this._code == code; }

        public get ok(): boolean { return this._code == InnerCode.OK; }

        public get code(): number { return this._code; }
        public set code(code: number) { this._code = code; }

        public get data(): T | null { return this._data; }
        public set data(data: T) { this._data = data || {}; }

        public get msg(): string { return this._msg; }
        public set msg(msg: string) { this._msg = msg; }

        public get post(): IPostData | undefined { return this._post; }
        //private
        private _code = InnerCode.None;
        // 服务器发送的数据
        private _data: any = {};
        // 客户端携带的数据
        private _post: IPostData | undefined;
        private _msg: string = '';
    }

}