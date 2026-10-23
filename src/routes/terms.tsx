import { createFileRoute } from "@tanstack/react-router";
import { PageWrapper } from "@/components/layout/PageWrapper";

type Item = { lead?: string; text: string };
type Block =
  | { t: "p"; lead?: string; text: string }
  | { t: "ul"; items: Item[] }
  | { t: "table"; head: string[]; rows: string[][] };
type TermsSection = { id: string; title: string; blocks: Block[] };

const LAST_UPDATED = "October 2026";
const SUPPORT_EMAIL = "support@aurapassticket.com";

const SECTIONS: TermsSection[] = [
  {
    id: "acceptance",
    title: "1. Acceptance and definitions",
    blocks: [
      {
        t: "p",
        text: "By accessing the Platform, creating an account or buying a ticket, you agree to these Terms and to our Privacy Notice (section 13). If you do not agree, do not use the Platform.",
      },
      { t: "p", text: "In these Terms:" },
      {
        t: "ul",
        items: [
          { lead: '"AuraPass", "we", "us"', text: " means the operator of aurapassticket.com." },
          {
            lead: '"Organiser"',
            text: " means a person or business that lists an event and sells tickets through the Platform.",
          },
          { lead: '"Attendee" or "Buyer"', text: " means a person who buys or receives a ticket." },
          {
            lead: '"Ticket"',
            text: " means a digital admission right with a unique QR code, issued for one event.",
          },
          {
            lead: '"Ticket Subtotal"',
            text: " means the face value of the tickets in an order, before any service fee.",
          },
          {
            lead: '"Service Fee"',
            text: " means the fee AuraPass charges the Attendee, described in section 5.",
          },
          {
            lead: '"Withdrawal Fee"',
            text: " means the fee AuraPass charges the Organiser, described in section 7.",
          },
          {
            lead: '"Payment Processor"',
            text: " means Paystack or any successor provider we use to collect payments.",
          },
        ],
      },
    ],
  },
  {
    id: "eligibility",
    title: "2. Eligibility and accounts",
    blocks: [
      {
        t: "p",
        text: "You must be at least 18 years old, or have a parent or guardian's consent, to buy tickets. Organisers must be 18 or older and legally able to contract, or be a registered business acting through an authorised person.",
      },
      {
        t: "p",
        text: "You must give accurate information and keep your login details secure. You are responsible for activity under your account. Tell us promptly at the address in section 18 if you suspect unauthorised use. One person may not hold multiple accounts to avoid a suspension or a limit.",
      },
    ],
  },
  {
    id: "role",
    title: "3. AuraPass's role",
    blocks: [
      {
        t: "p",
        text: "AuraPass is a ticketing technology platform. We provide the tools for Organisers to list events, sell tickets, and admit attendees by QR scan. We are not the organiser of any event and are not a party to the contract between an Organiser and an Attendee for admission to that event.",
      },
      {
        t: "p",
        text: "Organisers are solely responsible for the event itself: its content, safety, permits, accuracy of listing details, delivery, and any change or cancellation. AuraPass does not guarantee that any event will take place as described.",
      },
    ],
  },
  {
    id: "tickets",
    title: "4. Tickets and purchases",
    blocks: [
      {
        t: "p",
        text: "An order is complete only when payment is confirmed and the Ticket is issued to the email address you gave. Check that email address and event details before paying.",
      },
      {
        t: "p",
        text: "Stock is held for you while you pay. If payment is not completed within a short window, the order is cancelled automatically and the held tickets are returned to sale. If you pay after that, we will re-issue your Ticket if stock is still available, or refund you in full if it is not.",
      },
      {
        t: "p",
        text: 'When a ticket category shows "Sold out", no more tickets of that category can be bought. Organisers may limit the number of tickets per buyer. A Ticket is a limited licence to attend one event; it is not property that can be resold for profit.',
      },
    ],
  },
  {
    id: "fees",
    title: "5. Fees and pricing",
    blocks: [
      {
        t: "p",
        lead: "5.1 Attendee Service Fee.",
        text: " The Service Fee is capped at 3.5% of the Ticket Subtotal plus ₦100 per ticket, each applied to the Ticket Subtotal and the number of tickets in the order. It is the standard buyer-facing fee on the Platform.",
      },
      {
        t: "p",
        lead: "5.2 Shown before you pay.",
        text: " The Service Fee and the total are displayed at checkout before you confirm payment. The price you see is the price you pay.",
      },
      {
        t: "p",
        lead: "5.3 What it covers.",
        text: " The Service Fee covers running the Platform, ticket delivery, QR admission tools, customer support, and payment processing costs.",
      },
      {
        t: "p",
        lead: "5.4 Free tickets.",
        text: " No Service Fee is charged on tickets with a face value of ₦0.",
      },
      {
        t: "p",
        lead: "5.5 Currency and taxes.",
        text: " All prices are in Nigerian naira (₦). Fees are stated inclusive of any applicable taxes unless the checkout says otherwise. Organisers are responsible for any tax on their own ticket sales.",
      },
      {
        t: "p",
        lead: "5.6 Changes.",
        text: " We may change fees on notice under section 17. A change does not affect orders already paid.",
      },
      {
        t: "p",
        lead: "5.7 Non-refundable.",
        text: " The Service Fee is non-refundable in all circumstances, except where we cancel your order or fail to deliver your Ticket.",
      },
    ],
  },
  {
    id: "payments",
    title: "6. Payments",
    blocks: [
      {
        t: "p",
        text: "Payments are collected by our Payment Processor. By paying, you also accept the Payment Processor's terms. We do not store your full card details.",
      },
      {
        t: "p",
        text: "We confirm your order from the Payment Processor's verified payment result, not from your browser. If a payment is debited but the order is not confirmed, do not pay again: wait a few minutes, then contact support with your payment reference and we will resolve it. We may refuse or reverse an order we reasonably suspect to be fraudulent, a pricing error, or a breach of these Terms, and will refund any amount paid.",
      },
    ],
  },
  {
    id: "payouts",
    title: "7. Organiser payouts and Withdrawal Fee",
    blocks: [
      {
        t: "p",
        lead: "7.1 Earnings.",
        text: " Ticket Subtotals from confirmed orders are credited to the Organiser's AuraPass balance, less any refunds, chargebacks and adjustments. The Attendee Service Fee belongs to AuraPass and is not part of the Organiser's balance.",
      },
      {
        t: "p",
        lead: "7.2 Withdrawal Fee.",
        text: " AuraPass charges a Withdrawal Fee of 1.5% of the amount withdrawn. The fee is deducted from the withdrawal, and the net amount is paid out. There is no other AuraPass fee on the Organiser for selling tickets.",
      },
      {
        t: "p",
        lead: "7.3 Payout details.",
        text: " Organisers must provide a valid Nigerian bank account in the name of the account holder (or the registered business). We may delay or hold a payout to verify identity, investigate suspected fraud, or cover refund and chargeback exposure for an event, and will tell you why.",
      },
      {
        t: "p",
        lead: "7.4 Timing.",
        text: " Payout timing depends on the bank and Payment Processor. AuraPass does not guarantee a specific settlement time.",
      },
      {
        t: "p",
        lead: "7.5 Withdrawals before the event ends.",
        text: " An event is treated as concluded 12 hours after its listed start time. Until then, an Organiser may request a withdrawal at most twice for that event, and the total requested across both may not exceed 80% of the total ticket sales (Ticket Subtotals of confirmed orders, less refunds). After the event concludes, the remaining balance is released to the Organiser as a final settlement, once we have confirmed that no refund or chargeback exposure remains. The 1.5% Withdrawal Fee applies to each withdrawal.",
      },
      {
        t: "p",
        lead: "7.6 Refund exposure.",
        text: " If an event is cancelled, or refunds or chargebacks are due, we may deduct the amount from the Organiser's balance or future earnings. If the balance is insufficient, the Organiser owes the shortfall to AuraPass.",
      },
    ],
  },
  {
    id: "refunds",
    title: "8. Refunds, cancellations and postponements",
    blocks: [
      {
        t: "p",
        lead: "8.1 General rule.",
        text: " Tickets are non-refundable once issued, except as set out below or required by law. Contact the Organiser first for event-specific questions.",
      },
      {
        t: "p",
        lead: "8.2 Cancelled events.",
        text: " If an Organiser cancels an event, Attendees are entitled to a refund of the Ticket Subtotal paid. The Service Fee is not refunded (section 5.7). Refunds are made to the original payment method within 7 to 14 business days.",
      },
      {
        t: "p",
        lead: "8.3 Postponed or rescheduled events.",
        text: " Tickets stay valid for the new date. If you cannot attend the new date, you may request a refund within 7 days of the change being announced, unless the Organiser's published policy allows more.",
      },
      {
        t: "p",
        lead: "8.4 Material change.",
        text: " If the venue, headline performers or content change materially from the listing, the Organiser should offer refunds. AuraPass may process refunds from the Organiser's balance where we reasonably find that a material change occurred.",
      },
      {
        t: "p",
        lead: "8.5 Failed or duplicate payment.",
        text: " If you were charged but no Ticket was issued, or you were charged twice, we will refund the amount in full once verified.",
      },
      {
        t: "p",
        lead: "8.6 Organiser refund policy.",
        text: " Organisers may set a more generous refund policy for their event and must display it on the event page. AuraPass will apply that policy.",
      },
    ],
  },
  {
    id: "admission",
    title: "9. Ticket transfer, QR codes and admission",
    blocks: [
      {
        t: "p",
        text: "Each Ticket carries a unique QR code that works once. The first valid scan admits the holder; later scans of the same code are rejected as already used. Keep your QR code private: anyone who scans it first gets in, and AuraPass is not liable for entry gained by someone who obtained your code through your sharing, screenshot or loss.",
      },
      {
        t: "p",
        text: "You may give a Ticket to a friend or family member at no profit. Reselling a Ticket above its face value, or advertising Tickets you do not hold, is prohibited, and we may void such Tickets without refund.",
      },
      {
        t: "p",
        text: "Organisers and their staff may refuse entry for safety reasons, intoxication, prohibited items, an invalid or duplicated Ticket, or breach of venue rules, subject to the Organiser's refund policy. A scan result on the Platform is conclusive for admission unless there is evident error.",
      },
    ],
  },
  {
    id: "organiser-obligations",
    title: "10. Organiser obligations",
    blocks: [
      { t: "p", text: "Organisers confirm and agree that they:" },
      {
        t: "ul",
        items: [
          {
            text: "own or have the right to run and promote the event, and hold all permits, licences and insurance the law requires;",
          },
          {
            text: "give accurate and complete event details (date, time, venue, price, what is included) and update them promptly if they change;",
          },
          { text: "will deliver the event as listed, or announce and refund promptly if they cannot;" },
          { text: "will not sell more tickets than venue capacity and safety rules allow;" },
          { text: "will admit valid Ticket holders and use the Platform's scanner honestly;" },
          {
            text: "are responsible for all taxes on their own revenue and for lawful handling of attendee data they receive.",
          },
        ],
      },
      {
        t: "p",
        text: "We may review, hold or remove any event that appears misleading, unlawful, or unsafe.",
      },
    ],
  },
  {
    id: "conduct",
    title: "11. Prohibited conduct",
    blocks: [
      {
        t: "p",
        text: "You must not: use the Platform for anything unlawful or fraudulent; list fake events or sell fake Tickets; bypass payment or Service Fees; scrape, copy or interfere with the Platform; attempt to guess, forge or duplicate QR codes; harass staff or other users; upload content that infringes rights or is hateful, obscene or defamatory; or use bots to buy tickets in bulk. We may suspend or terminate accounts and void Tickets for breach.",
      },
    ],
  },
  {
    id: "ip",
    title: "12. Intellectual property and content",
    blocks: [
      {
        t: "p",
        text: "The Platform, its software, design, name and logo belong to AuraPass. You may not copy or reuse them without written permission. Organisers keep ownership of the event content they upload (images, descriptions, logos) and give AuraPass a non-exclusive, worldwide, royalty-free licence to display, resize and compress it to operate and promote the Platform, including link previews on social media and messaging apps. Organisers confirm they have the right to give this licence.",
      },
    ],
  },
  {
    id: "privacy",
    title: "13. Privacy and data protection",
    blocks: [
      {
        t: "p",
        lead: "13.1 Law.",
        text: " We process personal data in line with the Nigeria Data Protection Act 2023 (NDPA), the Nigeria Data Protection Regulation 2019 (NDPR) to the extent it still applies, and guidance from the Nigeria Data Protection Commission (NDPC).",
      },
      {
        t: "p",
        lead: "13.2 Data we collect.",
        text: " Account details (name, email, phone, username), order and ticket records, payout bank details for Organisers, check-in records, device and usage data (such as IP address and browser type), and messages you send us. Card details are handled by the Payment Processor and are not stored by AuraPass.",
      },
      { t: "p", lead: "13.3 Why we use it, and our lawful basis.", text: "" },
      {
        t: "table",
        head: ["Purpose", "Lawful basis"],
        rows: [
          ["Create accounts, process orders, issue and scan Tickets", "Performance of a contract"],
          ["Prevent fraud, secure the Platform, resolve disputes", "Legitimate interests"],
          ["Meet tax, accounting and legal duties", "Legal obligation"],
          ["Send event updates and optional marketing", "Consent (you can withdraw at any time)"],
        ],
      },
      {
        t: "p",
        lead: "13.4 Sharing.",
        text: " We share data only as needed with: the Organiser of an event you buy a ticket to (your name, email and ticket details); our Payment Processor; our email and hosting providers acting on our instructions; professional advisers; and regulators or law enforcement where the law requires. We do not sell personal data.",
      },
      {
        t: "p",
        lead: "13.5 Transfers abroad.",
        text: " Some providers store data outside Nigeria. Where we transfer personal data out of Nigeria, we do so only where the NDPA permits, with appropriate safeguards.",
      },
      {
        t: "p",
        lead: "13.6 Retention.",
        text: " We keep data only as long as needed for the purposes above, and for the periods the law requires for financial records.",
      },
      {
        t: "p",
        lead: "13.7 Your rights.",
        text: " Under the NDPA you may ask to access, correct or delete your data, object to or restrict processing, withdraw consent, request a portable copy, and not be subject to solely automated decisions with significant effects. Contact us at the address in section 18; we aim to respond within 30 days. You may also complain to the Nigeria Data Protection Commission.",
      },
      {
        t: "p",
        lead: "13.8 Security and breaches.",
        text: " We use reasonable technical and organisational measures to protect data. If a breach is likely to harm you, we will notify you and the NDPC within the time the NDPA requires (72 hours for the regulator).",
      },
      {
        t: "p",
        lead: "13.9 Organisers as controllers.",
        text: " Organisers who receive attendee data are responsible for handling it lawfully and only for the event and related communications.",
      },
      {
        t: "p",
        lead: "13.10 Cookies.",
        text: " The Platform uses essential cookies and similar storage to keep you signed in and secure the site. Optional analytics or marketing cookies will only be used with your consent.",
      },
    ],
  },
  {
    id: "liability",
    title: "14. Disclaimers and limitation of liability",
    blocks: [
      {
        t: "p",
        text: 'The Platform is provided "as is" and "as available". We work to keep it running but do not promise it will be uninterrupted or error-free. AuraPass is not responsible for the acts, omissions or events of Organisers, venues or third parties.',
      },
      {
        t: "p",
        text: "To the fullest extent the law allows, AuraPass's total liability to you for any claim connected to the Platform is limited to the amount you paid us in the 12 months before the claim (for an Attendee, the Service Fee and Ticket Subtotal of the order concerned). We are not liable for indirect or consequential loss, loss of profit, or loss of opportunity. Nothing in these Terms excludes liability that cannot lawfully be excluded, including for death or personal injury caused by our negligence or for fraud, or limits your statutory consumer rights, including under the Federal Competition and Consumer Protection Act 2018.",
      },
    ],
  },
  {
    id: "indemnity",
    title: "15. Indemnity",
    blocks: [
      {
        t: "p",
        text: "You agree to compensate AuraPass for losses, claims and costs (including reasonable legal fees) arising from your breach of these Terms, your unlawful conduct, or, for Organisers, your event, content, or failure to deliver it.",
      },
    ],
  },
  {
    id: "termination",
    title: "16. Suspension and termination",
    blocks: [
      {
        t: "p",
        text: "You may close your account at any time (outstanding orders and payouts remain subject to these Terms). We may suspend or end access, hold payouts, or void Tickets where we reasonably suspect fraud or breach, or where the law requires, and will explain why where we lawfully can. Sections that by nature continue (fees owed, liability, indemnity, governing law) survive termination.",
      },
    ],
  },
  {
    id: "changes",
    title: "17. Changes to these Terms and fees",
    blocks: [
      {
        t: "p",
        text: "We may update these Terms and our fees. We will post the new version with its effective date and, for material changes to fees or your rights, give at least 14 days' notice by email or on the Platform. Continued use after the effective date means you accept the update. Orders already paid are not affected by a later fee change.",
      },
    ],
  },
  {
    id: "law",
    title: "18. Governing law, disputes and contact",
    blocks: [
      {
        t: "p",
        lead: "18.1 Governing law.",
        text: " These Terms are governed by the laws of the Federal Republic of Nigeria.",
      },
      {
        t: "p",
        lead: "18.2 Resolving disputes.",
        text: " Please contact us first and give us 30 days to resolve the issue. If it is not resolved, the parties will try mediation in good faith. A dispute that is still unresolved is subject to the exclusive jurisdiction of the courts of Nigeria, in Lagos State. Nothing stops you from complaining to a regulator, including the NDPC for data matters or the FCCPC for consumer matters.",
      },
      {
        t: "p",
        lead: "18.3 General.",
        text: " If part of these Terms is unenforceable, the rest stays in force. These Terms and the documents they refer to are the entire agreement between you and AuraPass on this subject. Our failure to enforce a right is not a waiver of it.",
      },
    ],
  },
];

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms and Conditions | AuraPass" },
      {
        name: "description",
        content:
          "The AuraPass Terms and Conditions: ticket purchases, service fees, organiser payouts and withdrawals, refunds, data protection under the NDPA, and governing law.",
      },
      { property: "og:title", content: "Terms and Conditions | AuraPass" },
      {
        property: "og:description",
        content: "Terms governing your use of AuraPass as an attendee or organiser.",
      },
      { property: "og:url", content: "https://aurapassticket.com/terms" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://aurapassticket.com/terms" }],
  }),
  component: TermsPage,
});

function RenderBlock({ block }: { block: Block }) {
  if (block.t === "ul") {
    return (
      <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-foreground-secondary">
        {block.items.map((item, i) => (
          <li key={i}>
            {item.lead ? (
              <strong className="font-semibold text-foreground">{item.lead}</strong>
            ) : null}
            {item.text}
          </li>
        ))}
      </ul>
    );
  }
  if (block.t === "table") {
    return (
      <div className="mt-3 overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[420px] text-left text-sm">
          <thead className="bg-muted/50 text-foreground">
            <tr>
              {block.head.map((h) => (
                <th key={h} className="px-3 py-2 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-foreground-secondary">
            {block.rows.map((row, i) => (
              <tr key={i} className="border-t border-border">
                {row.map((cell, j) => (
                  <td key={j} className="px-3 py-2 align-top">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  return (
    <p className="mt-3 text-sm leading-relaxed text-foreground-secondary">
      {block.lead ? <strong className="font-semibold text-foreground">{block.lead}</strong> : null}
      {block.text}
    </p>
  );
}

function FeeSummary() {
  return (
    <section
      id="fee-summary"
      aria-labelledby="fee-summary-title"
      className="scroll-mt-24 rounded-xl border border-border bg-card p-5 md:p-6"
    >
      <h2 id="fee-summary-title" className="text-xl font-semibold text-foreground">
        Fee summary
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-foreground-secondary">
        AuraPass charges attendees a service fee of up to 3.5% of the ticket subtotal plus ₦100 per
        ticket, and charges organisers 1.5% when they withdraw funds. Before an event ends,
        organisers may request a withdrawal at most twice, up to 80% of total ticket sales in all
        (section 7.5).
      </p>
      <div className="mt-4 overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="bg-muted/50 text-foreground">
            <tr>
              <th className="px-3 py-2 font-semibold">Who pays</th>
              <th className="px-3 py-2 font-semibold">Fee</th>
              <th className="px-3 py-2 font-semibold">When it is charged</th>
              <th className="px-3 py-2 font-semibold">Basis</th>
            </tr>
          </thead>
          <tbody className="text-foreground-secondary">
            <tr className="border-t border-border">
              <td className="px-3 py-2 align-top">Attendee</td>
              <td className="px-3 py-2 align-top">Up to 3.5% + ₦100 per ticket</td>
              <td className="px-3 py-2 align-top">At checkout, shown before payment</td>
              <td className="px-3 py-2 align-top">
                3.5% of the ticket subtotal, plus ₦100 for each ticket bought
              </td>
            </tr>
            <tr className="border-t border-border">
              <td className="px-3 py-2 align-top">Organiser</td>
              <td className="px-3 py-2 align-top">1.5%</td>
              <td className="px-3 py-2 align-top">When funds are withdrawn</td>
              <td className="px-3 py-2 align-top">1.5% of the amount withdrawn</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-foreground-secondary">
        <strong className="font-semibold text-foreground">Attendee example.</strong> 2 tickets at
        ₦5,000 each. Subtotal ₦10,000. Service fee = 3.5% × ₦10,000 (₦350) + 2 × ₦100 (₦200) =
        ₦550. Attendee pays ₦10,550.
      </p>
      <p className="mt-2 text-sm leading-relaxed text-foreground-secondary">
        <strong className="font-semibold text-foreground">Organiser example.</strong> Withdrawing
        ₦100,000 of ticket sales. Withdrawal fee = 1.5% × ₦100,000 = ₦1,500. Organiser receives
        ₦98,500.
      </p>
      <p className="mt-2 text-sm text-muted-foreground">Full fee terms are in sections 5 and 7.</p>
    </section>
  );
}

function TermsPage() {
  return (
    <PageWrapper>
      <div className="bg-background">
        <div className="mx-auto max-w-3xl px-4 py-12 md:px-6 md:py-16">
          <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Terms and Conditions
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
          <p className="mt-4 text-sm leading-relaxed text-foreground-secondary">
            These Terms govern use of aurapassticket.com (the "Platform") and are governed by the
            laws of the Federal Republic of Nigeria.
          </p>

          <div className="mt-8">
            <FeeSummary />
          </div>

          <nav aria-label="Contents" className="mt-8 rounded-xl border border-border p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Contents
            </h2>
            <ol className="mt-3 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="text-foreground-secondary hover:text-primary">
                    {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="mt-10 space-y-10">
            {SECTIONS.map((s) => (
              <section key={s.id} id={s.id} className="scroll-mt-24">
                <h2 className="text-xl font-semibold text-foreground">{s.title}</h2>
                {s.blocks.map((b, i) => (
                  <RenderBlock key={i} block={b} />
                ))}
                {s.id === "law" ? (
                  <p className="mt-3 text-sm leading-relaxed text-foreground-secondary">
                    <strong className="font-semibold text-foreground">18.4 Contact.</strong> For
                    questions about these Terms or your data, email{" "}
                    <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary hover:underline">
                      {SUPPORT_EMAIL}
                    </a>
                    .
                  </p>
                ) : null}
              </section>
            ))}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
