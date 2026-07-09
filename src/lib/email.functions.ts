import { createServerFn } from "@tanstack/react-start";
import type { TicketConfirmationInput } from "./email.server";

export const sendTicketConfirmationEmail = createServerFn({ method: "POST" })
  .inputValidator((data: TicketConfirmationInput) => {
    if (
      !data ||
      typeof data.to !== "string" ||
      typeof data.buyerName !== "string" ||
      typeof data.eventTitle !== "string" ||
      typeof data.orderId !== "string"
    ) {
      throw new Error("Invalid input");
    }
    return data;
  })
  .handler(async ({ data }) => {
    const { sendTicketConfirmationEmailImpl } = await import("./email.server");
    return sendTicketConfirmationEmailImpl(data);
  });
