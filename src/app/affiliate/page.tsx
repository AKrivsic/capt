import { Metadata } from 'next';
import styles from './affiliate.module.css';

// TODO: Replace with actual affiliate program URL
const AFFILIATE_JOIN_URL = "https://lucyto-trade.getrewardful.com/signup";

export const metadata: Metadata = {
  title: 'Become a Captioni Affiliate | Earn Up to 40% Commission',
  description: 'Join our affiliate program and earn 40% on first payments plus 30% recurring for 11 months. Promote the #1 AI caption generator trusted by creators worldwide.',
  openGraph: {
    title: 'Become a Captioni Affiliate | Earn Up to 40% Commission',
    description: 'Join our affiliate program and earn 40% on first payments plus 30% recurring for 11 months. Promote the #1 AI caption generator trusted by creators worldwide.',
    type: 'website',
    url: '/affiliate',
  },
};

const addUTMParams = (url: string) => {
  const utmParams = 'utm_source=affiliate_lp&utm_medium=button&utm_campaign=recruitment';
  return `${url}${url.includes('?') ? '&' : '?'}${utmParams}`;
};

// Analytics tracking handled via data attributes and external tracking

export default function AffiliatePage() {
  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Earn Up to <span className={styles.highlight}>40% Commission</span> Promoting Captioni
          </h1>
          <p className={styles.heroSubtitle}>
            Join thousands of affiliates earning passive income by promoting the #1 AI caption generator 
            trusted by creators worldwide
          </p>
          <a
            href={addUTMParams(AFFILIATE_JOIN_URL)}
            className={styles.primaryCTA}

            data-analytics="affiliate_hero_cta"
            aria-label="Join our affiliate program"
          >
            Join Now
          </a>
        </div>
        {/* TODO: Add hero image/illustration here */}
        <div className={styles.heroImage}>
          <div className={styles.imagePlaceholder}>
            TODO: Add hero illustration showing affiliate success
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className={styles.howItWorks}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>How It Works</h2>
          <p className={styles.sectionSubtitle}>
            Get started in minutes and start earning commissions
          </p>
        </div>
        <div className={styles.stepsGrid}>
          <div className={styles.step}>
            <div className={styles.stepNumber}>1</div>
            <h3 className={styles.stepTitle}>Sign Up</h3>
            <p className={styles.stepDescription}>
              Join our affiliate program through Rewardful in under 2 minutes
            </p>
          </div>
          <div className={styles.step}>
            <div className={styles.stepNumber}>2</div>
            <h3 className={styles.stepTitle}>Promote</h3>
            <p className={styles.stepDescription}>
              Use your unique affiliate link and promo materials to drive traffic
            </p>
          </div>
          <div className={styles.step}>
            <div className={styles.stepNumber}>3</div>
            <h3 className={styles.stepTitle}>Earn</h3>
            <p className={styles.stepDescription}>
              Get paid monthly for every customer you bring to Captioni
            </p>
          </div>
        </div>
      </section>

      {/* Commission Plan Section */}
      <section className={styles.commissionPlan}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Commission Plan</h2>
          <p className={styles.sectionSubtitle}>
            One of the most generous affiliate programs in the creator tools space
          </p>
        </div>
        <div className={styles.commissionGrid}>
          <div className={styles.commissionCard}>
            <h3 className={styles.commissionTitle}>First Payment</h3>
            <div className={styles.commissionRate}>40%</div>
            <p className={styles.commissionDescription}>
              Earn 40% commission on the first payment from every customer you refer
            </p>
          </div>
          <div className={styles.commissionCard}>
            <h3 className={styles.commissionTitle}>Recurring Revenue</h3>
            <div className={styles.commissionRate}>30%</div>
            <p className={styles.commissionDescription}>
              Continue earning 30% commission for the next 11 billing cycles
            </p>
          </div>
        </div>
        <div className={styles.commissionDetails}>
          <ul className={styles.detailsList}>
            <li>Minimum payout: $25</li>
            <li>30-day lock period for new customers</li>
            <li>Monthly payments via PayPal or bank transfer</li>
            <li>No cap on earnings - scale as much as you want</li>
          </ul>
        </div>
      </section>

      {/* Benefits Section */}
      <section className={styles.benefits}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Why Partner With Us</h2>
          <p className={styles.sectionSubtitle}>
            We make it easy and rewarding to promote Captioni
          </p>
        </div>
        <div className={styles.benefitsGrid}>
          <div className={styles.benefit}>
            <h3 className={styles.benefitTitle}>Free Pro Account</h3>
            <p className={styles.benefitDescription}>
              Active affiliates get a free Pro subscription to test and showcase our product
            </p>
          </div>
          <div className={styles.benefit}>
            <h3 className={styles.benefitTitle}>Complete Promo Kit</h3>
            <p className={styles.benefitDescription}>
              Banners, email templates, social media posts, and more to help you succeed
            </p>
          </div>
          <div className={styles.benefit}>
            <h3 className={styles.benefitTitle}>Creator-Loved Product</h3>
            <p className={styles.benefitDescription}>
              Promote a product that creators actually want and need - high conversion rates
            </p>
          </div>
          <div className={styles.benefit}>
            <h3 className={styles.benefitTitle}>Dedicated Support</h3>
            <p className={styles.benefitDescription}>
              Direct access to our affiliate team for questions and optimization tips
            </p>
          </div>
        </div>
      </section>

      {/* Compliance Section */}
      <section className={styles.compliance}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Compliance & Ethics</h2>
          <p className={styles.sectionSubtitle}>
            We maintain high standards to protect our brand and your reputation
          </p>
        </div>
        <div className={styles.complianceGrid}>
          <div className={styles.complianceItem}>
            <h3 className={styles.complianceTitle}>No Brand Bidding</h3>
            <p className={styles.complianceDescription}>
              Don&apos;t bid on &quot;Captioni&quot; or similar branded keywords in paid advertising
            </p>
          </div>
          <div className={styles.complianceItem}>
            <h3 className={styles.complianceTitle}>No Spam or DMs</h3>
            <p className={styles.complianceDescription}>
              Respect users&apos; privacy - no unsolicited messages or aggressive outreach
            </p>
          </div>
          <div className={styles.complianceItem}>
            <h3 className={styles.complianceTitle}>FTC Disclosure</h3>
            <p className={styles.complianceDescription}>
              Always disclose your affiliate relationship when promoting our product
            </p>
          </div>
          <div className={styles.complianceItem}>
            <h3 className={styles.complianceTitle}>No Cookie Stuffing</h3>
            <p className={styles.complianceDescription}>
              Use only legitimate tracking methods - no manipulation of tracking cookies
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className={styles.faq}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
          <p className={styles.sectionSubtitle}>
            Everything you need to know about our affiliate program
          </p>
        </div>
        <div className={styles.faqGrid}>
          <div className={styles.faqItem}>
            <h3 className={styles.faqQuestion}>When do I get paid?</h3>
            <p className={styles.faqAnswer}>
              We process payments monthly on the 1st of each month for all commissions earned in the previous month. 
              Minimum payout is $25.
            </p>
          </div>
          <div className={styles.faqItem}>
            <h3 className={styles.faqQuestion}>What&apos;s the minimum payout?</h3>
            <p className={styles.faqAnswer}>
              The minimum payout threshold is $25. Any amount below this will roll over to the next month.
            </p>
          </div>
          <div className={styles.faqItem}>
            <h3 className={styles.faqQuestion}>What payment methods do you support?</h3>
            <p className={styles.faqAnswer}>
              We currently support PayPal and bank transfers (ACH/Wire). More payment options coming soon.
            </p>
          </div>
          <div className={styles.faqItem}>
            <h3 className={styles.faqQuestion}>How long is the cookie window?</h3>
            <p className={styles.faqAnswer}>
              Our cookie window is 30 days. If a customer makes a purchase within 30 days of clicking your link, 
              you&apos;ll earn the commission.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className={styles.finalCTA}>
        <div className={styles.finalCTAContent}>
          <h2 className={styles.finalCTATitle}>Ready to Start Earning?</h2>
          <p className={styles.finalCTASubtitle}>
            Join thousands of successful affiliates earning passive income with Captioni
          </p>
          <a
            href={addUTMParams(AFFILIATE_JOIN_URL)}
            className={styles.finalCTAButton}

            data-analytics="affiliate_final_cta"
            aria-label="Join our affiliate program now"
          >
            Join Our Affiliate Program
          </a>
        </div>
      </section>

      {/* Footer Note */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <p className={styles.footerText}>
            By joining our affiliate program, you agree to our{' '}
            <a href="/affiliate/terms" className={styles.footerLink}>
              Terms of Service
            </a>
            . For questions, contact{' '}
            <a href="mailto:affiliates@captioni.com" className={styles.footerLink}>
              affiliates@captioni.com
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
