import { ConflictError, NotFoundError } from '../../../domain/errors'
import { DomainEvents, type EventBus } from '../../../events/index'
import { generateId } from '../../../domain/utils'
import { Category } from '../domain/category.entity'
import type { CategoryRepository } from '../domain/category.repository'
import type { CategoryType } from '../../../domain/value-objects/enums'

export type CreateCategoryInput = {
  name: string
  type: CategoryType
}

export class CreateCategoryUseCase {
  constructor(
    private readonly repository: CategoryRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: CreateCategoryInput): Promise<Category> {
    const existing = await this.repository.findByNameAndType(input.name, input.type)
    if (existing) {
      throw new ConflictError(`Category "${input.name}" already exists for type ${input.type}`)
    }
    const category = Category.create({ id: generateId(), name: input.name, type: input.type })
    const saved = await this.repository.save(category)
    await this.eventBus.publish({
      name: DomainEvents.CategoryCreated,
      payload: { categoryId: saved.id, name: saved.name, type: saved.type },
      occurredAt: new Date(),
    })
    return saved
  }
}

export type UpdateCategoryInput = {
  id: string
  name: string
}

export class UpdateCategoryUseCase {
  constructor(
    private readonly repository: CategoryRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: UpdateCategoryInput): Promise<Category> {
    const existing = await this.repository.findById(input.id)
    if (!existing) throw new NotFoundError('Category', input.id)
    const duplicate = await this.repository.findByNameAndType(input.name, existing.type)
    if (duplicate && duplicate.id !== existing.id) {
      throw new ConflictError(`Category "${input.name}" already exists for type ${existing.type}`)
    }
    const updated = existing.updateName(input.name)
    const saved = await this.repository.save(updated)
    await this.eventBus.publish({
      name: DomainEvents.CategoryUpdated,
      payload: { categoryId: saved.id, changes: { name: saved.name } },
      occurredAt: new Date(),
    })
    return saved
  }
}

export class GetCategoryByIdUseCase {
  constructor(private readonly repository: CategoryRepository) {}

  async execute(id: string): Promise<Category> {
    const category = await this.repository.findById(id)
    if (!category) throw new NotFoundError('Category', id)
    return category
  }
}

export class ListCategoriesUseCase {
  constructor(private readonly repository: CategoryRepository) {}

  async execute(type?: CategoryType): Promise<Category[]> {
    return this.repository.findAllByType(type)
  }
}
