import { Prefab, UITransform, _decorator, instantiate } from 'cc';
import { frm } from '../../Defines';
import { ScrollGridItem } from './ScrollGridItem';
import { ScrollRowOrColItem } from './ScrollRowOrColItem';

const { ccclass, property } = _decorator;

@ccclass('ScrollMultiItemParent')
export class ScrollMultiItemParent extends ScrollRowOrColItem {

    public setChildCount(count: number) {
        this._childCount = count;
    }

    public setIsVertical(isVertical: boolean) {
        this._isVertical = isVertical;
    }

    public setChildPrefab(prefab: Prefab) {
        this._childPrefab = prefab;
    }

    onLoad() {
        const uiTransform = this.node.getComponent(UITransform)!;
        const totalSize = this._isVertical ? uiTransform.width : uiTransform.height;

        let perSize = 0;

        for (let i = 0; i < this._childCount; ++i) {
            let node = instantiate(this._childPrefab);
            let comp = node.getComponent(ScrollGridItem)!;
            this._cache_$abc[i] = comp;
            comp.setVisible(false);
            comp.setClickCb((cmd) => {
                this._proxyChildClick(node, i, cmd);
            });
            this.node.addChild(node);

            const nodeUITransform = node.getComponent(UITransform)!;
            if (perSize == 0) {
                perSize = this._isVertical ? nodeUITransform.width : nodeUITransform.height;
            }
        }

        let spaceSize = (totalSize - this._childCount * perSize) / (this._childCount - 1);
        if (this._isVertical) {
            this.node.children.forEach((n, i) => {
                n.setPosition(-totalSize / 2 + perSize / 2 + i * (spaceSize + perSize), 0)
            });
        } else {
            this.node.children.forEach((n, i) => {
                n.setPosition(0, -totalSize / 2 + perSize / 2 + i * (spaceSize + perSize))
            });
        }
    }

    public setData(v: any) {
        let list = v as frm.ListData<any>[];
        for (let i = 0; i < this._childCount; ++i) {
            let data = list[i];
            let comp = this._cache_$abc[i];
            if (data) {
                comp.setData(data);
                comp.setVisible(true);
            } else {
                comp.setVisible(false);
            }
        }
        super.setData(v);
    }

    //private
    private _childCount = 1;
    private _isVertical = true;
    private _childPrefab: Prefab = null!;
    private _cache_$abc: ScrollGridItem[] = [];
}