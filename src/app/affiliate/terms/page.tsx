import type { Metadata } from 'next';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Affiliate Terms of Service | Captioni',
  description:
    'Affiliate Terms of Service for the Captioni Affiliate Program, including commissions, cookie window, payouts, and compliance rules.',
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://captioni.com/affiliate/terms' },
  openGraph: {
    title: 'Affiliate Terms of Service | Captioni',
    description:
      'Commissions, attribution, payout schedule, prohibited conduct, and compliance for the Captioni Affiliate Program.',
    url: 'https://captioni.com/affiliate/terms',
    type: 'article',
  },
};

export default function AffiliateTermsPage() {
  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Affiliate Terms of Service</h1>
        <p className={styles.subtitle}>
          Effective date: <strong>September 2, 2025</strong>
        </p>
        <p className={styles.metaNote}>
          These Affiliate Terms (the “Terms”) govern participation in the Captioni Affiliate
          Program (“Program”) operated by <strong>Captioni</strong> (the “Company”, “we”, “us”,
          “our”). By applying to or participating in the Program, you agree to these Terms.
        </p>
        <p className={styles.backlink}>
          ← <a href="/affiliate">Back to Affiliate Program</a>
        </p>
      </header>

      <section className={styles.section}>
        <h2>1) Enrollment & Eligibility</h2>
        <p>
          You must be at least 18 years old and have the legal capacity to enter these Terms. To
          join, submit an application via our affiliate platform (currently Rewardful). We may
          approve, deny, or revoke participation at our sole discretion, including for content
          quality, audience fit, compliance history, or risk concerns. We may request additional
          information (e.g., your primary channel, links, reach, or promotion plan).
        </p>
      </section>

      <section className={styles.section}>
        <h2>2) Account, Links & Materials</h2>
        <ul className={styles.list}>
          <li>
            Upon approval, you’ll receive access to a dashboard with your unique affiliate link(s).
            You are responsible for safeguarding your account and links.
          </li>
          <li>
            You may use our brand assets, screenshots, and promo materials solely to promote
            Captioni in accordance with these Terms and any brand guidelines we provide.
          </li>
          <li>
            You agree not to misrepresent our product, pricing, features, or affiliation. Any claim
            of endorsement must be truthful and not misleading.
          </li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>3) Commissions</h2>
        <ul className={styles.list}>
          <li>
            <strong>Rates:</strong> You earn <strong>40%</strong> of the customer’s{' '}
            <strong>first payment</strong> and <strong>30%</strong> on <strong>up to 11</strong>{' '}
            subsequent billing cycles while the subscription remains active. No commissions accrue if
            the subscription is canceled or payment fails.
          </li>
          <li>
            <strong>Attribution:</strong> Last-click attribution with a <strong>30-day</strong>{' '}
            cookie window. If a user purchases within 30 days of your link click, you are credited
            (subject to these Terms).
          </li>
          <li>
            <strong>Lock & Validation:</strong> A <strong>30-day lock</strong> applies to new
            conversions to allow for refunds, chargebacks, fraud checks, and payment clearance.
          </li>
          <li>
            <strong>Reversals & Adjustments:</strong> We may reverse or adjust commissions for
            refunds, chargebacks, suspected or confirmed fraud, policy violations, test/self-purchase
            activity, or billing errors.
          </li>
          <li>
            <strong>Caps:</strong> There is no cap on earnings under the stated plan. We may
            introduce special campaigns with different terms; any such terms will be stated in the
            campaign details.
          </li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>4) Payouts</h2>
        <ul className={styles.list}>
          <li>
            <strong>Schedule:</strong> Commissions validated in the previous calendar month are paid
            around the <strong>1st of each month</strong>.
          </li>
          <li>
            <strong>Minimum payout:</strong> <strong>$25</strong>. Balances under $25 roll over.
          </li>
          <li>
            <strong>Methods:</strong> We currently support PayPal and bank transfer (e.g., ACH/Wise)
            where available.
          </li>
          <li>
            <strong>Taxes & Info:</strong> You are responsible for providing accurate payout
            information and required tax forms, and for all taxes arising from your commissions.
          </li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>5) Coupons & Promotions</h2>
        <p>
          If we issue affiliate-specific coupons, they are for promotional use only and may be tied
          to your account for attribution. Coupon misuse (e.g., posting private coupons on deal
          sites when prohibited) may result in reversal of commissions and removal from the Program.
        </p>
      </section>

      <section className={styles.section}>
        <h2>6) Prohibited Conduct</h2>
        <ul className={styles.list}>
          <li>
            <strong>Brand bidding:</strong> No bidding on “Captioni” or confusingly similar terms,
            or our domain, in search or shopping ads.
          </li>
          <li>
            <strong>Misleading ads/claims:</strong> No false, deceptive, or unsubstantiated claims,
            including income guarantees.
          </li>
          <li>
            <strong>Spam/unsolicited outreach:</strong> No unsolicited DMs, emails from purchased
            lists, or platform TOS violations.
          </li>
          <li>
            <strong>Cookie stuffing & technical manipulation:</strong> No hidden iframes, forced
            clicks, or unauthorized tracking methods.
          </li>
          <li>
            <strong>Self-purchase:</strong> You may not use your own affiliate link to purchase.
          </li>
          <li>
            <strong>Infringing/illegal content:</strong> No content that infringes IP rights,
            violates laws, or promotes hate/abuse.
          </li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>7) Compliance & Disclosures</h2>
        <ul className={styles.list}>
          <li>
            You must comply with all applicable laws and platform rules, including advertising,
            privacy, consumer protection, and anti-spam laws.
          </li>
          <li>
            <strong>FTC/ASA/etc. disclosures:</strong> You must clearly disclose your affiliate
            relationship (e.g., “This post contains affiliate links; I may earn a commission.”) and
            use appropriate hashtags (#ad, #affiliate) where required.
          </li>
          <li>
            You must respect user privacy and obtain any necessary consents before tracking.
          </li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>8) Intellectual Property & Brand Use</h2>
        <p>
          All Captioni trademarks, logos, and materials are our property. We grant you a limited,
          revocable, non-exclusive license to use them solely to promote Captioni under these Terms
          and any brand guidelines we provide. You may not register or use domains, usernames, or
          ads that are confusingly similar to our brand.
        </p>
      </section>

      <section className={styles.section}>
        <h2>9) Term, Suspension & Termination</h2>
        <ul className={styles.list}>
          <li>
            These Terms apply from your approval date until terminated by either party. You may
            terminate anytime by ceasing participation and notifying us.
          </li>
          <li>
            We may suspend or terminate your participation immediately for any violation, suspected
            fraud, risk, or harm to our brand or customers.
          </li>
          <li>
            Upon termination, you must stop using our links and materials. Valid, non-fraudulent,
            locked commissions accrued prior to termination will be paid per Section 4.
          </li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>10) Changes to the Program or Terms</h2>
        <p>
          We may modify or discontinue the Program or these Terms at any time. Material changes will
          be posted on this page with an updated effective date. Your continued participation after
          changes constitutes acceptance.
        </p>
      </section>

      <section className={styles.section}>
        <h2>11) Disclaimers & Limitation of Liability</h2>
        <ul className={styles.list}>
          <li>
            The Program and materials are provided “as is”. We disclaim all warranties to the
            maximum extent permitted by law.
          </li>
          <li>
            To the fullest extent permitted by law, our aggregate liability to you arising out of
            the Program is limited to the commissions paid to you in the <strong>six (6)
            months</strong> preceding the event giving rise to the claim.
          </li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>12) Indemnification</h2>
        <p>
          You agree to indemnify and hold us harmless from any claims, damages, liabilities, costs,
          and expenses (including reasonable attorneys’ fees) arising from your participation in the
          Program, your promotions, or your breach of these Terms.
        </p>
      </section>

      <section className={styles.section}>
        <h2>13) Independent Contractors</h2>
        <p>
          You and the Company are independent contractors. Nothing in these Terms creates a
          partnership, joint venture, agency, or employment relationship.
        </p>
      </section>

      <section className={styles.section}>
        <h2>14) Governing Law & Venue</h2>
        <p>
          These Terms are governed by the laws of the State of Delaware, USA, without regard to its
          conflict of laws rules. Exclusive venue for disputes is in courts located in Delaware, USA.
        </p>
      </section>

      <section className={styles.section}>
        <h2>15) Miscellaneous</h2>
        <ul className={styles.list}>
          <li>
            <strong>Entire Agreement:</strong> These Terms constitute the entire agreement regarding
            your participation and supersede prior discussions.
          </li>
          <li>
            <strong>Assignment:</strong> You may not assign these Terms without our consent. We may
            assign to an affiliate or successor.
          </li>
          <li>
            <strong>Severability:</strong> If any provision is unenforceable, the remaining
            provisions remain in effect.
          </li>
          <li>
            <strong>Notices:</strong> Contact us at{' '}
            <a href="mailto:affiliates@captioni.com">affiliates@captioni.com</a>.
          </li>
        </ul>
          </section>
          
          <section className={styles.section}>
        <h2>16) Privacy & Data</h2>
        <ul className={styles.list}>
          <li>
            The Program uses <strong>Rewardful</strong> to track referrals via cookies and link
            parameters. By participating, you consent to the placement and use of cookies for
            attribution.
          </li>
          <li>
            We may process limited personal data (e.g., name, email, payout details) to operate the
            Program, calculate commissions, and issue payouts.
          </li>
          <li>
            We will not sell your data. Data may be shared with service providers strictly as needed
            (e.g., payment processors).
          </li>
          <li>
            You are responsible for complying with privacy and data protection laws in your own
            promotions (e.g., GDPR, CCPA, platform rules).
          </li>
          <li>
            For more information, please see our general{' '}
            <a href="/privacy" target="_blank" rel="noopener noreferrer">
              Privacy Policy
            </a>
            .
          </li>
        </ul>
      </section>

      <footer className={styles.footer}>
        <p className={styles.note}>
          This page is provided for informational purposes and does not constitute legal advice. You
          should consult your own counsel regarding your obligations.
        </p>
      </footer>
    </main>
  );
}
