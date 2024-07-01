import { Component, _decorator } from "cc";
import { PreloadRes } from "./PreloadRes";

const { ccclass, requireComponent, property } = _decorator;

@ccclass('MyApp')
@requireComponent(PreloadRes)
export class App extends Component {
    protected onLoad(): void {
        this.onCreate();
    }
    protected onCreate() { }
}