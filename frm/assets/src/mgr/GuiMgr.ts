import { Button, Node, Prefab, UIOpacity, director, instantiate, isValid, log, tween, v3, warn } from "cc";
import { frm } from "../Defines";
import { BaseView } from "../gui/BaseView";
import { Toast } from "../gui/Toast";
import { ButtonScale } from "../gui/button/ButtonScale";
import { Pool } from "./PoolMgr";
import { Res } from "./ResMgr";
import { Singleton } from "./Singleton";

interface IViewData {
    uuid: string;
    view: BaseView | null;
    level: number; // 当前 View 所在层级，相同层级的 View，只显示最上层的
    showMaskWhenTop: boolean; // 当前层位于顶端的时候，是否需要显示下层的遮罩
    defaultShowType: number; // 默认显示动画
    defaultHideType: number; // 默认关闭动画
}

interface IPushViewDetail {
    stacks?: boolean;
    showMaskWhenTop?: boolean;
    showType?: number;
    hideType?: number;
    forceHideType?: number;
    suffix?: string;
}

interface IAnimData {
    useDefaultShow: boolean;
    showType: number;
    useDefaultHide: boolean;
    hideType: number;
}

class GuiMgr extends Singleton {

    /**
     * 添加点击事件
     * @param node
     * @param clickEvent
     * @param target
     * @param scale
     * @param interval
     * @returns
     */
    public addBtnClick(node: Node, clickEvent: Function, target: any, scale = 0.95, interval = 200): Node {
        if (!isValid(node)) {
            log('invalid node');
            return node;
        }
        let button = node.getComponent(Button);
        if (!button) node.addComponent(Button);

        let buttonScale = node.getComponent(ButtonScale);
        if (!buttonScale) {
            buttonScale = node.addComponent(ButtonScale);
        }
        buttonScale.setZoomScale(scale);

        if (clickEvent != null) {
            node.off("click");
            node.on("click", (event: any) => {
                if (!this.multipleClick(`click_id:${event._id}`, interval)) {
                    log(`${interval}ms时间内不允许点击`);
                    return;
                }
                clickEvent && clickEvent.call(target, event);
            }, this);
        }
        return node;
    }

    /**
     * 飞字
     * @param msg
     * @param colorHex
     * @returns
     */
    public toast(msg: string, colorHex = '#FFFFFF') {
        let index = this._flyMsgArr.findIndex(v => {
            return v.msg == msg;
        });
        if (index !== -1) return;
        this._flyMsgArr.push({ msg, colorHex });
        if (this._isFlying) return;
        this._checkFlyMsg();
    }

    /**
     * 清楚 View 的引用
     */
    public clear() {
        this._viewLevel = 0;
        this._viewDatas = [];
        this._viewMask = null;
        this._requestMask = null;
        this._loadingMask = null;
        this._isFlying = false;
        this._flyMsgArr = [];
        this._clickCache.clear();
    }

    /**
     * XXXView 压栈
     * @param path XXXView 预制体路径
     * @param data 携带参数
     * @param IPushViewDetail \{stacks:false, showMaskWhenTop:true, showType:0, hideType:0, suffix:''}
     * @returns
     */
    public pushView(path: string | Prefab, data?: any, detail?: IPushViewDetail) {
        detail = detail || {};
        let stacks = typeof detail.stacks === 'undefined' ? false : detail.stacks,
            showMaskWhenTop = typeof detail.showMaskWhenTop === 'undefined' ? true : detail.showMaskWhenTop,
            defaultShowType = typeof detail.showType === 'undefined' ? 0 : detail.showType,
            defaultHideType = typeof detail.hideType === 'undefined' ? 0 : detail.hideType,
            suffix = typeof detail.suffix === 'undefined' ? '' : detail.suffix;

        let uuid: string;
        if (typeof path == 'string') {
            const pathArr = path.split('/');
            const len = pathArr.length;
            if (len < 2) {
                warn(`[Gui.pushView] invalid path: ${path}`);
                return;
            }
            const clsname = pathArr[len - 1];
            uuid = suffix != '' ? `${clsname}_${suffix}` : clsname;
        } else {
            uuid = suffix != '' ? `${path.name}_${suffix}` : path.name;
        }

        for (const viewData of this._viewDatas) {
            if (viewData.uuid == uuid) return;
        }
        const level = this.getViewLevel(stacks);
        this._viewDatas.push({ uuid, view: null, level, showMaskWhenTop, defaultShowType, defaultHideType });

        if (typeof path == 'string') {
            this.setLoadingMask(true);
            Res.loadPrefab(path, (err, prefab) => {
                this.setLoadingMask(false);
                if (err) {
                    this.removeViewData(uuid);
                    return;
                }
                log(`[Gui.pushView] ${path} success!`);
                this.createView(prefab!, data, detail.forceHideType, suffix);
            });
        } else {
            log(`[Gui.pushView] ${path.name} success!`);
            this.createView(path, data, detail.forceHideType, suffix);
        }
    }

    /**
     * `=0`: 弹出所有
     *
     * `>0`: 自上而下，弹出 |n| 层
     *
     * `<0`: 自下而上，保留 |n| 层
     * @param n
     * @param forceShowType 当弹出后，显示的在最上层的View显示动画类型
     * @param forceHideType 当前pop出的弹框隐藏动画类型
     */
    public popView(n = 1, forceShowType?: number, forceHideType?: number) {
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
        this._popViews(popStartIndex, forceShowType, forceHideType);
    }

    /**
     * 将 uuid 对应的 View 上面的所有 View 弹出，如果找不到则不操作。
     * @param uuid
     * @param forceShowType 当弹出后，显示的在最上层的View显示动画类型
     * @param forceHideType 当前pop出的弹框隐藏动画类型
     */
    public popViewUntil(uuid: string, forceShowType?: number, forceHideType?: number) {
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
        this._popViews(popStartIndex, forceShowType, forceHideType);
    }

    /**
     * 弹出最上层 View level 对应的所有 View
     * @param forceShowType 当弹出后，显示的在最上层的View显示动画类型
     * @param forceHideType 当前pop出的弹框隐藏动画类型
     */
    public popViewIfTopLevel(forceShowType?: number, forceHideType?: number) {
        const len = this._viewDatas.length;
        if (len === 0) return;
        const level = this._viewDatas[len - 1].level;
        let n = 1;
        for (let i = len - 2; i >= 0; --i) {
            if (level == this._viewDatas[i].level) {
                n++;
            } else break;
        }

        // 弹出
        this._popViews(n, forceShowType, forceHideType);
    }

    /**
     * 删除 View
     * @param uuid
     * @param forceShowType 当弹出后，显示的在最上层的View显示动画类型
     * @param forceHideType 当前pop出的弹框隐藏动画类型
     * @returns
     */
    public removeView(uuid: string, forceShowType?: number, forceHideType?: number) {
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
            this._popViews(len - 1, forceShowType, forceHideType);
            return;
        }

        if (removeIndex >= len) return;

        let useDefaultHide = typeof forceHideType === 'undefined';
        let hideType = !useDefaultHide ? forceHideType! : 0;
        // 弹出
        for (let i = len - 2; i >= 0; --i) {
            if (removeIndex == i) {
                const viewData = this._viewDatas[i];
                this._viewDatas.splice(i, 1);
                const view = viewData.view!;
                if (isValid(view)) {
                    view.hide(useDefaultHide ? viewData.defaultHideType : hideType, true);
                }
                this.checkLevel(false, forceShowType, forceHideType);
                break;
            }
        }
    }

    /**
     * 查找View
     * 当pushView之后，并不一定能立即查到（可能正在加载）
     * @param uuid
     * @returns
     */
    public findView<T extends BaseView>(uuid: string): T | null {
        const len = this._viewDatas.length;
        for (let i = len - 1; i >= 0; --i) {
            const viewData = this._viewDatas[i];
            if (viewData.uuid === uuid) {
                return viewData.view as T;
            }
        }
        return null;
    }

    /**
     * 是否已经注册了View
     * @param uuid
     * @returns
     */
    public hasRegView(uuid: string): boolean {
        const len = this._viewDatas.length;
        for (let i = len - 1; i >= 0; --i) {
            const viewData = this._viewDatas[i];
            if (viewData.uuid === uuid) {
                return true;
            }
        }
        return false;
    }

    /**
     * 处理网络消息
     * @param prefix
     * @param funcname
     * @param msg
     */
    public processNetworkMsg(prefix: string, funcname: string, ...msg: any[]) {
        // views
        for (let i = this._viewDatas.length - 1; i >= 0; --i) {
            const viewData = this._viewDatas[i];
            if (isValid(viewData.view)) {
                const comp = viewData.view as any;
                const func = comp[`${prefix}_${funcname}`];
                if (func) func.apply(comp, [...msg]);
            }
        }
        // scene
        let scene = director.getScene()!.getChildByName('Canvas')!.getComponent('BaseScene');
        if (scene) {
            const comp = scene as any;
            const func = comp[`${prefix}_${funcname}`];
            if (func) func.apply(comp, [...msg]);
        }
    }

    /**
     * 请求遮罩
     */
    public setRequestMask(visible: boolean) {
        if (visible) {
            if (!isValid(this._requestMask)) {
                this._requestMask = instantiate(Res.preloaded.requestMaskPrefab);
                let root = Res.getRoot(frm.LayerMap.Mask);
                root.addChild(this._requestMask);
            }
            this._requestMask!.active = true;
        } else if (isValid(this._requestMask)) {
            this._requestMask!.active = false;
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

    private randomDelay() {
        return new Promise((res, _) => {
            setTimeout(() => {
                res(void 0);
            }, Math.random() * 3000);
        });
    }

    private createView(prefab: Prefab, data: any, forceHideType: number | undefined, suffix: string) {
        const uuid = suffix != '' ? `${prefab.name}_${suffix}` : prefab.name;
        // 检测是否在栈里
        if (this._viewDatas.findIndex(v => v.uuid == uuid) === -1) {
            return;
        }

        let node = instantiate(prefab),
            viewComp = node.getComponent(prefab.name) as BaseView;

        viewComp.data = data;
        viewComp.setSuffix(suffix);
        viewComp.setVisible(false);
        let root = Res.getRoot(frm.LayerMap.View);
        root.addChild(node);

        // bind view
        let showType = 0, hideType = 0;
        for (let i = this._viewDatas.length - 1; i >= 0; --i) {
            const viewData = this._viewDatas[i];
            if (viewData.uuid == uuid) {
                viewData.view = viewComp;
                showType = viewData.defaultShowType;
                hideType = viewData.defaultHideType;
                break;
            }
        }
        // show status
        this.checkLevel(true, showType, forceHideType);
    }

    private _popViews(startIndex: number, forceShowType?: number, forceHideType?: number) {
        let useDefaultHide = typeof forceHideType === 'undefined';
        let hideType = !useDefaultHide ? forceHideType! : 0;

        const len = this._viewDatas.length;
        if (startIndex >= len) return;

        // 弹出
        for (let i = len - 1; i >= 0; --i) {
            if (i >= startIndex) {
                const viewData = this._viewDatas[i];
                this._viewDatas.splice(i, 1);
                const view = viewData.view!;
                if (isValid(view)) {
                    view.hide(useDefaultHide ? viewData.defaultHideType : hideType, true);
                }
            } else break;
        }

        this.checkLevel(false, forceShowType, forceHideType);
    }

    private checkLevel(fromCreate: boolean, forceShowType?: number, forceHideType?: number) {
        let useDefaultShow = typeof forceShowType === 'undefined';
        let showType = !useDefaultShow ? forceShowType! : 0;
        let useDefaultHide = typeof forceHideType === 'undefined';
        let hideType = !useDefaultHide ? forceHideType! : 0;

        let topIndex = this._viewDatas.length - 1;
        if (topIndex < 0) {
            if (isValid(this._viewMask)) {
                this._viewMask!.active = false;
            }
            return;
        }
        const topViewData = this._viewDatas[topIndex];
        const topView = topViewData.view!;
        if (isValid(topView) && !topView.isVisible()) {
            topView.show(useDefaultShow ? topViewData.defaultShowType : showType, fromCreate);
        }
        // mask
        if (topViewData.showMaskWhenTop) {
            if (!isValid(this._viewMask)) {
                this._viewMask = instantiate(Res.preloaded.viewMaskPrefab);
                let root = Res.getRoot(frm.LayerMap.View);
                root.addChild(this._viewMask);
            }
            this._viewMask!.active = true;
        } else if (isValid(this._viewMask)) {
            this._viewMask!.active = false;
        }

        let level = topViewData.level;
        for (let i = topIndex - 1; i >= 0; --i) {
            const viewData = this._viewDatas[i];
            const view = viewData.view!;
            if (level != viewData.level) {
                level = viewData.level;
                if (isValid(view) && !view.isVisible()) {
                    view.show(useDefaultShow ? viewData.defaultShowType : showType, false);
                }
            } else {
                if (isValid(view)) {
                    view.hide(useDefaultHide ? viewData.defaultHideType : hideType, false);
                }
            }
        }

        // 排序
        let siblingIndex = 0;
        this._viewDatas.forEach((v, i) => {
            if (isValid(v.view)) {
                if (topViewData.showMaskWhenTop && i == this._viewDatas.length - 1) {
                    isValid(this._viewMask) && this._viewMask!.setSiblingIndex(siblingIndex++);
                }
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

    public setLoadingMask(visible: boolean) {
        if (visible) {
            if (!isValid(this._loadingMask)) {
                this._loadingMask = instantiate(Res.preloaded.loadingMaskPrefab);
                let root = Res.getRoot(frm.LayerMap.Mask);
                root.addChild(this._loadingMask);
            }
            this._loadingMask!.active = true;
        } else if (isValid(this._loadingMask)) {
            this._loadingMask!.active = false;
        }
    }

    private multipleClick(key: string, interval: number): boolean {
        let timestamp = (new Date()).valueOf();
        let lastClick = this._clickCache.get(key);
        if (!lastClick) {
            this._clickCache.set(key, { timestamp, interval });
            return true;
        }
        if (timestamp - lastClick.timestamp > lastClick.interval) {
            lastClick.timestamp = timestamp;
            this._clickCache.set(key, lastClick);
            return true;
        }
        return false;
    }

    private _checkFlyMsg() {
        let msgData = this._flyMsgArr.shift();
        if (msgData) {
            this._isFlying = true;
            let node = Pool.getNode(Res.preloaded.toastPrefab, Res.getRoot(frm.LayerMap.Toast));
            let comp = node.getComponent(Toast)!;
            comp.setText(msgData.msg, msgData.colorHex);
            node.setScale(0.2, 0.2);
            node.setPosition(0, 0);
            node.getComponent(UIOpacity)!.opacity = 255;
            let t = tween;
            t(node)
                .parallel(
                    t().by(0.3, { position: v3(0, 50) }),
                    t().to(0.3, { scale: v3(1, 1) })
                )
                .by(0.5, { position: v3(0, 50) })
                .call(() => {
                    this._checkFlyMsg();
                })
                .delay(0.2)
                .parallel(
                    t().call(() => {
                        tween(node.getComponent(UIOpacity)).to(0.5, { opacity: 0 }).start();
                    }),
                    t().by(0.5, { position: v3(0, 60) })
                )
                .call(() => {
                    Pool.putNode(node);
                })
                .start()
        }
        else {
            this._isFlying = false;
        }
    }

    //private
    private _viewLevel = 0;
    private _viewDatas: IViewData[] = [];
    private _viewMask: Node | null = null;
    private _requestMask: Node | null = null;
    private _loadingMask: Node | null = null;
    private _isFlying: boolean = false;
    private _flyMsgArr: { msg: string, colorHex: string }[] = [];
    private _clickCache = new Map<string, any>();
}


export const Gui = GuiMgr.getInstance() as GuiMgr;