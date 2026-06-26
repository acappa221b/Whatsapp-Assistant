import { type EventBus } from '../../../events/index';
import type { UserRole } from '../../../domain/value-objects/enums';
import { User } from '../domain/user.entity';
import type { UserRepository } from '../domain/user.repository';
export type CreateUserInput = {
    name: string;
    email: string;
    role?: UserRole;
};
export declare class CreateUserUseCase {
    private readonly repository;
    private readonly eventBus;
    constructor(repository: UserRepository, eventBus: EventBus);
    execute(input: CreateUserInput): Promise<User>;
}
export type UpdateUserInput = {
    id: string;
    name?: string;
    email?: string;
    role?: UserRole;
};
export declare class UpdateUserUseCase {
    private readonly repository;
    private readonly eventBus;
    constructor(repository: UserRepository, eventBus: EventBus);
    execute(input: UpdateUserInput): Promise<User>;
}
export declare class GetUserByIdUseCase {
    private readonly repository;
    constructor(repository: UserRepository);
    execute(id: string): Promise<User>;
}
export declare class ListUsersUseCase {
    private readonly repository;
    constructor(repository: UserRepository);
    execute(callerRole: UserRole): Promise<User[]>;
}
//# sourceMappingURL=user.use-cases.d.ts.map