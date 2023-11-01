import { JsonAsset } from "cc";
import { Singleton } from "./Singleton";

class CfgMgr extends Singleton {

    public getJson<T>(name: string): T {
        return this._jsons[name] as T;
    }

    public getJsonById<T>(name: string, id: number | string): T {
        return this._jsons[name][id] as T;
    }

    public initJsonAssets(jsonAssets: JsonAsset[]) {
        for (let jsonAsset of jsonAssets) {
            let name = jsonAsset.name;
            this._jsons[name] = jsonAsset.json;
        }
    }

    //private
    private _jsons: { [name: string]: any } = {};
}

export const Cfg = CfgMgr.getInstance() as CfgMgr;