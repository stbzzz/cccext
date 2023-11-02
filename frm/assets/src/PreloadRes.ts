import { Component, JsonAsset, Prefab, _decorator, director, profiler } from "cc";
import { frm } from "./Defines";
import { Timers } from "./mgr/TimerMgr";

const { ccclass, property } = _decorator;

@ccclass('PreloadRes')
export class PreloadRes extends Component {

    @property(JsonAsset)
    public gameConfigJson: JsonAsset = null!;

    @property(Prefab)
    public viewMaskPrefab: Prefab = null!;


    protected onLoad(): void {
        director.addPersistRootNode(this.node);

        const gameConfig = this.gameConfigJson.json as frm.IGameConfig;
        if (gameConfig.mode == frm.Mode.Release) {
            profiler.hideStats();
        } else {
            profiler.showStats();
        }

        console.log(`Game ver: ${gameConfig.version}, mode: ${gameConfig.mode}`);
    }

    protected update(dt: number): void {
        Timers.updateLogic(dt);
    }

}