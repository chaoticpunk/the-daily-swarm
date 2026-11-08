import { apiRoute, jsonResponse } from "@/lib/api/http";
import { publicNearConfig } from "@/lib/near/config";
import { readBalances } from "@/lib/near/rpc";

export const GET = apiRoute("near-balances", async () => {
  const balances = await readBalances();
  return jsonResponse({
    ...balances,
    config: publicNearConfig(),
  });
});
