import { Node, Prefab, __private, director, error, instantiate, isValid, log, warn } from "cc";
import { frm } from "../Defines";
import { BaseScene } from "../gui/BaseScene";
import { BaseView } from "../gui/BaseView";
import { Closeable } from "../gui/comp/Closeable";
import { Res } from "./ResMgr";
import { Singleton } from "./Singleton";

interface IViewData {
    uuid: string;
    view: BaseView | null;
    level: number; // 当前 View 所在层级，相同层级的 View，只显示最上层的
    showMaskWhenTop: boolean; // 当前层位于顶端的时候，是否需要显示下层的遮罩
}

class GuiMgr extends Singleton {

    public toast(msg: string, colorHex = '#FFFFFF') {
    }

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

    public pushView(bundlename: string, path: string, data?: any, stacks = false, showMaskWhenTop = false, showType = 0, hideType = 0, suffix = '') {
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

        const level = this.getViewLevel(stacks);
        this._viewDatas.push({ uuid, view: null, level, showMaskWhenTop });

        this.setLoadingMask(true);
        Res.loadPrefab(bundlename, path, (err, prefab) => {
            if (err) {
                this.setLoadingMask(false);
                this.removeViewData(uuid);
                return;
            }
            try {
                this.createView(prefab!, data, showType, hideType, suffix);
            } catch (e) {
                this.setLoadingMask(false);
                this.removeViewData(uuid);
            }
        });
    }

    public pushPreloadView(prefab: Prefab, data?: any, stacks = false, showMaskWhenTop = false, showType = 0, hideType = 0, suffix = '') {
        const uuid = suffix != '' ? `${prefab.name}_${suffix}` : prefab.name;
        for (const viewData of this._viewDatas) {
            if (viewData.uuid == uuid) return;
        }

        const level = this.getViewLevel(stacks);
        this._viewDatas.push({ uuid, view: null, level, showMaskWhenTop });
        this.createView(prefab, data, showType, hideType, suffix);
    }

    /**
     * `=0`: 弹出所有
     *
     * `>0`: 自上而下，弹出 |n| 层
     *
     * `<0`: 自下而上，保留 |n| 层
     * @param depth
     */
    public popView(n = 1, showType = 0, hideType = 0) {
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
        this._popViews(popStartIndex, showType, hideType);
    }

    /**
     * 将 uuid 对应的 View 上面的所有 View 弹出，如果找不到则不操作。
     * @param uuid
     */
    public popViewUtil(uuid: string, showType = 0, hideType = 0) {
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
        this._popViews(popStartIndex, showType, hideType);
    }

    /**
     * 弹出最上层 View level 对应的所有 View
     * @param showType 
     * @param hideType 
     */
    public popViewIfTopLevel(showType = 0, hideType = 0) {
        const len = this._viewDatas.length;
        if (len === 0) return;
        const level = this._viewDatas[len - 1].level;
        let n = 1;
        for (let i = len - 2; i >= 0; --i) {
            if (level == this._viewDatas[i].level) {
                n++;
            } else break;
        }
        this.popView(n);
    }

    /**
     * 删除 View
     * @param uuid
     * @returns
     */
    public removeView(uuid: string, showType = 0, hideType = 0) {
        log('uuid->', uuid);
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
            this._popViews(len - 1, showType, hideType);
            return;
        }

        if (removeIndex >= len) return;

        // 弹出
        for (let i = len - 1; i >= 0; --i) {
            if (removeIndex == i) {
                const viewData = this._viewDatas[i];
                this._viewDatas.splice(i, 1);
                const view = viewData.view!;
                if (isValid(view) && (!view.isVisible() || !view.onHide(hideType, true))) {
                    view.node.destroy();
                }
                this.checkLevel(showType, hideType);
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

    private async createView(prefab: Prefab, data: any, showType: number, hideType: number, suffix: string) {
        let root = Res.getRoot(frm.LayerMap.View);
        let node = instantiate(prefab),
            closeableComp = node.getComponent(Closeable)!,
            viewComp = node.getComponent(prefab.name) as BaseView;

        viewComp.init(data);
        closeableComp.init(suffix);
        viewComp.setVisible(false);
        root.addChild(node);

        const uuid = suffix != '' ? `${prefab.name}_${suffix}` : prefab.name;
        // bind view
        for (let i = this._viewDatas.length - 1; i >= 0; --i) {
            const viewData = this._viewDatas[i];
            if (viewData.uuid == uuid) {
                viewData.view = viewComp;
                break;
            }
        }
        // show status
        this.checkLevel(showType, hideType);
    }

    private _popViews(startIndex: number, showType: number, hideType: number) {
        const len = this._viewDatas.length;
        if (startIndex >= len) return;

        // 弹出
        for (let i = len - 1; i >= 0; --i) {
            if (i >= startIndex) {
                const viewData = this._viewDatas[i];
                this._viewDatas.splice(i, 1);
                const view = viewData.view!;
                if (isValid(view) && (!view.isVisible() || !view.onHide(hideType, true))) {
                    view.node.destroy();
                }
            } else break;
        }

        this.checkLevel(showType, hideType);
    }

    private checkLevel(showType: number, hideType: number) {
        let topIndex = this._viewDatas.length - 1;
        if (topIndex < 0) return;
        const topViewData = this._viewDatas[topIndex];
        const topView = topViewData.view!;
        if (isValid(topView) && !topView.isVisible() && !topView.onShow(showType)) {
            topView.setVisible(true);
        }
        // mask
        if (topViewData.showMaskWhenTop) {
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

        let level = topViewData.level;
        for (let i = topIndex - 1; i >= 0; --i) {
            const viewData = this._viewDatas[i];
            const view = viewData.view!;
            if (level != viewData.level) {
                level = viewData.level;
                if (isValid(view) && !view.isVisible() && !view.onShow(showType)) {
                    view.setVisible(true);
                }
            } else {
                if (isValid(view) && view.isVisible() && !view.onHide(hideType, false)) {
                    view.setVisible(false);
                }
            }
        }

        // 排序
        let siblingIndex = 0;
        this._viewDatas.forEach(v => {
            if (isValid(v.view) && v.view!.node.active) {
                v.view!.node.setSiblingIndex(siblingIndex++);
            }
        });
    }

    private getViewLevel(stacks: boolean): number {
        const len = this._viewDatas.length;
        if (len === 0) {
            this._viewLevel = 0;
            return 0;
        }
        if (stacks) {
            this._viewLevel++;
        } else {
            this._viewLevel = this._viewDatas[len - 1].level;
        }
        return this._viewLevel;
    }

    //private
    private _viewLevel = 0;
    private _viewDatas: IViewData[] = [];
    private _viewMask: Node = null!;
}


export const Gui = GuiMgr.getInstance() as GuiMgr;