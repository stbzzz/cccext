import { Component, Node, Prefab, instantiate, isValid, log, warn } from "cc";
import { Dispatcher } from "../mgr/DispatcherMgr";
import { Gui } from "../mgr/GuiMgr";
import { Res } from "../mgr/ResMgr";

/**
 * 时钟回调函数类型
 * @returns completed 是否完成
 */
export type ClockFn = () => boolean;
export type EmptyFn = () => void;

interface IClock {
    cb: ClockFn;
    agent: EmptyFn;
}

interface IWidgetDetail {
    parent?: Node;
}

interface IWidgetData {
    uuid: string;
    widget: BaseWidget | null;
}

export class Foundation extends Component {

    /**
     * 添加 widget
     * @param path
     * @param data
     * @param detail
     * @returns
     */
    public addWidget(path: string | Prefab, data?: any, detail?: IWidgetDetail) {
        detail = detail || {};
        let parent = typeof detail.parent === 'undefined' ? this.node : detail.parent;

        let uuid: string;
        if (typeof path == 'string') {
            const pathArr = path.split('/');
            const len = pathArr.length;
            if (len < 2) {
                warn(`[Foundation#addWidget] invalid path: ${path}`);
                return;
            }
            uuid = pathArr[len - 1];
        } else {
            uuid = path.name;
        }

        for (const widgetData of this._widgetDatas) {
            if (widgetData.uuid == uuid) return;
        }
        this._widgetDatas.push({ uuid, widget: null });

        if (typeof path == 'string') {
            Gui.setLoadingMask(true);
            Res.loadPrefab(path, (err, prefab) => {
                Gui.setLoadingMask(false);
                if (err) {
                    this.removeWidgetData(uuid);
                    return;
                }
                log(`[Foundation#addWidget] ${path} success!`);
                this.createWidget(parent, prefab!, data);
            });
        } else {
            this.createWidget(parent, path, data);
        }
    }

    /**
     * 移除 widget
     * @param name
     */
    public removeWidget(name: string) {
        const len = this._widgetDatas.length;
        // 弹出
        for (let i = len - 1; i >= 0; --i) {
            const widgetData = this._widgetDatas[i];
            if (widgetData.uuid == name) {
                this._widgetDatas.splice(i, 1);
                const view = widgetData.widget!;
                if (isValid(view)) {
                    view.node.destroy();
                }
                break;
            }
        }
    }

    /**
     * 添加事件
     *
     * 应当在 #onLoad 中添加，当 #onDestroy 时，会统一移除
     * @param cb 回调，当 `cb` 返回 `true` 表明调度完成，会删除时钟。
     * @param interval 时间间隔(s)
     */
    protected addClock(cb: ClockFn, interval = 1) {
        if (cb.call(this)) return;

        for (let clock of this._clocks) {
            if (clock.cb === cb) {
                warn('cb has already reg');
                return;
            }
        }

        let agent = () => {
            if (cb.call(this)) {
                // remove
                let index = this._clocks.findIndex(clock => {
                    return clock.cb === cb;
                });
                if (index !== -1) {
                    let clock = this._clocks[index];
                    this.unschedule(clock.agent);
                    this._clocks.splice(index, 1);
                }
            }
        };
        this._clocks.push({ cb, agent });
        this.schedule(agent, interval);
    }

    /**
     * 添加事件
     *
     * 应当在 #onLoad 中添加，当 #onDestroy 时，会统一移除
     * @param type 事件类型
     * @param callback 回调方法
     */
    protected addEvent(type: string, callback: (...args: any[]) => void) {
        Dispatcher.gui.on(type, callback, this);
    }

    /**
     * 继承自 Component，子类覆写需要调用 `super.onDestroy();`
     */
    protected onDestroy() {
        Dispatcher.gui.targetOff(this);
        // remove clocks
        for (let clock of this._clocks) {
            this.unschedule(clock.agent);
        }
        this._clocks = [];
        // remove widgets
        for (let wd of this._widgetDatas) {
            if (isValid(wd.widget)) {
                wd.widget?.node.destroy();
            }
        }
        this._widgetDatas = [];
    }

    private removeWidgetData(uuid: string) {
        for (let i = this._widgetDatas.length - 1; i >= 0; --i) {
            const widgetData = this._widgetDatas[i];
            if (widgetData.uuid == uuid) {
                this._widgetDatas.splice(i, 1);
                if (isValid(widgetData.widget)) {
                    widgetData.widget!.node.destroy();
                }
                break;
            }
        }
    }

    private createWidget(parent: Node, prefab: Prefab, data: any) {
        const uuid = prefab.name;
        if (this._widgetDatas.findIndex(v => v.uuid == uuid) === -1) {
            return;
        }

        let node = instantiate(prefab),
            widgetComp = node.getComponent(prefab.name) as BaseWidget;

        widgetComp.data = data;
        widgetComp.setVisible(false);
        parent.addChild(node);

        // bind view
        for (let i = this._widgetDatas.length - 1; i >= 0; --i) {
            const viewData = this._widgetDatas[i];
            if (viewData.uuid == uuid) {
                viewData.widget = widgetComp;
                break;
            }
        }
    }

    //private
    private _clocks: IClock[] = [];
    private _widgetDatas: IWidgetData[] = [];
}

export class BaseWidget extends Foundation {
    public get data(): any { return this._data_$abc; }
    public set data(data: any) { this._data_$abc = data; }

    public isVisible(): boolean {
        return this.node.active;
    }
    public setVisible(visible: boolean) {
        this.node.active = visible;
    }

    /**
     * 当 Widget 显示的时候调用
     *
     * 子类未实现 onShow ，则无动画，直接显示。
     *
     * 系统默认情况下，使用 `showType=0` 执行进场动画。
     *
     * @example
     * ```
     * public onShow(type: number):boolean {
     *      switch (type) {
     *          case 0: {
     *              // 系统默认调用的动画实现
     *              return true;
     *          }
     *          case 1: {
     *              // 可实现由 showType = 1 指定的动画
     *              return true;
     *          }
     *      }
     *      // 未实现动画，直接显示
     *      return false;
     * }
     * ```
     *
     * @param isCreate 来自于创建
     * @returns 是否使用特定动画
     */
    public onShow(type: number, isCreate: boolean): boolean {
        return false;
    }

    /**
     * 当 Widget 隐藏的时候调用
     *
     * @param isDestroy 来自于销毁; 子类需要根据 `isDestroy` 来决定是否执行 `node.destroy()`
     * @returns 是否使用特定动画
     */
    public onHide(type: number, isDestroy: boolean): boolean {
        return false;
    }

    //private
    private _data_$abc: any = null;
}