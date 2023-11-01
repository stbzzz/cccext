import { Component, warn } from "cc";
import { Dispatcher } from "../mgr/DispatcherMgr";

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

export class Foundation extends Component {

    /**
     * 添加事件
     *
     * 应当在 #onEnable 中添加，当 #onDisable 时，会统一移除
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
     * 应当在 #onEnable 中添加，当 #onDisable 时，会统一移除
     * @param type 事件类型
     * @param callback 回调方法
     */
    protected addEvent(type: string, callback: (...args: any[]) => void) {
        Dispatcher.gui.on(type, callback, this);
    }

    /**
     * 继承自 Component，子类覆写需要调用 `super.onDisable();`
     */
    protected onDisable() {
        Dispatcher.gui.targetOff(this);
        // remove clocks
        for (let clock of this._clocks) {
            this.unschedule(clock.agent);
        }
        this._clocks = [];
    }

    //private
    private _clocks: IClock[] = [];
}