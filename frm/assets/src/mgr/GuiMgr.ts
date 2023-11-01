import { __private, director, error } from "cc";
import { BaseScene } from "../gui/BaseScene";
import { Singleton } from "./Singleton";

class GuiMgr extends Singleton {

    /**
     * 进入场景
     * @param name 场景名称
     * @param onProgressCb 进度回调。(传值:走完进度进入场景 | 不传值:直接进入场景)
     */
    public runScene(name: string, onProgressCb?: (progress: number) => void) {
        if (onProgressCb) {
            let progress = 0;
            director.preloadScene(name, (c, t) => {
                let p = c / t;
                if (p > progress) {
                    progress = p;
                    onProgressCb(progress);
                }
            }, err => {
                if (err) {
                    error(err);
                    return;
                }
                director.loadScene(name);
            });
        } else director.loadScene(name);
    }

    /**
     * 获取当前场景
     *
     * XXXScene 继承自 BaseScene，且挂载在 Canvas 下
     * @returns
     */
    public getScene<T extends BaseScene>(classConstructor: __private._types_globals__Constructor<T> | __private._types_globals__AbstractedConstructor<T>): T {
        return director.getScene()!.getChildByName('Canvas')!.getComponent(classConstructor)!;
    }

    public addView(viewData: any, data?: any) {

    }

    public removeView(uuid: string) {

    }
}


export const Gui = GuiMgr.getInstance() as GuiMgr;