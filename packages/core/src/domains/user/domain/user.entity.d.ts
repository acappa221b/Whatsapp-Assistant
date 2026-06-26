import { UserRole } from '../../../domain/value-objects/enums';
export type UserProps = {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
};
export declare class User {
    readonly id: string;
    readonly name: string;
    readonly email: string;
    readonly role: UserRole;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    private constructor();
    static create(input: {
        id: string;
        name: string;
        email: string;
        role?: UserRole;
        now?: Date;
    }): User;
    static reconstitute(props: UserProps): User;
    update(input: {
        name?: string;
        email?: string;
        role?: UserRole;
    }): User;
    static validateName(name: string): string;
}
//# sourceMappingURL=user.entity.d.ts.map