import type { Types } from "mongoose";

type SerializableRecord = Record<string, unknown> & {
  _id?: Types.ObjectId | { toString(): string };
  __v?: unknown;
};

export function normalizeMongoDocument(
  ret: SerializableRecord,
): SerializableRecord {
  if (ret._id) {
    ret.id = ret._id.toString();
  }

  delete ret._id;
  delete ret.__v;

  return ret;
}

export function stringifyObjectIdField(
  ret: SerializableRecord,
  field: string,
): void {
  const value = ret[field];
  if (value && typeof value === "object" && "toString" in value) {
    ret[field] = value.toString();
  }
}
