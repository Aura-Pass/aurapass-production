import { createServerFn } from "@tanstack/react-start";
import type { TicketConfirmationInput, AdminEventSubmissionInput } from "./email.server";

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

export const sendAdminEventSubmissionEmailFn = createServerFn({ method: "POST" })
  .inputValidator((data: AdminEventSubmissionInput) => {
    if (
      !data ||
      typeof data.eventTitle !== "string" ||
      typeof data.organiserName !== "string" ||
      typeof data.organiserEmail !== "string" ||
      typeof data.eventDate !== "string" ||
      typeof data.eventCity !== "string" ||
      typeof data.eventId !== "string"
    ) {
      throw new Error("Invalid input");
    }
    return data;
  })
  .handler(async ({ data }) => {
    const { sendAdminEventSubmissionEmail } = await import("./email.server");
    await sendAdminEventSubmissionEmail(data);
    return { success: true as const };
  });

