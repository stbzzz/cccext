import { Node, Prefab, __private, director, error, instantiate, isValid, warn } from "cc";
import { frm } from "../Defines";
import { BaseScene } from "../gui/BaseScene";
import { BaseView } from "../gui/BaseView";
import { Closeable } from "../gui/comp/Closeable";
import { Res } from "./ResMgr";
import { Singleton } from "./Singleton";

interface IViewData {
    uuid: string;
    view: BaseView | null;
    showUUIDs: string[];
    showMaskWhenTop: boolean; // 当前层位于顶端的时候，是否需要显示下层的遮罩
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

    public pushView(bundlename: string, path: string, data?: any, showUUIDs: string[] = [], showMaskWhenTop = false, enterType = 0, exitType = 0, suffix = '') {
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
        this._viewDatas.push({ uuid, view: null, showMaskWhenTop, showUUIDs });

        this.setLoadingMask(true);
        Res.loadPrefab(bundlename, path, (err, prefab) => {
            if (err) {
                this.setLoadingMask(false);
                this.removeViewData(uuid);
                return;
            }
            try {
                this.createView(prefab!, data, enterType, exitType, suffix);
            } catch (e) {
                this.setLoadingMask(false);
                this.removeViewData(uuid);
            }
        });
    }

    public pushPreloadView(prefab: Prefab, data?: any, showUUIDs: string[] = [], showMaskWhenTop = false, depth = 0, enterType = 0, exitType = 0, suffix = '') {
        const uuid = suffix != '' ? `${prefab.name}_${suffix}` : prefab.name;
        for (const viewData of this._viewDatas) {
            if (viewData.uuid == uuid) return;
        }
        this._viewDatas.push({ uuid, view: null, showMaskWhenTop, showUUIDs: showUUIDs });
        this.createView(prefab, data, enterType, exitType, suffix);
    }

    private createView(prefab: Prefab, data: any, enterType: number, exitType: number, suffix: string) {
        let root = Res.getRoot(frm.LayerMap.View);
        let node = instantiate(prefab),
            closeableComp = node.getComponent(Closeable)!,
            viewComp = node.getComponent(prefab.name) as BaseView;

        viewComp.init(data);
        closeableComp.init(suffix);
        viewComp.setVisible(false);
        root.addChild(node);

        const uuid = suffix != '' ? `${prefab.name}_${suffix}` : prefab.name;
        this.insertView(uuid, viewComp);
        this.checkViewStatus(uuid, enterType, exitType);
    }

    private checkViewStatus(uuid: string, enterType: number, exitType: number) {
        const index = this._viewDatas.findIndex(v => v.uuid == uuid);
        if (index !== this._viewDatas.length - 1) return;

        let showMap = new Map<string, boolean>();
        const topViewData = this._viewDatas[index];
        topViewData.view!.setVisible(true);
        topViewData.view!.onShow(enterType);
        topViewData.showUUIDs.forEach(v => {
            showMap.set(v, true);
        });
        this.setViewMask(topViewData.showMaskWhenTop);

        for (let i = this._viewDatas.length - 2; i >= 0; --i) {
            let viewData = this._viewDatas[i];
            if (isValid(viewData.view)) {
                let visible = showMap.get(viewData.uuid) || false;
                if (visible) {
                    viewData.view!.setVisible(true);
                } else {
                    if (viewData.view!.isVisible()) {
                        viewData.view!.onHide(exitType);
                    }
                }
            }
        }

    }

    /**
     * `=0`: 弹出所有
     *
     * `>0`: 自上而下，弹出  n 层
     *
     * `<0`: 自下而上，保留 -n 层
     * @param depth
     */
    public popView(enterType = 0, exitType = 0, n = 1) {
        const len = this._viewDatas.length;
        if (len === 0) return;
        if (-n >= len) return;

        let popStartIndex = 0;
        if (n > 0) {
            popStartIndex = len - n < 0 ? 0 : len - n;
        } else if (n < 0) {
            popStartIndex = -n;
        }

        // 弹出
        this._popViews(popStartIndex, enterType, exitType);
    }

    /**
     * 将 uuid 对应的 View 上面的所有 View 弹出，如果找不到则不操作。
     * @param uuid
     */
    public popToView(enterType = 0, exitType = 0, uuid: string) {
        const len = this._viewDatas.length;
        if (len === 0) return;
        let popStartIndex = len;
        for (let i = len - 1; i >= 0; --i) {
            const viewData = this._viewDatas[i];
            if (viewData.uuid === uuid) {
                popStartIndex = i + 1;
                break;
            }
        }
        if (popStartIndex >= len) return;

        // 弹出
        this._popViews(popStartIndex, enterType, exitType);
    }

    /**
     * 删除 View
     * @param uuid
     * @returns
     */
    public removeView(uuid: string) {
        const len = this._viewDatas.length;
        if (len === 0) return;
        let removeIndex = len;
        for (let i = len - 1; i >= 0; --i) {
            const viewData = this._viewDatas[i];
            if (viewData.uuid === uuid) {
                removeIndex = i;
                break;
            }
        }
        if (removeIndex == len - 1) {
            this._popViews(len - 1, 0, 0);
            return;
        }

        if (removeIndex >= len) return;

        // 弹出
        for (let i = len - 1; i >= 0; --i) {
            if (removeIndex == i) {
                const viewData = this._viewDatas[i];
                this._viewDatas.splice(i, 1);
                if (isValid(viewData.view)) {
                    if (viewData.view!.isVisible()) {
                        viewData.view!.onHide(0, true);
                    } else {
                        viewData.view!.node.destroy();
                    }
                }
                break;
            }
        }
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

    public setRequestMask(visible: boolean) {

    }

    public setLoadingMask(visible: boolean) {

    }

    private setViewMask(visible: boolean) {
        if (visible) {
            if (!isValid(this._viewMask)) {
                this._viewMask = instantiate(Res.preloaded.viewMaskPrefab);
                let root = Res.getRoot(frm.LayerMap.View);
                root.addChild(this._viewMask);
                let index = root.children.length - 2;
                if (index < 0) {
                    index = 0;
                }
                this._viewMask.setSiblingIndex(index);
            }
            this._viewMask.active = true;
        } else if (isValid(this._viewMask)) {
            this._viewMask.active = false;
        }
    }

    public toast(msg: string, colorHex = '#FFFFFF') {
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

    private insertView<T extends BaseView>(uuid: string, view: T) {
        for (let viewData of this._viewDatas) {
            if (viewData.uuid == uuid) {
                viewData.view = view;
                break;
            }
        }
    }

    private _popViews(startIndex: number, enterType: number, exitType: number) {
        const len = this._viewDatas.length;
        if (startIndex >= len) return;

        // 弹出
        for (let i = len - 1; i >= 0; --i) {
            if (i >= startIndex) {
                const viewData = this._viewDatas[i];
                this._viewDatas.splice(i, 1);
                if (isValid(viewData.view)) {
                    if (viewData.view!.isVisible()) {
                        viewData.view!.onHide(exitType, true);
                    } else {
                        viewData.view!.node.destroy();
                    }
                }
            }
        }

        // 置顶下一层
        let topIndex = startIndex - 1;
        if (topIndex < 0) return;
        const viewData = this._viewDatas[topIndex];
        if (isValid(viewData.view)) {
            if (!viewData.view!.isVisible()) {
                viewData.view!.onShow(enterType);
            }
        }
        this.setViewMask(viewData.showMaskWhenTop);
    }

    //private
    private _viewDatas: IViewData[] = [];
    private _viewMask: Node = null!;
}


export const Gui = GuiMgr.getInstance() as GuiMgr;