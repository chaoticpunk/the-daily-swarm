import { sourcePack } from "@/lib/content/pack";
import { apiRoute, jsonResponse } from "@/lib/api/http";
import { publicLlmConfig } from "@/lib/llm/client";
import { getNearConfig, publicNearConfig } from "@/lib/near/config";

export const GET = apiRoute("health", async () => {
  const llm = publicLlmConfig();
  const near = publicNearConfig(getNearConfig());
  return jsonResponse({
    ok: llm.configured && near.network === "testnet",
    demoOnly: true,
    llm,
    near: {
      ...near,
      testnet: near.network === "testnet",
      payoutsReady: near.treasuryConfigured && near.network === "testnet",
    },
    content: {
      editionDate: sourcePack.editionDate,
      topics: sourcePack.topics.length,
      facts: sourcePack.topics.reduce((total, topic) => total + topic.facts.length, 0),
    },
    serverTime: new Date().toISOString(),
  });
});
