import { instantiate, Node, NodePool, Prefab } from "cc";
import { Singleton } from "./Singleton";

class PoolMgr extends Singleton {

    private _dictPool: { [name: string]: NodePool } = {};

    public getNode(prefab: Prefab, parent: Node, handler?: string): Node {
        let name = prefab.data.name;
        let node: Node;
        if (this._dictPool.hasOwnProperty(name)) {
            let pool = this._dictPool[name];
            if (pool.size() > 0) {
                node = pool.get()!;
            } else {
                node = instantiate(prefab);
            }
        } else {
            let pool = new NodePool(handler);
            this._dictPool[name] = pool;
            node = instantiate(prefab);
        }

        parent.addChild(node);
        return node;
    }

    public putNode(node: Node) {
        this._dictPool[node.name]?.put(node);
    }

    public clearPool(name: string) {
        this._dictPool[name]?.clear();
        delete this._dictPool[name];
    }

    public clearAll() {
        for (let name in this._dictPool) {
            this.clearPool(name);
        }
    }
}
export const Pool = PoolMgr.getInstance() as PoolMgr;