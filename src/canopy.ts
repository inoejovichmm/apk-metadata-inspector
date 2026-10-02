// One SDK instance for the whole app. Auth (auth), data (db), files (blob)
// and AI (ai) are all live — see AGENTS.md for how to get the full reference.
import { createCanopy } from "@mediamonks/canopy";

export const canopy = createCanopy();
