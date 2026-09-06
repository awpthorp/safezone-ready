export interface LegalSection {
  heading: string;
  paragraphs: string[];
}

export interface LegalDoc {
  id: "privacy" | "terms";
  h1: string;
  updated: string;
  sections: LegalSection[];
}

export const privacyDoc: LegalDoc = {
  id: "privacy",
  h1: "Privacy",
  updated: "6 September 2026",
  sections: [
    {
      heading: "Who is responsible",
      paragraphs: [
        "The operator of safezoneready.com is the data controller for this site. We have not published a company number, ICO registration or street address. A contact mailbox will be published on this page before paid processing goes live.",
      ],
    },
    {
      heading: "Local checks never upload",
      paragraphs: [
        "A check of an ad still never uploads your file. Scoring runs in your browser. We do not receive the image, the pixels or a copy of the filename for a score.",
      ],
    },
    {
      heading: "AI edits",
      paragraphs: [
        "If you ask us to move the offer, you must sign in with Google. We then store the image for at most 72 hours, send it to Google Gemini to edit, and keep a credits ledger against your account.",
        "Live Gemini edits include a SynthID watermark. You cannot remove that watermark in this product.",
      ],
    },
    {
      heading: "Cookies and sign-in",
      paragraphs: [
        "We only set a session cookie after you sign in. A local check does not set an account cookie.",
        "On safezoneready.com we load DataFast to count visits and referrers. That script may set a first-party analytics cookie. We do not load it on staging, Pages previews or localhost. If we later load Google Analytics, we will say so here and add a cookie notice where UK or EU law requires it. Cloudflare Web Analytics, if enabled, is cookieless.",
      ],
    },
    {
      heading: "What we store after sign-in",
      paragraphs: [
        "After you sign in we may hold your Google account identifier, email and name as Google provides them, a credits ledger (complimentary and purchased), job metadata for AI edits, and short-lived abuse logs such as a hashed IP and User-Agent.",
        "Image binaries are deleted within 72 hours. The credits ledger and job metadata may be kept for up to 24 months or until you ask us to delete the account.",
      ],
    },
    {
      heading: "Google as a processor",
      paragraphs: [
        "Google is a processor for sign-in (OAuth). Google Gemini is a sub-processor for image bytes on the AI-edit path only. Local checks never leave the device.",
      ],
    },
    {
      heading: "Credits",
      paragraphs: [
        "Two complimentary edits come with a new account. When billing is live, packs are £9 for 20 edits and £29 for 80 edits. The ledger is how we know what you have used.",
      ],
    },
    {
      heading: "Children",
      paragraphs: [
        "This product is not for people under 18.",
      ],
    },
    {
      heading: "Your rights (UK GDPR)",
      paragraphs: [
        "You can ask for a copy of the personal data we hold, ask us to correct it, delete it, restrict how we use it, object to some uses, or receive a copy in a portable form. You can complain to the Information Commissioner's Office, the UK regulator. We have not published an ICO registration number.",
        "Write to the mailbox on this page once it is published. Until paid processing is live, do not send personal data to an unpublished address.",
      ],
    },
    {
      heading: "Scores and affiliation",
      paragraphs: [
        "Overlays are approximate guardrails from public platform guidance and measured templates. They are not a certification from Meta, Google or TikTok. Safe Zone Ready is not affiliated with, endorsed by, or certified by Meta, Facebook, Instagram, Google, YouTube or TikTok.",
      ],
    },
    {
      heading: "Other products",
      paragraphs: [
        "Posterly is a separate product. A link after download is optional.",
      ],
    },
  ],
};

export const termsDoc: LegalDoc = {
  id: "terms",
  h1: "Terms",
  updated: "6 September 2026",
  sections: [
    {
      heading: "The service",
      paragraphs: [
        "These terms cover use of Safe Zone Ready at safezoneready.com. The operator of safezoneready.com provides the service. A contact mailbox will be published on the privacy page before paid processing goes live.",
      ],
    },
    {
      heading: "The checker",
      paragraphs: [
        "The overlay checker is free. Scores estimate where captions, buttons and profile rows may cover your creative. Device size, caption length and tests on the platforms can move those elements. This is not legal, brand-safety or policy approval.",
        "Safe Zone Ready is not affiliated with, endorsed by, or certified by Meta, Facebook, Instagram, Google, YouTube or TikTok. Overlays are approximate guardrails from public documentation and measured templates. Always preview in the official ads manager before you spend.",
      ],
    },
    {
      heading: "AI edits and credits",
      paragraphs: [
        "Complimentary edits are limited to two per new account. When billing is live, packs are £9 for 20 edits and £29 for 80 edits. Unused purchased credits do not expire in this version of the product. We refund a credit when our verifier cannot keep your required text.",
        "AI-edited images are generated with Google Gemini and include a SynthID watermark. You cannot remove it in this product. We store the image for at most 72 hours on that path.",
      ],
    },
    {
      heading: "Accounts and age",
      paragraphs: [
        "You must be 18 or over. Sign-in uses Google. We set a session cookie only after you sign in. You are responsible for the stills you send for an edit.",
      ],
    },
    {
      heading: "Acceptable use",
      paragraphs: [
        "Do not use this product for child sexual abuse material, unlawful ads, or to bypass platform disclosure rules. Do not attack the service or harvest complimentary edits with throwaway accounts. We may suspend accounts that do.",
      ],
    },
    {
      heading: "Paid processing",
      paragraphs: [
        "Paid packs are not live yet. Do not send payment details to this site until checkout is switched on. The privacy page will carry a mailbox before paid processing goes live.",
      ],
    },
    {
      heading: "Other products",
      paragraphs: [
        "Posterly is a separate product. The link after download is optional.",
      ],
    },
    {
      heading: "Changes and law",
      paragraphs: [
        "We may update these terms. The date at the top will change when we do. These terms are governed by the law of England and Wales.",
      ],
    },
  ],
};

export function legalDocFor(id: "privacy" | "terms"): LegalDoc {
  return id === "privacy" ? privacyDoc : termsDoc;
}
