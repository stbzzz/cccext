import { Component, Enum, _decorator, profiler } from "cc";
import { frm } from "./Defines";
import { PreloadRes } from "./PreloadRes";

const { requireComponent } = _decorator;


const ModeEnum = Enum(frm.Mode);


const { ccclass, property } = _decorator;

@ccclass('MyApp')
@requireComponent(PreloadRes)
export class App extends Component {
    @property({ type: ModeEnum })
    protected mode = ModeEnum.Dev;

    protected onLoad(): void {
        const preloadRes = this.getComponent(PreloadRes)!;
        const gameConfig = preloadRes.gameConfigJson.json as frm.IGameConfig;

        if (this.mode == frm.Mode.Release) {
            profiler.hideStats();
        } else {
            profiler.showStats();
        }
        this.onCreate(gameConfig);
    }

    protected onCreate(gameConfig: frm.IGameConfig) { }

}