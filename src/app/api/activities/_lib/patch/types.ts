import type { ActivityPatchPayload, Tx } from "../types";

export interface PatchContext {
  tx: Tx;
  activityId: number;
  data: ActivityPatchPayload;
}

/** Returns extra fields to merge into the response; `success` and `version` are added by the dispatcher. */
export type PatchHandler = (ctx: PatchContext) => Promise<Record<string, unknown> | void>;
