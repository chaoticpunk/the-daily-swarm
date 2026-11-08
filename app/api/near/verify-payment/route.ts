import { apiRoute, jsonResponse, parseBody, readJsonBody } from "@/lib/api/http";
import { verifyPaymentRequestSchema } from "@/lib/api/schemas";
import { verifyReaderPayment } from "@/lib/near/rpc";

export const maxDuration = 55;

export const POST = apiRoute("verify-payment", async (request) => {
  const body = parseBody(verifyPaymentRequestSchema, await readJsonBody(request));
  const payment = await verifyReaderPayment(body);
  return jsonResponse({ payment: payment.entry });
});
