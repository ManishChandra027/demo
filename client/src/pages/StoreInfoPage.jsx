import { Link } from "react-router-dom";
import { AlertTriangle, ArrowLeft } from "lucide-react";

const draftNote =
  "Portfolio-project template. Confirm its deployment-specific details before collecting real user information or adapting it for a commercial store.";

const pageContent = {
  privacy: {
    eyebrow: "Store information",
    title: "Privacy notice",
    intro:
      "RareWolf is a portfolio project demonstrating an e-commerce application. This starter notice explains the kinds of information the demo can process; it is not legal advice or a production privacy policy.",
    sections: [
      {
        title: "Information used by the store",
        body: "If you create an account in a deployed demo, the application may process your name, email, optional phone number, saved delivery addresses, password hash, cart, wishlist and order details. Use test information only. Passwords are stored as hashes; online card payments are not enabled.",
      },
      {
        title: "How information is used",
        body: "The demo uses account and order information to demonstrate sign-in, profile, saved-address, cart, checkout and order-history features. Do not use the demo for real purchases or submit information you need to keep private.",
      },
      {
        title: "Service providers and storage",
        body: "The project is designed to use MongoDB for application data, an SMTP provider for account emails, and Cloudinary for uploaded catalogue images. Actual providers and retention depend on the environment where a copy is deployed.",
      },
      {
        title: "Cookies and account security",
        body: "The application uses HTTP-only cookies for authentication. Cookie behavior and data retention depend on the deployment configuration; this demo does not promise a production retention period.",
      },
      {
        title: "Retention and customer requests",
        body: "For a portfolio demo, avoid entering real personal information. Before public production use, the project owner must set a retention schedule and provide a monitored process for access, correction and deletion requests.",
      },
      {
        title: "Store operator and effective date",
        body: "Project: RareWolf e-commerce portfolio demo. Maintainer: Manish Chandra. Draft updated: 22 October 2026. A production operator and privacy contact must be identified before this project is used as a real store.",
      },
    ],
  },
  terms: {
    eyebrow: "Store information",
    title: "Demo terms of use",
    intro:
      "RareWolf is a portfolio/resume project built to demonstrate an e-commerce experience. These demo terms are not a commercial offer or a substitute for terms reviewed for a real business.",
    sections: [
      {
        title: "Store operator",
        body: "This website is a software demonstration maintained by Manish Chandra, with a second contributor credited on the About page. It is not presented as an operating retail business.",
      },
      {
        title: "Catalogue and orders",
        body: "Catalogue entries may be sample content and can be inaccurate or unavailable. Do not rely on displayed product information as a real offer. Checkout and order screens demonstrate application behavior only.",
      },
      {
        title: "Payment",
        body: "The demo currently displays Cash on Delivery (COD). No real payment should be made or expected through this portfolio project.",
      },
      {
        title: "Delivery",
        body: "Shipping amounts, service areas and delivery estimates shown in the demo are illustrative and do not represent a delivery service.",
      },
      {
        title: "Cancellation, returns, and refunds",
        body: "Orders, cancellations, returns and refunds are simulated application features. No physical goods are promised or shipped through this demo.",
      },
      {
        title: "Applicable terms",
        body: "If this software is adapted for a real store, its owner must publish business-specific terms and have them reviewed for the applicable jurisdiction before accepting orders.",
      },
    ],
  },
  contact: {
    eyebrow: "Portfolio project",
    title: "About this project",
    intro:
      "RareWolf is a portfolio demonstration, not a live retail business. This page does not accept support requests or provide order assistance.",
    sections: [
      {
        title: "Project enquiries",
        body: "No monitored project email, phone number or contact form is configured. Add a public portfolio or professional contact link here if you want visitors to reach the project maintainer.",
      },
      {
        title: "Demo accounts and orders",
        body: "Use test information only. Accounts, catalogue entries and orders are provided to demonstrate the software and do not represent customer service or real fulfilment.",
      },
    ],
  },
  help: {
    eyebrow: "Portfolio project",
    title: "Demo guide",
    intro:
      "These notes explain the demo flows. Use test information only; there is no live retail customer-support service.",
    sections: [
      {
        title: "How do I track an order?",
        body: "Sign in and open My Orders to see the current order status.",
      },
      {
        title: "Are demo orders real?",
        body: "No. Orders are created to demonstrate the checkout and order-management flows. No goods are shipped and no real payment is collected.",
      },
      {
        title: "How do I change my delivery address?",
        body: "Manage saved delivery addresses in your account. An order keeps a snapshot of the address selected at checkout.",
      },
      {
        title: "How can I contact the project team?",
        body: "There is no monitored contact channel configured. See the About page for project credits; the maintainer can add a professional contact link if desired.",
      },
    ],
  },
  about: {
    eyebrow: "About RareWolf",
    title: "Our story",
    intro:
      "RareWolf is a full-stack e-commerce portfolio project created to demonstrate how a modern online store can work from product discovery through account and order management. It brings together a React storefront and an API-backed commerce workflow, with a focus on clear, responsive customer experiences.",
    sections: [
      {
        title: "Built as a practical project",
        body: "The project explores catalogue browsing, search and filters, product details, saved addresses, cart and checkout flows, account tools, and administration. Product listings and checkout are for demonstration; this site does not represent a verified retail operation.",
      },
    ],
    developers: [
      {
        name: "Manish Chandra",
        role: "Project Lead · Full-Stack Developer",
        contribution:
          "Led project development and implemented core features across the storefront, backend APIs, authentication, user accounts, and e-commerce workflows.",
      },
      {
        name: "Shivraj Singh Nathavat",
        role: "UI/UX Designer & Testing Engineer",
        contribution:
          "Contributed to improving the website's user interface and usability, testing website functionality, identifying UI issues, and verifying responsive behavior across different screen sizes.",
      },
    ],
  },
};

const StoreInfoPage = ({ type }) => {
  const content = pageContent[type] || pageContent.help;
  const isDraft = ["privacy", "terms", "contact", "about"].includes(type);

  return (
    <article className="mx-auto max-w-4xl space-y-6">
      <header className="rounded-2xl border border-line bg-white p-6 shadow-card sm:p-9">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-rarewolf-primary hover:underline"
        >
          <ArrowLeft size={16} /> Back to store
        </Link>
        <p className="mt-7 text-sm font-semibold uppercase tracking-[0.16em] text-rarewolf-primary">
          {content.eyebrow}
        </p>
        <h1 className="mt-2 text-3xl font-bold text-ink">{content.title}</h1>
        <p className="mt-3 text-sm leading-6 text-ink-secondary">
          {content.intro}
        </p>
        {isDraft && (
          <div
            role="note"
            className="mt-5 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950"
          >
            <AlertTriangle size={18} className="mt-1 shrink-0" />
            <span>{draftNote}</span>
          </div>
        )}
      </header>

      <div className="divide-y divide-line rounded-2xl border border-line bg-white px-6 shadow-card sm:px-9 py-12">
        {content.sections.map((section) => (
          <section key={section.title} className="py-6">
            <h2 className="text-lg font-bold text-ink">{section.title}</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-7 text-ink-secondary">
              {section.body}
            </p>
          </section>
        ))}

        {type === "about" && content.developers && (
          <section aria-labelledby="developers-heading" className="space-y-4">
            <header>
              <p className="mt-4 text-sm font-semibold uppercase tracking-[0.16em] text-rarewolf-primary">
                The team
              </p>
              <h2
                id="developers-heading"
                className="mt-1 text-2xl font-bold text-ink"
              >
                Meet the developers
              </h2>
            </header>
            <div className="grid gap-4 sm:grid-cols-2">
              {content.developers.map((developer) => (
                <article
                  key={developer.role}
                  className="rounded-2xl border border-line bg-white p-6 shadow-card"
                >
                  <h3 className="text-lg font-bold text-ink">
                    {developer.name}
                  </h3>
                  <p className="mt-1 text-sm font-semibold text-rarewolf-primary">
                    {developer.role}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-ink-secondary">
                    {developer.contribution}
                  </p>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>

      {type === "help" && (
        <nav
          aria-label="Customer account links"
          className="flex flex-wrap gap-3"
        >
          <Link
            className="rounded-lg border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-soft"
            to="/orders"
          >
            My orders
          </Link>
          <Link
            className="rounded-lg border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-soft"
            to="/account/addresses"
          >
            My addresses
          </Link>
          <Link
            className="rounded-lg border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-soft"
            to="/contact"
          >
            Contact details
          </Link>
        </nav>
      )}
    </article>
  );
};

export default StoreInfoPage;
