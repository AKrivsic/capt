/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from 'next';
import Image from 'next/image';
import styles from './affiliate.module.css';

// TODO: Replace with actual affiliate program URL
const AFFILIATE_JOIN_URL = 'https://lucyto-trade.getrewardful.com/signup';

const addUTMParams = (url: string, content: string) => {
  const utm = `utm_source=affiliate_lp&utm_medium=button&utm_campaign=recruitment&utm_content=${encodeURIComponent(
    content
  )}`;
  return `${url}${url.includes('?') ? '&' : '?'}${utm}`;
};

export const metadata: Metadata = {
  title: 'Captioni Affiliate Program – 40% + 30% Recurring',
  description:
    'Earn 40% on first payments + 30% recurring for 11 months. Approval <24h, ready-to-post scripts, $25 min payout.',

  alternates: { canonical: 'https://captioni.com/affiliate' },
  openGraph: {
    title: 'Captioni Affiliate Program',
    description:
      'Earn 40% first + 30% recurring. Approval <24h. Ready-to-post assets. $25 min payout.',
    url: 'https://captioni.com/affiliate',
    type: 'website',
    images: [
      {
        url: 'https://captioni.com/og/affiliate.png',
        width: 1200,
        height: 630,
        alt: 'Captioni Affiliate Program – Earn 40% + 30% Recurring',
      },
    ],
  },
  robots: { index: true, follow: true },
};

export default function AffiliatePage() {
  return (
    <div className={styles.container}>
      {/* Sticky CTA (mobile) */}
      <div className={styles.stickyCta}>
        <a
          href={addUTMParams(AFFILIATE_JOIN_URL, 'sticky_cta')}
          target="_blank"
          rel="nofollow noopener"
          className={styles.stickyCtaBtn}
          aria-label="Join the Captioni affiliate program"
        >
          Get your link in 2 minutes
        </a>
      </div>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Earn <span className={styles.highlight}>40% + 30% recurring</span>{' '}
            Promoting an AI Tool Creators Already Want
          </h1>
          <p className={styles.heroSubtitle}>
            Approval in &lt;24h. Grab ready-to-post scripts & assets. First payout from $25.
          </p>

          <div className={styles.heroActions}>
            <a
              href={addUTMParams(AFFILIATE_JOIN_URL, 'hero_cta')}
              target="_blank"
              rel="nofollow noopener"
              className={styles.primaryCTA}
              data-analytics="affiliate_hero_cta"
            >
              Join & get your link
            </a>
            <a href="/affiliate/resources" className={styles.secondaryCTA}>
              See promo kit →
            </a>
          </div>

          {/* Earnings snapshot */}
          <div className={styles.earningsCard} aria-label="Earnings snapshot">
            <div className={styles.earnRow}>
              <div>5 new Pro signups/mo</div>
              <div className={styles.earnVal}>$58 first + $43/mo</div>
            </div>
            <div className={styles.earnRow}>
              <div>10 new Pro signups/mo</div>
              <div className={styles.earnVal}>$116 first + $87/mo</div>
            </div>
            <div className={styles.earnRow}>
              <div>25 new Pro signups/mo</div>
              <div className={styles.earnVal}>$290 first + $217/mo</div>
            </div>
            <p className={styles.earnNote}>
              Example assumes $29/mo plan and active subscriptions.
            </p>
          </div>
        </div>

        <div className={styles.heroVisual}>
          <Image
            src="/affiliate-hero.webp"
            alt="Affiliate success illustration"
            width={560}
            height={540}
            priority
            className={styles.heroIllustration}
          />
        </div>
      </section>

      {/* How it works */}
      <section className={styles.howItWorks}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Live in 3 Minutes</h2>
          <p className={styles.sectionSubtitle}>Apply, copy, post — start earning.</p>
        </div>
        <div className={styles.stepsGrid}>
          <div className={styles.step}>
            <div className={styles.stepNumber}>1</div>
            <h3 className={styles.stepTitle}>Apply & get approved (&lt;24h)</h3>
            <p className={styles.stepDescription}>
              Rewardful-powered program with manual review for quality &amp; safety.
            </p>
          </div>
          <div className={styles.step}>
            <div className={styles.stepNumber}>2</div>
            <h3 className={styles.stepTitle}>Copy a ready script</h3>
            <p className={styles.stepDescription}>
              Grab a TikTok/Reel/Shorts script, caption &amp; hashtags from our promo kit.
            </p>
          </div>
          <div className={styles.step}>
            <div className={styles.stepNumber}>3</div>
            <h3 className={styles.stepTitle}>Pin your link → earn</h3>
            <p className={styles.stepDescription}>
              Use your unique link. Get paid monthly for every active customer.
            </p>
          </div>
        </div>
      </section>

      {/* Commission */}
      <section className={styles.commissionPlan}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Commission Plan</h2>
          <p className={styles.sectionSubtitle}>
            One of the most generous in creator tools.
          </p>
        </div>

        <div className={styles.commissionGrid}>
          <div className={styles.commissionCard}>
            <h3 className={styles.commissionTitle}>First Payment</h3>
            <div className={styles.commissionRate}>40%</div>
            <p className={styles.commissionDescription}>
              Earn 40% on the first payment from every customer you refer.
            </p>
          </div>
          <div className={styles.commissionCard}>
            <h3 className={styles.commissionTitle}>Recurring</h3>
            <div className={styles.commissionRate}>30%</div>
            <p className={styles.commissionDescription}>
              Keep earning 30% for the next 11 billing cycles per active subscription.
            </p>
          </div>
        </div>

        <div className={styles.exampleBox}>
          <p className={styles.exampleTitle}>Example payout</p>
          <p className={styles.exampleText}>
            Refer <strong>10 Pro</strong> customers ($29/mo) →{' '}
            <strong>$116</strong> first month + <strong>$87/mo</strong> recurring (while active).
          </p>
        </div>

        <ul className={styles.detailsList}>
          <li>Minimum payout: <strong>$25</strong></li>
          <li>Payments on the <strong>1st</strong> of each month</li>
          <li><strong>30-day</strong> lock for new customers</li>
          <li>No earnings cap</li>
        </ul>
      </section>

      {/* Flow (quick path) */}
      <section className={styles.flow}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Your Path to Earning</h2>
          <p className={styles.sectionSubtitle}>
            From signup to monthly payouts — the process at a glance.
          </p>
        </div>
        <div className={styles.flowGrid}>
          <div className={styles.flowItem}>
            <div className={styles.flowIcon} aria-hidden>
              📝
            </div>
            <h3 className={styles.flowTitle}>Join</h3>
            <p className={styles.flowText}>
              Apply for free via Rewardful. Manual approval (&lt;24h).
            </p>
          </div>
          <div className={styles.flowItem}>
            <div className={styles.flowIcon} aria-hidden>
              🔗
            </div>
            <h3 className={styles.flowTitle}>Get Your Link</h3>
            <p className={styles.flowText}>
              Your personal link lives in the dashboard. Add UTM to track.
            </p>
          </div>
          <div className={styles.flowItem}>
            <div className={styles.flowIcon} aria-hidden>
              📦
            </div>
            <h3 className={styles.flowTitle}>Use Resources</h3>
            <p className={styles.flowText}>
              Plug & play scripts, captions, hashtags, logos & screenshots.
            </p>
          </div>
          <div className={styles.flowItem}>
            <div className={styles.flowIcon} aria-hidden>
              📲
            </div>
            <h3 className={styles.flowTitle}>Share Content</h3>
            <p className={styles.flowText}>
              Reels/TikTok/Shorts or community posts. CTA: story link / pinned comment.
            </p>
          </div>
          <div className={styles.flowItem}>
            <div className={styles.flowIcon} aria-hidden>
              💵
            </div>
            <h3 className={styles.flowTitle}>Earn Monthly</h3>
            <p className={styles.flowText}>
              40% first, 30% for 11 months. Paid on the 1st.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className={styles.benefits}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Why Partners Choose Captioni</h2>
          <p className={styles.sectionSubtitle}>Easy to promote, easy to earn.</p>
        </div>
        <div className={styles.benefitsGrid}>
          <div className={styles.benefit}>
            <h3 className={styles.benefitTitle}>High Conversion Rates</h3>
            <p className={styles.benefitDescription}>
              Proven tool with strong demand from content creators and influencers.
            </p>
          </div>
          <div className={styles.benefit}>
            <h3 className={styles.benefitTitle}>Complete Promo Kit</h3>
            <p className={styles.benefitDescription}>
              Scripts, captions, hashtags, logos, screenshots, 10s demo clip.
            </p>
          </div>
          <div className={styles.benefit}>
            <h3 className={styles.benefitTitle}>Creator Demand</h3>
            <p className={styles.benefitDescription}>
              Tool creators actually want — built for IG/TikTok/OnlyFans niches.
            </p>
          </div>
          <div className={styles.benefit}>
            <h3 className={styles.benefitTitle}>Direct Support</h3>
            <p className={styles.benefitDescription}>
              DM the team for optimization tips & collab ideas.
            </p>
          </div>
        </div>
      </section>

      {/* Compliance */}
      <section className={styles.compliance}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Compliance & Ethics</h2>
          <p className={styles.sectionSubtitle}>
            High standards to protect your reputation and our brand.
          </p>
        </div>
        <div className={styles.complianceGrid}>
          <div className={styles.complianceItem}>
            <h3 className={styles.complianceTitle}>No Brand Bidding</h3>
            <p className={styles.complianceDescription}>
              Don't bid on "Captioni" or close variants in paid ads.
            </p>
          </div>
          <div className={styles.complianceItem}>
            <h3 className={styles.complianceTitle}>No Spam / DMs</h3>
            <p className={styles.complianceDescription}>
              Respect user privacy. No unsolicited DMs or bought lists.
            </p>
          </div>
          <div className={styles.complianceItem}>
            <h3 className={styles.complianceTitle}>FTC Disclosure</h3>
            <p className={styles.complianceDescription}>
              Examples: "This post contains affiliate links. I may earn a commission." or "#ad
              #affiliate".
            </p>
          </div>
          <div className={styles.complianceItem}>
            <h3 className={styles.complianceTitle}>No Cookie Stuffing</h3>
            <p className={styles.complianceDescription}>
              Use only legitimate tracking. No hidden iframes or forced cookies.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className={styles.faq}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>FAQ</h2>
          <p className={styles.sectionSubtitle}>What partners ask most.</p>
        </div>
        <div className={styles.faqGrid}>
          <div className={styles.faqItem}>
            <h3 className={styles.faqQuestion}>When do I get paid?</h3>
            <p className={styles.faqAnswer}>
              We pay on the <strong>1st of each month</strong> for the previous month. Minimum payout
              is <strong>$25</strong>.
            </p>
          </div>
          <div className={styles.faqItem}>
            <h3 className={styles.faqQuestion}>What's the attribution model?</h3>
            <p className={styles.faqAnswer}>
              <strong>Last click</strong>, <strong>30-day</strong> cookie window. Recurring applies
              while the subscription remains active.
            </p>
          </div>
          <div className={styles.faqItem}>
            <h3 className={styles.faqQuestion}>Can I use coupons?</h3>
            <p className={styles.faqAnswer}>
              If coupons are enabled for a campaign, they're tracked to your account. Details are
              shared upon approval.
            </p>
          </div>
          <div className={styles.faqItem}>
            <h3 className={styles.faqQuestion}>Is self-purchase allowed?</h3>
            <p className={styles.faqAnswer}>
              No. Self-purchase and incentives that manipulate tracking are prohibited.
            </p>
          </div>
          <div className={styles.faqItem}>
            <h3 className={styles.faqQuestion}>How fast is approval?</h3>
            <p className={styles.faqAnswer}>
              Most applications are reviewed in <strong>&lt;24 hours</strong>.
            </p>
          </div>
          <div className={styles.faqItem}>
            <h3 className={styles.faqQuestion}>Payment methods?</h3>
            <p className={styles.faqAnswer}>
              PayPal and bank transfer (ACH/Wire). More options coming soon.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className={styles.finalCTA}>
        <div className={styles.finalCTAContent}>
          <h2 className={styles.finalCTATitle}>Ready to start earning?</h2>
          <p className={styles.finalCTASubtitle}>
            Apply now, get approved in &lt;24h, and start promoting with plug-&-play assets.
          </p>
          <a
            href={addUTMParams(AFFILIATE_JOIN_URL, 'final_cta')}
            target="_blank"
            rel="nofollow noopener"
            className={styles.finalCTAButton}
            data-analytics="affiliate_final_cta"
            aria-label="Join the Captioni affiliate program now"
          >
            Get your link
          </a>
          <div className={styles.finalSubLinks}>
            <a href="/affiliate/resources" className={styles.finalSubLink}>
              See promo kit →
            </a>
            <a href="/affiliate/terms" className={styles.finalSubLink}>
              Terms of Service
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <p className={styles.footerText}>
            By joining our affiliate program, you agree to our{' '}
            <a href="/affiliate/terms" className={styles.footerLink}>
              Terms of Service
            </a>
            . Questions?{' '}
            <a href="mailto:affiliates@captioni.com" className={styles.footerLink}>
              affiliates@captioni.com
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
