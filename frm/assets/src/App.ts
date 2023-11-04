import { Component, _decorator } from "cc";
import { frm } from "./Defines";
import { PreloadRes } from "./PreloadRes";

const { requireComponent } = _decorator;

@requireComponent(PreloadRes)
export class App extends Component {

    protected onLoad(): void {
        const preloadRes = this.getComponent(PreloadRes)!;
        const gameConfig = preloadRes.gameConfigJson.json as frm.IGameConfig;
        this.onCreate(gameConfig);
    }

    protected onCreate(gameConfig: frm.IGameConfig) { }

}