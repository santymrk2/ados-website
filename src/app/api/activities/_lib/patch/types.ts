import type { ActivityPatchPayload, Tx } from "../types";

export interface PatchContext {
  tx: Tx;
  activityId: number;
  data: ActivityPatchPayload;
  /** Activity version after this PATCH's bump (reported on 409). */
  version: number;
  /** Version the client says it edited (only used for requests without prev*). */
  clientVersion: number;
}

/** Returns extra fields to merge into the response; `success` and `version` are added by the dispatcher. */
export type PatchHandler = (ctx: PatchContext) => Promise<Record<string, unknown> | void>;
