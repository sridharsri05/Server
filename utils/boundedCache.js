// utils/boundedCache.js - Map with a max size; evicts the least recently used entry when full.
class BoundedCache {
    constructor(max = 2000) {
        this.max = max;
        this.map = new Map();
    }
    has(key) {
        return this.map.has(key);
    }
    get(key) {
        if (!this.map.has(key)) return undefined;
        const value = this.map.get(key);
        // Re-insert to mark as most recently used (Map keeps insertion order).
        this.map.delete(key);
        this.map.set(key, value);
        return value;
    }
    set(key, value) {
        if (this.map.has(key)) this.map.delete(key);
        this.map.set(key, value);
        while (this.map.size > this.max) {
            this.map.delete(this.map.keys().next().value);
        }
        return this;
    }
    get size() {
        return this.map.size;
    }
}

module.exports = { BoundedCache };
