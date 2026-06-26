import { Email } from '../../../domain/value-objects/email';
export class InMemoryUserRepository {
    store = new Map();
    async save(user) {
        this.store.set(user.id, user);
        return user;
    }
    async findById(id) {
        return this.store.get(id) ?? null;
    }
    async findByEmail(email) {
        const normalized = Email.create(email).value;
        for (const user of this.store.values()) {
            if (user.email === normalized)
                return user;
        }
        return null;
    }
    async findAll() {
        return [...this.store.values()];
    }
}
//# sourceMappingURL=in-memory-user.repository.js.map