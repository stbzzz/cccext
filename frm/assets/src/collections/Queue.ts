export class Queue<T> {
    constructor() { }

    public size(): number {
        return this._tail - this._head;
    }

    public empty(): boolean {
        return this._tail == this._head;
    }

    public peek(cb: (t: T) => boolean): T | null {
        if (this._head == this._tail) return null;

        let i = this._head;

        for (; i < this._tail; ++i) {
            if (cb(this._array[i])) {
                return this._array[i];
            }
        }

        return null;
    }

    public peekHead(): T | null {
        if (this._head == this._tail) return null;
        return this._array[this._head];
    }

    public peekTail(): T | null {
        if (this._head == this._tail) return null;
        return this._array[this._tail - 1];
    }

    public push(e: T) {
        this._array[this._tail++] = e;
    }

    public pop(): T | null {
        if (this._head == this._tail) return null;

        let t = this._array[this._tail--];
        if (this._head == this._tail) {
            this._head = this._tail = 0;
            this._array = [];
        }

        return t;
    }

    public shift(): T | null {
        if (this._head == this._tail) return null;

        let t = this._array[this._head++];
        if (this._head == this._tail) {
            this._head = this._tail = 0;
            this._array = [];
        }

        return t;
    }

    // o(n)
    public remove(cb: (t: T) => boolean): boolean {
        if (this._head == this._tail) return false;

        let i = this._tail - 1;

        for (; i >= this._head; --i) {
            if (cb(this._array[i])) {
                for (let j = i; j < this._tail - 1; ++j) {
                    this._array[j] = this._array[j + 1];
                }
                return true;
            }
        }

        return false;
    }

    // o(n)
    public has(cb: (t: T) => boolean): boolean {
        if (this._head == this._tail) return false;

        let i = this._head;

        for (; i < this._tail; ++i) {
            if (cb(this._array[i])) {
                return true;
            }
        }

        return false;
    }

    public clear() {
        this._head = this._tail = 0;
        this._array = [];
    }

    //private
    private _head = 0;
    private _tail = 0;
    private _array: T[] = [];
}