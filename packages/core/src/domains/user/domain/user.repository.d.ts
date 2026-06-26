import type { User } from './user.entity';
export type UserRepository = {
    save(user: User): Promise<User>;
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    findAll(): Promise<User[]>;
};
//# sourceMappingURL=user.repository.d.ts.map