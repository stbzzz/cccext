export class Trigger {
    public constructor(interval: number, execWhenStart = false, autoResetElapsedTime = true) {
        this.reuse(interval, execWhenStart, autoResetElapsedTime);
    }

    public getElapsedTime(): number {
        return this._elapsedTime;
    }

    /**
     * 根据新的参数重用触发器对象
     * @param interval 
     * @param execWhenStart 
     * @param autoResetElapsedTime 
     */
    public reuse(interval: number, execWhenStart = false, autoResetElapsedTime = true) {
        this._interval = interval;
        this._autoResetElapsedTime = autoResetElapsedTime;

        if (execWhenStart) {
            this._elapsedTime = interval;
        } else {
            this._elapsedTime = 0;
        }
    }

    /**
     * 重置触发器流逝时间
     * @param retainElapsed 保留interval区间内的流逝时间
     */
    public reset(retainElapsed = false) {
        if (retainElapsed) {
            const interval = this._interval;
            if (interval > 0 && interval < this._elapsedTime) {
                let multiple = Math.floor(this._elapsedTime / interval);
                this._elapsedTime -= multiple * interval;
            }
        } else {
            this._elapsedTime = 0;
        }
    }

    /**
     * 处置触发器间隔时间
     * @param interval 
     * @param retainElapsed 
     */
    public resetInterval(interval: number, retainElapsed = false) {
        this._interval = interval;
        this.reset(retainElapsed);
    }

    public trigger(dt: number): boolean {
        if (this._interval < 0) return false;

        this._elapsedTime += dt;

        if (this._elapsedTime >= this._interval) {
            if (this._autoResetElapsedTime) {
                this._elapsedTime -= this._interval;
            }
            return true;
        }

        return false;
    }

    //private
    private _interval = -1;
    private _elapsedTime = 0;
    private _autoResetElapsedTime = true;
}