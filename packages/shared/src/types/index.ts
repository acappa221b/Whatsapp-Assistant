export type Nullable<T> = T | null

export type Result<T, E = Error> =
  | { success: true; value: T }
  | { success: false; error: E }

export type Timestamped = {
  createdAt: Date
  updatedAt: Date
}

export type SoftDeletable = {
  deletedAt: Nullable<Date>
}
