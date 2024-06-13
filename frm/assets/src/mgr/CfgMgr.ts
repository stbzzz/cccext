import { JsonAsset } from "cc";
import { Singleton } from "./Singleton";

class CfgMgr extends Singleton {

    public getJson<T>(name: string): T {
        return this._jsons[name] as T;
    }

    public getJsonById<T>(name: string, id: number | string): T {
        return this._jsons[name][id] as T;
    }

    public getJsonByIds<T>(name: string, ids: number[] | string[]): T {
        let json = this.getJsonById(name, ids[0]);
        for (let i = 1; i < ids.length; i++) {
            json = (json as any)[ids[i]];
        }
        return json as T;
    }

    public initJsonAssets(jsonAssets: JsonAsset[]) {
        for (let jsonAsset of jsonAssets) {
            let name = jsonAsset.name;
            this._jsons[name] = jsonAsset.json;
        }
    }

    public setJson(name: string, data: any) {
        this._jsons[name] = data;
    }

    //private
    private _jsons: { [name: string]: any } = {};
}

export const Cfg = CfgMgr.getInstance() as CfgMgr;