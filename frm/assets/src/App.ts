import { Component, _decorator } from "cc";
import { frm } from "./Defines";
import { PreloadRes } from "./PreloadRes";

const { requireComponent, property } = _decorator;

@requireComponent(PreloadRes)
export class App extends Component {

    protected onLoad(): void {
        const preloadRes = this.getComponent(PreloadRes)!;
        const gameConfig = preloadRes.gameConfigJson.json as frm.IGameConfig;
        const serverConfig = gameConfig.servers[gameConfig.mode];
        this.onCreate(serverConfig.ws, serverConfig.http);
    }

    protected onCreate(wsUrl?: string, httpUrl?: string) { }

}