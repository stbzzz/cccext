import { Canvas, _decorator } from "cc";
import { Gui } from "../mgr/GuiMgr";
import { Res } from "../mgr/ResMgr";
import { Foundation } from "./Foundation";
const { requireComponent } = _decorator;

@requireComponent(Canvas)
export class BaseScene extends Foundation {

    /**
     * 继承自 Component，子类覆写需要调用 `super.onLoad();`
     */
    protected onLoad(): void {
        Res.initLayers();
    }

    /**
     * 继承自 Component，子类覆写需要调用 `super.onDestroy();`
     */
    protected onDestroy(): void {
        Gui.clear();
        Res.clear();
    }

}