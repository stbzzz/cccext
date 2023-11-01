import { Singleton } from "./Singleton";

export class BaseData {
    public clear() { }

    public constructor(mgr: DataMgr, name: string, priority: number) {
        this._mgr = mgr;
        this._name = name;
        this._priority = priority;
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

    public addData<T extends BaseData>(data: T) {

    }

    /**
     * 处理网络消息
     * @param prefix 
     * @param funcname 
     * @param msg 
     */
    public processNetworkMsg(prefix: string, funcname: string, ...msg: any[]) {

    }

    //private
    private _dataArr: any[] = [];
    private _dataMap = new Map<string, any>();
}

export const Data = DataMgr.getInstance() as DataMgr;