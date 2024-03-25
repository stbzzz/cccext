import { Component, JsonAsset, Prefab, _decorator, director } from "cc";
import { Timer } from "./mgr/TimerMgr";

const { ccclass, property } = _decorator;

@ccclass('PreloadRes')
export class PreloadRes extends Component {

    @property(JsonAsset)
    public gameConfigJson: JsonAsset = null!;

    @property(Prefab)
    public toastPrefab: Prefab = null!;

    @property(Prefab)
    public viewMaskPrefab: Prefab = null!;

    @property(Prefab)
    public requestMaskPrefab: Prefab = null!;

    @property(Prefab)
    public loadingMaskPrefab: Prefab = null!;


    protected onLoad(): void {
        director.addPersistRootNode(this.node);
    }

    protected update(dt: number): void {
        Timer.updateLogic(dt);
    }

}