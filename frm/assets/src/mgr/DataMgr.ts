import { Singleton } from "./Singleton";

export class BaseData {
    public clear() { }

    public constructor(name: string, priority: number) {
        this._name = name;
        this._priority = priority;
    }

    public init(mgr: DataMgr) {
        this._mgr = mgr;
    }

    public get mgr(): DataMgr {
        return this._mgr;
    }

    public get name(): string { return this._name; }
    // priority 优先级越高，越靠前执行。优先级一样，则先加入的先执行。
    public get priority(): number { return this._priority; }

    //private
    private _name: string;
    private _priority: number;
    private _mgr: DataMgr = null!;
}

class DataMgr extends Singleton {

    public get<T extends BaseData>(key: string): T {
        return this._dataMap.get(key) as T;
    }

    /**
     * 优先级越高，越先执行
     * @param data
     */
    public addData<T extends BaseData>(data: T) {
        data.init(this);
        let priority = data.priority;
        this._dataMap.set(data.name, data);
        let len = this._dataArr.length;
        let position = 0;
        for (let i = len - 1; i >= 0; --i) {
            let _priority = this._dataArr[i].priority;
            if (priority <= _priority) {
                position = i + 1;
                break;
            }
        }
        this._dataArr.splice(position, 0, data);
    }

    /**
     * 处理网络消息
     * @param prefix
     * @param funcname
     * @param msg
     */
    public processNetworkMsg(prefix: string, funcname: string, ...msg: any[]) {
        for (let data of this._dataArr) {
            let func = data[`${prefix}_${funcname}`];
            if (func) func.apply(data, [...msg]);
        }
    }

    //private
    private _dataArr: any[] = [];
    private _dataMap = new Map<string, any>();
}

export const Data = DataMgr.getInstance() as DataMgr;