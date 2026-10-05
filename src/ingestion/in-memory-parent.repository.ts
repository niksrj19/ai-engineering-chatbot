import {
  ParentRepository,
} from "./parent.repository.js";

import {
  ParentChunk,
} from "./document.types.js";

export class InMemoryParentRepository
  implements ParentRepository
{
  private readonly parents =
    new Map<
      string,
      ParentChunk
    >();

  async upsert(
    parent: ParentChunk
  ): Promise<void> {
    this.parents.set(
      parent.id,
      parent
    );
  }

  async get(
    id: string
  ): Promise<
    ParentChunk | undefined
  > {
    return this.parents.get(id);
  }

  async delete(
    id: string
  ): Promise<void> {
    this.parents.delete(id);
  }
}