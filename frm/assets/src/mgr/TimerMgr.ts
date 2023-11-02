import { Singleton } from "./Singleton";

class Timer {

    public constructor(interval: number) {
        this.reset(interval);
    }

    public reset(interval: number) {
        this._elapsedTime = 0;
        this._interval = interval;
    }

    public trigger(dt: number): boolean {
        if (this._interval < 0) return false;

        this._elapsedTime += dt;

        if (this._elapsedTime >= this._interval) {
            this._elapsedTime -= this._interval;
            return true;
        }
        return false;
    }

    //private
    private _interval = -1;
    private _elapsedTime = 0;
}

interface ITimerData {
    id: number;
    timer: Timer;
    priority: number;
    removeWhenTrigger: boolean;
    callback: () => void;
}

class TimerMgr extends Singleton {

    /**
     * 延迟执行
     * @param callback
     * @param delta (s)
     * @param priority 默认0；优先级越大越优先执行。优先级相同则先加入先执行。
     * @returns
     */
    public delay(callback: () => void, delta: number, priority = 0): number {
        let id = ++this._timerId;
        let timer = this.getTimer(delta);
        this.insertTimerData({ id, timer, priority, callback, removeWhenTrigger: true });
        return id;
    }


    /**
     * 间隔执行
     * @param callback
     * @param delta (s)
     * @param priority 默认0；优先级越大越优先执行。优先级相同则先加入先执行。
     * @returns
     */
    public interval(callback: () => void, delta: number, priority = 0): number {
        let id = ++this._timerId;
        let timer = this.getTimer(delta);
        this.insertTimerData({ id, timer, priority, callback, removeWhenTrigger: false });
        return id;
    }

    public clear(id: number): boolean {
        for (let l = this._timerArr.length, i = l - 1; i >= 0; --i) {
            let td = this._timerArr[i];
            if (td.id == id) {
                this._timerArr.splice(i, 1);
                this._timerMap.delete(id);
                this._pool.push(td.timer);
                return true;
            }
        }
        return false;
    }

    public updateLogic(dt: number) {
        let len = this._timerArr.length;
        if (len > 0) {
            for (let i = len - 1; i >= 0; --i) {
                let td = this._timerArr[i],
                    timer = td.timer;
                if (timer.trigger(dt)) {
                    if (td.removeWhenTrigger) {
                        this._timerArr.splice(i, 1);
                        this._timerMap.delete(td.id);
                        this._pool.push(timer);
                    }
                    td.callback && td.callback();
                }
            }
        }
    }
    ////
    private getTimer(delta: number): Timer {
        if (this._pool.length > 0) {
            let t = this._pool.shift()!;
            t.reset(delta);
            return t;
        }
        return new Timer(delta);
    }

    // 按 priority 从大到小排列
    private insertTimerData(td: ITimerData) {
        let len = this._timerArr.length;
        let position = 0;
        for (let i = len - 1; i >= 0; --i) {
            let _td = this._timerArr[i];
            if (td.priority <= _td.priority) {
                position = len + 1;
                break;
            }
        }
        this._timerArr.splice(position, 0, td);
        this._timerMap.set(td.id, td);
    }
    //private
    private _timerId = 0;
    private _timerArr = new Array<ITimerData>();
    private _timerMap = new Map<number, ITimerData>();
    private _pool: Timer[] = [];
}

export const Timers = TimerMgr.getInstance() as TimerMgr;