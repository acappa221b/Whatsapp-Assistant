import { User } from '../domain/user.entity';
import type { UserRepository } from '../domain/user.repository';
export declare class InMemoryUserRepository implements UserRepository {
    private store;
    save(user: User): Promise<User>;
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    findAll(): Promise<User[]>;
}
//# sourceMappingURL=in-memory-user.repository.d.ts.map