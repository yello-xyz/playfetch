export default class MemoryCache {
  cache: Map<string | number, any>
  capacity: number

  constructor(capacity: number) {
    this.capacity = capacity
    this.cache = new Map()
  }

  get(key: string | number) {
    if (!this.cache.has(key)) {
      return undefined
    }

    const value = this.cache.get(key)
    this.cache.delete(key)
    this.cache.set(key, value)

    return value
  }

  set(key: string | number, value: any) {
    if (this.cache.has(key)) {
      this.cache.delete(key)
    }

    this.cache.set(key, value)

    if (this.cache.size > this.capacity) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
  }
}
