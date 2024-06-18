import { Canvas, Node, Prefab, _decorator, instantiate, isValid, log, warn } from "cc";
import { Gui } from "../mgr/GuiMgr";
import { Res } from "../mgr/ResMgr";
import { Foundation } from "./Foundation";
import { UniqueView } from "./UniqueView";
const { requireComponent } = _decorator;

interface IUniqueViewDetail {
    parent?: Node;
    showType?: number;
    hideType?: number;
}

interface IUniqueViewData {
    uuid: string;
    view: UniqueView | null;
}

@requireComponent(Canvas)
export class BaseScene extends Foundation {

    /**
     * 设置UniqueView
     * @param path
     * @param data
     * @param detail
     * @returns
     */
    public setUniqueView(path: string | Prefab, data?: any, detail?: IUniqueViewDetail) {
        if (this._isUniqueViewLoading) return;

        detail = detail || {};
        let parent = typeof detail.parent === 'undefined' ? this.node : detail.parent,
            showType = typeof detail.showType === 'undefined' ? 0 : detail.showType,
            hideType = typeof detail.hideType === 'undefined' ? 0 : detail.hideType;

        let uuid: string;
        if (typeof path == 'string') {
            const pathArr = path.split('/');
            const len = pathArr.length;
            if (len < 2) {
                warn(`[BaseScene#setUniqueView] invalid path: ${path}`);
                return;
            }
            uuid = pathArr[len - 1];
        } else {
            uuid = path.name;
        }

        if (this._uniqueViewData?.uuid == uuid) return;
        this._isUniqueViewLoading = true;

        const oldViewData = this._uniqueViewData;
        if (oldViewData && isValid(oldViewData.view)) {
            oldViewData.view?.hide(hideType, true);
        }

        this._uniqueViewData = { uuid, view: null };

        if (typeof path == 'string') {
            Gui.setLoadingMask(true);
            Res.loadPrefab(path, (err, prefab) => {
                Gui.setLoadingMask(false);
                if (err) {
                    this._uniqueViewData = null;
                    this._isUniqueViewLoading = false;
                    return;
                }
                log(`[BaseScene.setUniqueView] ${path} success!`);
                this.createView(parent, prefab!, data, showType);
            });
        } else {
            this.createView(parent, path, data, showType);
        }
    }

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
        super.onDestroy();
        Gui.clear();
        Res.clear();
    }


    private createView(parent: Node, prefab: Prefab, data: any, showType: number) {
        let node = instantiate(prefab),
            viewComp = node.getComponent(prefab.name) as UniqueView;

        viewComp.data = data;
        viewComp.show(showType, true);
        parent.addChild(node);

        // bind view
        this._uniqueViewData!.view = viewComp;

        this._isUniqueViewLoading = false;
    }

    private _isUniqueViewLoading = false;
    private _uniqueViewData: IUniqueViewData | null = null;
}