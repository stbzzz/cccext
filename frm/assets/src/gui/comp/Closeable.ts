
import { Component, _decorator } from "cc";
import { Gui } from "../../mgr/GuiMgr";
const { ccclass } = _decorator;

@ccclass('Closeable')
export class Closeable extends Component {

    public init(suffix: string) {
        this._suffix_$abc = suffix;
    }

    /**
     * 关闭 view
     */
    public onClickClose() {
        const uuid = this._suffix_$abc != '' ? `${this.node.name}_${this._suffix_$abc}` : this.node.name;
        Gui.removeView(uuid);
    }

    //private
    private _suffix_$abc: string = '';

}