import type { CategoryType } from '../../../domain/value-objects/enums'
import { Category } from '../domain/category.entity'
import type { CategoryRepository } from '../domain/category.repository'

export class InMemoryCategoryRepository implements CategoryRepository {
  private store = new Map<string, Category>()

  async save(category: Category): Promise<Category> {
    this.store.set(category.id, category)
    return category
  }

  async findById(id: string): Promise<Category | null> {
    return this.store.get(id) ?? null
  }

  async findByNameAndType(name: string, type: CategoryType): Promise<Category | null> {
    for (const category of this.store.values()) {
      if (category.type === type && Category.namesEqual(category.name, name)) {
        return category
      }
    }
    return null
  }

  async findAllByType(type?: CategoryType): Promise<Category[]> {
    const all = [...this.store.values()]
    return type ? all.filter((c) => c.type === type) : all
  }
}
