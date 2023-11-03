export class Heap<T> {
    public constructor(cmp: (a: T, b: T) => number) {
        this._cmp = cmp;
        this._nodes = [];
    }

    public push(item: T): T {
        return this._heappush(this._nodes, item);
    }

    public pop(): T | null {
        return this._heappop(this._nodes);
    }

    public contains(item: T): boolean {
        return this._nodes.indexOf(item) !== -1;
    }

    public replace(item: T): T {
        return this._heapreplace(this._nodes, item);
    }

    public pushpop(item: T): T {
        return this._heappushpop(this._nodes, item);
    }

    public updateItem(item: T): T | null {
        return this._updateItem(this._nodes, item);
    }

    public clear() {
        this._nodes = [];
    }

    public empty(): boolean {
        return this._nodes.length === 0;
    }

    public size(): number {
        return this._nodes.length;
    }

    private _siftdown(array: T[], startpos: number, pos: number): T {
        var newitem, parent, parentpos,
            cmp = this._cmp;

        newitem = array[pos];
        while (pos > startpos) {
            parentpos = (pos - 1) >> 1;
            parent = array[parentpos];
            if (cmp(newitem, parent) < 0) {
                array[pos] = parent;
                pos = parentpos;
                continue;
            }
            break;
        }
        return array[pos] = newitem;
    }

    private _siftup(array: T[], pos: number): T {
        var childpos, endpos, newitem, rightpos, startpos,
            cmp = this._cmp;

        endpos = array.length;
        startpos = pos;
        newitem = array[pos];
        childpos = 2 * pos + 1;
        while (childpos < endpos) {
            rightpos = childpos + 1;
            if (rightpos < endpos && !(cmp(array[childpos], array[rightpos]) < 0)) {
                childpos = rightpos;
            }
            array[pos] = array[childpos];
            pos = childpos;
            childpos = 2 * pos + 1;
        }
        array[pos] = newitem;
        return this._siftdown(array, startpos, pos);
    }

    private _updateItem(array: T[], item: T): T | null {
        var pos;

        pos = array.indexOf(item);
        if (pos === -1) {
            return null;
        }
        this._siftdown(array, 0, pos);
        return this._siftup(array, pos);
    }

    private _heappushpop(array: T[], item: T): T {
        var _ref,
            cmp = this._cmp;

        if (array.length && cmp(array[0], item) < 0) {
            _ref = [array[0], item], item = _ref[0], array[0] = _ref[1];
            this._siftup(array, 0);
        }
        return item;
    }

    private _heapreplace(array: T[], item: T): T {
        var returnitem;
        returnitem = array[0];
        array[0] = item;
        this._siftup(array, 0);
        return returnitem;
    }

    private _heappop(array: T[]): T | null {
        var lastelt, returnitem;
        lastelt = array.pop() || null;
        if (array.length) {
            returnitem = array[0];
            array[0] = lastelt!;
            this._siftup(array, 0);
        } else {
            returnitem = lastelt;
        }
        return returnitem;
    }

    private _heappush(array: T[], item: T) {
        array.push(item);
        return this._siftdown(array, 0, array.length - 1);
    }
    //private
    private _nodes: T[] = [];
    private _cmp: (a: T, b: T) => number = null!;
}