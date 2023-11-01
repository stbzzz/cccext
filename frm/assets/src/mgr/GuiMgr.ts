import { Prefab, __private, director, error, isValid, warn } from "cc";
import { BaseScene } from "../gui/BaseScene";
import { BaseView } from "../gui/BaseView";
import { Res } from "./ResMgr";
import { Singleton } from "./Singleton";

interface IViewData {
    uuid: string;
    view: BaseView | null;
    showMask: boolean; // 是否显示遮罩
    depth: number; // 最上层向下，前 depth 层都会显示
}

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

    public pushView(bundlename: string, path: string, data?: any, showMask = false, depth = 0, suffix = '') {
        const pathArr = path.split('/');
        const len = pathArr.length;
        if (len == 0) {
            warn('[Gui.addView] invalid path: ', path);
            return;
        }
        const clsname = pathArr[len - 1];
        const uuid = suffix != '' ? `${clsname}_${suffix}` : clsname;
        for (const viewData of this._viewDatas) {
            if (viewData.uuid == uuid) return;
        }
        this._viewDatas.push({ uuid, view: null, showMask, depth });

        // add load prefab mask
        Res.loadPrefab(bundlename, path, (err, prefab) => {
            if (err) {
                // remove load prefab mask
                this.removeViewData(uuid);
                return;
            }
            try {
                this.pushPreloadView(prefab!, data, showMask, depth, suffix);
            } catch (e) {
                // remove load prefab mask
                this.removeViewData(uuid);
            }
        });
    }

    public pushPreloadView(prefab: Prefab, data?: any, showMask = false, depth = 0, suffix = '') {

    }

    /**
     * `=0`:弹出所有
     * 
     * `>0`:从上到下弹出 depth 层
     * 
     * `<0`:从下到上弹出 depth 层
     * @param depth 
     */
    public popView(depth = 0) {

    }

    /**
     * 将 uuid 对应的 View 上面的所有 View 弹出，如果找不到则不操作。
     * @param uuid 
     */
    public popToView(uuid: string) {

    }

    /**
     * 将 uuid 对应的 View ，提到最上面。
     * @param uuid 
     */
    public upToView(uuid: string) {

    }

    /**
     * 处理网络消息
     * @param prefix 
     * @param funcname 
     * @param msg 
     */
    public processNetworkMsg(prefix: string, funcname: string, ...msg: any[]) {
        for (let i = this._viewDatas.length - 1; i >= 0; --i) {
            const viewData = this._viewDatas[i];
            if (isValid(viewData.view)) {
                const comp = viewData.view as any;
                const func = comp[`${prefix}_${funcname}`];
                if (func) func.apply(comp, [...msg]);
            }
        }
    }

    /**
     * 删除 viewData 并，销毁 BaseView
     * @param uuid 
     */
    private removeViewData(uuid: string) {
        for (let i = this._viewDatas.length - 1; i >= 0; --i) {
            const viewData = this._viewDatas[i];
            if (viewData.uuid == uuid) {
                this._viewDatas.splice(i, 1);
                if (isValid(viewData.view)) {
                    viewData.view!.node.destroy();
                }
                break;
            }
        }
    }

    //private
    private _viewDatas: IViewData[] = [];
}


export const Gui = GuiMgr.getInstance() as GuiMgr;