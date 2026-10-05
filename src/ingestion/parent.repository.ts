import {
  ParentChunk,
} from "./document.types.js";

export interface ParentRepository {
  upsert(
    parent: ParentChunk
  ): Promise<void>;

  get(
    id: string
  ): Promise<ParentChunk | undefined>;

  delete(
    id: string
  ): Promise<void>;
}