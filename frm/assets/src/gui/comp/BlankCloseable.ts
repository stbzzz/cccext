
import { Component, Node, NodeEventType, Rect, Touch, UITransform, Vec2, Vec3, _decorator, v2, v3 } from "cc";
import { Closeable } from "./Closeable";
const { ccclass, property, requireComponent } = _decorator;

@ccclass('BlankCloseable')
@requireComponent(Closeable)
export class BlankCloseable extends Component {

    @property(Node)
    private bgRect: Node = null!;

    public setLock(locked: boolean) {
        this._isLock = locked;
    }

    protected onLoad(): void {
        this._closeable = this.getComponent(Closeable)!;
    }

    protected onEnable() {
        this.node.on(NodeEventType.TOUCH_END, this.onTouchEnd, this);
    }

    protected onDisable() {
        this.node.off(NodeEventType.TOUCH_END, this.onTouchEnd, this);
    }

    private onTouchEnd(touch: Touch) {
        if (this._isLock) return;
        if (!this.checkInside(touch.getUILocation())) {
            this._closeable.onClickClose(null, '0_0');
        }
    }

    private checkInside(touchPos: Vec2): boolean {
        if (!this.bgRect) return true;
        this.bgRect.getPosition(this._bgRectPosition);
        let position = this._bgRectPosition;
        let transform = this.bgRect.getComponent(UITransform)!;
        let lpos = this.bgRect.parent!.getComponent(UITransform)!.convertToNodeSpaceAR(v3(touchPos.x, touchPos.y, 0));
        let rect = new Rect(position.x - transform.width / 2, position.y - transform.height / 2, transform.width, transform.height);
        return rect.contains(v2(lpos.x, lpos.y));
    }

    //private
    private _closeable: Closeable = null!;
    private _bgRectPosition: Vec3 = v3(0, 0, 0);
    private _isLock = false;

}