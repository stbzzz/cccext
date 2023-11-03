/**
 * 支持单元格大小一致，且单行或者单列
 * 竖直：view anchor(0.5, 1.0), content anchor(0.5, 1.0)
 * 水平：view anchor(0.0, 0.5), content anchor(0.0, 0.5)
 */

import { CCBoolean, CCInteger, Component, Node, Prefab, ScrollView, Touch, UITransform, Vec2, Widget, _decorator, instantiate, log, v2, v3 } from "cc";
import { frm } from "../../Defines";
import { ScrollMultiItemParent } from "./ScrollMultiItemParent";
import { ScrollRowOrColItem } from "./ScrollRowOrColItem";

const ceil = Math.ceil;
const CheckInterval = 0.02;
const { ccclass, property, requireComponent, disallowMultiple } = _decorator;

@ccclass('SingleScrollView')
@requireComponent(ScrollView)
@disallowMultiple
export class SingleScrollView extends Component {

    @property(Prefab)
    private templatePrefab: Prefab = null!;

    @property(CCInteger)
    private spacing = 0;

    @property({ type: CCBoolean, tooltip: '网格列表' })
    private isGrid = false;

    @property({
        tooltip: '单行/列子节点数量', visible() {
            let self = this as any;
            return self.isGrid;
        }
    })
    private childCount = 1;

    @property({
        tooltip: '行/列宽度', visible() {
            let self = this as any;
            return self.isGrid;
        }
    })
    private gridParentWidth = 300;

    @property({
        tooltip: '行/列高度', visible() {
            let self = this as any;
            return self.isGrid;
        }
    })
    private gridParentHeight = 300;



    private _content: Node = null!;
    private _contentPosition = v3(0, 0, 0);
    private _tempNodePosition = v3(0, 0, 0);
    private _isVertical = false;
    private _itemClickCb: frm.ListViewItemClick<any> | null = null;
    private _cached = false;
    private _cache: Node[] = [];
    private _perTemplateSize = 0;

    private _lastContentPos = 0;
    private _checkInterval = CheckInterval;

    private _validTouch = false;
    private _toBoundaryCb: ((isTail: boolean) => void) | null = null;

    // 数据
    private _sourceData: any[] = [];

    /**
     * 设置点击回调
     * @param cb
     */
    public setItemClickCallback<T>(cb: frm.ListViewItemClick<T>) {
        this._itemClickCb = cb;
    }

    /**
     * 到达边界回调
     */
    public setToBoundaryCallback(cb: (isTail: boolean) => void) {
        this._toBoundaryCb = cb;
    }

    /**
     * 重置列表到初始位置
     */
    public resetPosition() {
        this.getComponent(ScrollView)?.stopAutoScroll();

        this._lastContentPos = 0;
        this._content.getPosition(this._contentPosition);
        const position = this._contentPosition;
        if (this._isVertical) {
            this._content.setPosition(position.x, 0);
        } else {
            this._content.setPosition(0, position.y);
        }

        for (let i = 0, l = this._cache.length; i < l; ++i) {
            let node = this._cache[i],
                comp = node.getComponent(ScrollRowOrColItem)!;

            comp.rowOrCol = i;
            let transform = node.getComponent(UITransform)!;
            if (this._isVertical) {
                node.setPosition(0, -transform.height / 2 - (this.spacing + transform.height) * i);
            } else {
                node.setPosition(transform.width / 2 + (this.spacing + transform.width) * i, 0);
            }
        }
    }

    /**
     * 设置列表
     * @param sourceData 数据
     * @param cb (last: Node, curr: Node, data: ListView.Data, clickTarget: any, clickCmd: string)
     */
    public setList(sourceData: any[]) {
        this._sourceData = sourceData;
        this.getComponent(ScrollView)?.stopAutoScroll();
        this.calcContentSize();
    }

    protected onLoad(): void {
        let scrollViewCom = this.getComponent(ScrollView);
        if (scrollViewCom && scrollViewCom.content) {
            this._content = scrollViewCom.content;
        }
        this._isVertical = scrollViewCom?.vertical || false;
    }

    protected onEnable(): void {
        this.node.on('touchstart', this.onTouchStart, this);
        this.node.on('touchend', this.onTouchEnd, this);
        this.node.on('touchcancel', this.onTouchCancel, this);
    }

    protected start(): void {
        this.initCache();
        this.calcContentSize();
    }

    protected update(dt: number): void {
        this._checkInterval -= dt;
        if (this._checkInterval <= 0) {
            this._checkInterval = CheckInterval;
            this.updateWhenScrolling();
        }

    }

    protected onDisable(): void {
        this.node.off('touchstart', this.onTouchStart, this);
        this.node.off('touchend', this.onTouchEnd, this);
        this.node.off('touchcancel', this.onTouchCancel, this);
    }

    protected onTouchStart(touch: Touch) {
        this._validTouch = true;
    }

    protected onTouchEnd(touch: Touch) {
        this._validTouch = false;
    }

    protected onTouchCancel(touch: Touch) {
        this._validTouch = false;
    }

    private updateWhenScrolling() {
        // positive: 对于垂直列表，向下。对于横向列表，向右。
        this._content.getPosition(this._contentPosition);
        const position = this._contentPosition;
        let isPositive = this._isVertical ? (position.y < this._lastContentPos) : (position.x > this._lastContentPos);
        let isNegative = this._isVertical ? (position.y > this._lastContentPos) : (position.x < this._lastContentPos);

        for (let i = 0, l = this._cache.length; i < l; ++i) {
            let node = this._cache[i],
                comp = node.getComponent(ScrollRowOrColItem)!,
                vpos = this.cell2ViewPos(node),
                transform = node.getComponent(UITransform)!,
                scrollNodeTransform = this.node.getComponent(UITransform)!;

            if (this._isVertical) {
                let destIndex: number = -1, data: any;
                if (isNegative && vpos.y > transform.height / 2) {
                    destIndex = comp.rowOrCol + l;
                } else if (isPositive && vpos.y < -(scrollNodeTransform.height + transform.height / 2)) {
                    destIndex = comp.rowOrCol - l;
                }
                data = this._sourceData[destIndex];
                if (data) {
                    node.getPosition(this._tempNodePosition);
                    const tempPosition = this._tempNodePosition;
                    comp.rowOrCol = destIndex;
                    node.active = true;
                    node.setPosition(tempPosition.x, this.getPos(node, destIndex));
                    comp.setData(data);
                } else {
                    if (isNegative && vpos.y > transform.height / 2) {
                        if (this._validTouch) {
                            this._validTouch = false;
                            this._toBoundaryCb && this._toBoundaryCb(true);
                        }
                    } else if (isPositive && vpos.y < -(scrollNodeTransform.height + transform.height / 2)) {
                        if (this._validTouch) {
                            this._validTouch = false;
                            this._toBoundaryCb && this._toBoundaryCb(false);
                        }
                    }
                }
            } else {
                let destIndex: number = -1, data: any;
                if (isNegative && vpos.x < -transform.width / 2) {
                    destIndex = comp.rowOrCol + l;
                } else if (isPositive && vpos.x > (scrollNodeTransform.width + transform.width / 2)) {
                    destIndex = comp.rowOrCol - l;
                }
                data = this._sourceData[destIndex];
                if (data) {
                    node.getPosition(this._tempNodePosition);
                    const tempPosition = this._tempNodePosition;
                    comp.rowOrCol = destIndex;
                    node.active = true;
                    node.setPosition(this.getPos(node, destIndex), tempPosition.y);
                    comp.setData(data);
                } else {
                    if (isNegative && vpos.x < -transform.width / 2) {
                        if (this._validTouch) {
                            this._validTouch = false;
                            this._toBoundaryCb && this._toBoundaryCb(true);
                        }
                    } else if (isPositive && vpos.x > (scrollNodeTransform.width + transform.width / 2)) {
                        if (this._validTouch) {
                            this._validTouch = false;
                            this._toBoundaryCb && this._toBoundaryCb(false);
                        }
                    }
                }
            }
        }

        this._content.getPosition(this._contentPosition);
        this._lastContentPos = this._isVertical ? this._contentPosition.y : this._contentPosition.x;
    }

    private initCache() {
        if (this._cached) return;
        this.getComponent(Widget)?.updateAlignment();

        let fnode = this.getInstantiate();
        let fnodeTransform = fnode.getComponent(UITransform)!;
        let scrollNodeTransform = this.node.getComponent(UITransform)!;

        let designSize = this._isVertical ? scrollNodeTransform.height : scrollNodeTransform.width;
        let templateSize = this._isVertical ? fnodeTransform.height : fnodeTransform.width;
        this._perTemplateSize = templateSize;

        const cacheNode = (node: Node, index: number) => {
            let comp = node.getComponent(ScrollRowOrColItem)!;
            comp.rowOrCol = index;
            comp.itemClick = (target: Node, data: any, cmd?: string) => {
                this._itemClickCb && this._itemClickCb(target, data, cmd);
            };
            this._cache[index] = node;

            // 设置初始化位置
            let transform = node.getComponent(UITransform)!;
            if (this._isVertical) {
                node.setPosition(0, -transform.height / 2 - (this.spacing + transform.height) * index);
            } else {
                node.setPosition(transform.width / 2 + (this.spacing + transform.width) * index, 0);
            }

            return node;
        }

        let content = this._content;
        content.addChild(cacheNode(fnode, 0));
        for (let i = 1; i < ceil(designSize / (templateSize + this.spacing)) + 1; ++i) {
            content.addChild(cacheNode(this.getInstantiate(), i));
        }

        this._cached = true;
    }

    private calcContentSize() {
        if (!this._cached) return;
        const sourceData = this._sourceData;

        let totalSize = sourceData.length * (this._perTemplateSize + this.spacing);
        let transform = this._content.getComponent(UITransform)!;
        if (this._isVertical) {
            transform.height = totalSize;
        } else transform.width = totalSize;

        this._cache.forEach((node, index) => {
            let comp = node.getComponent(ScrollRowOrColItem)!;
            let data = sourceData[comp.rowOrCol];
            if (data) {
                node.active = true;
                comp.setData(data);
            } else node.active = false;
        });

        log(this._content.children);
    }

    private cell2ViewPos(cell: Node): Vec2 {
        let wpos = cell.parent!.getComponent(UITransform)!.convertToWorldSpaceAR(cell.position),
            lpos = this.node.getComponent(UITransform)!.convertToNodeSpaceAR(wpos);

        return v2(lpos.x, lpos.y);
    }

    private getPos(node: Node, index: number): number {
        let transform = node.getComponent(UITransform)!;
        if (this._isVertical) {
            return -transform.height / 2 - (this.spacing + transform.height) * index;
        } else {
            return transform.width / 2 + (this.spacing + transform.width) * index;
        }
    }

    private getInstantiate(): Node {
        if (this.isGrid) {
            let node = new Node('ScrollMultiItemParent');
            const uiTransform = node.addComponent(UITransform);
            uiTransform.width = this.gridParentWidth;
            uiTransform.height = this.gridParentHeight;
            const multiItemParent = node.addComponent(ScrollMultiItemParent);
            multiItemParent.setChildCount(this.childCount);
            multiItemParent.setIsVertical(this._isVertical);
            multiItemParent.setChildPrefab(this.templatePrefab);
            return node;
        }
        return instantiate(this.templatePrefab);
    }
}