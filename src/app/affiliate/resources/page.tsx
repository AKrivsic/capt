import styles from './page.module.css';

// TODO: Replace with actual affiliate program URL
const AFFILIATE_BASE_URL = "https://app.rewardful.com/join/7f3325";

const addUTMParams = (url: string, medium: string = 'link') => {
  const utmParams = `utm_source=affiliate_resources&utm_medium=${medium}&utm_campaign=promo`;
  return `${url}${url.includes('?') ? '&' : '?'}${utmParams}`;
};

// Analytics tracking handled via data attributes and external tracking

export default function AffiliateResourcesPage() {
  return (
    <div className={styles.container}>
      {/* Welcome Section */}
      <section className={styles.section}>
        <div className={styles.welcome}>
          <h1 className={styles.title}>Welcome to Captioni Affiliates!</h1>
          <p className={styles.subtitle}>
            Thank you for joining our affiliate program. You&apos;re now part of a community helping creators 
            discover the #1 AI caption generator. Let&apos;s get you set up for success.
          </p>
          <div className={styles.note}>
            <a href="/affiliate" className={styles.backLink}>
              ← Back to affiliate landing page
            </a>
          </div>
        </div>
      </section>

      {/* Commission Details Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Commission Details</h2>
        <div className={styles.card}>
          <ul className={styles.list}>
            <li><strong>40% commission</strong> on first payment from each customer</li>
            <li><strong>30% commission</strong> recurring for the next 11 billing cycles</li>
            <li><strong>$25 minimum payout</strong> threshold</li>
            <li><strong>30-day lock period</strong> for new customer conversions</li>
            <li><strong>Monthly payments</strong> processed on the 1st of each month</li>
            <li><strong>Payment methods:</strong> PayPal, Wise (bank transfer)</li>
          </ul>
        </div>
      </section>

      {/* Compliance Quick Rules Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Compliance Quick Rules</h2>
        <div className={styles.grid}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>FTC Disclosure Required</h3>
            <p className={styles.cardSubtitle}>Always disclose your affiliate relationship</p>
            <div className={styles.examples}>
              <p><strong>Example 1:</strong> &quot;I earn a commission if you sign up through my link&quot;</p>
              <p><strong>Example 2:</strong> &quot;Affiliate link - I may earn from qualifying purchases&quot;</p>
              <p><strong>Example 3:</strong> &quot;Sponsored/affiliate content&quot;</p>
            </div>
          </div>

          <div className={styles.card}>
            <h3 className={styles.cardTitle}>No Brand Bidding</h3>
            <p className={styles.cardSubtitle}>Forbidden keywords in paid advertising:</p>
            <ul className={styles.list}>
              <li>Captioni</li>
              <li>Caption AI</li>
              <li>AI Caption Generator</li>
              <li>Instagram Caption AI</li>
            </ul>
          </div>

          <div className={styles.card}>
            <h3 className={styles.cardTitle}>No Spam or DMs</h3>
            <ul className={styles.list}>
              <li>No unsolicited direct messages</li>
              <li>No purchased email lists</li>
              <li>No aggressive outreach</li>
              <li>Respect platform terms of service</li>
            </ul>
          </div>

          <div className={styles.card}>
            <h3 className={styles.cardTitle}>No Manipulation</h3>
            <ul className={styles.list}>
              <li>No cookie stuffing</li>
              <li>No hidden iframes</li>
              <li>No self-purchases</li>
              <li>Use only legitimate tracking methods</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Promo Kit Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Promo Kit</h2>
        <div className={styles.grid}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Brand Assets</h3>
            <ul className={styles.list}>
              <li>
                <a 
                  href="/brand-kit.zip" 
                  className={styles.downloadLink}
                  data-event="download"
                  data-cta-name="brand_kit"
                  data-cta-location="promo_kit"
                  rel="noopener noreferrer"
                >
                  📦 Brand Kit (logos, colors, screenshots)
                </a>
              </li>
              <li>
                <a 
                  href="/demo-clip.mp4" 
                  className={styles.downloadLink}
                  data-event="download"
                  data-cta-name="demo_clip"
                  data-cta-location="promo_kit"
                  rel="noopener noreferrer"
                >
                  🎬 10-second demo clip
                </a>
              </li>
              <li><strong>Color codes:</strong> #34D399 (emerald), #8B5CF6 (violet)</li>
            </ul>
          </div>

          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Ready-to-Use Captions</h3>
            <div className={styles.captionExamples}>
              <p className={styles.caption}>
                &quot;Stop spending hours writing captions! This AI tool generates viral Instagram captions in seconds. 
                Game changer for creators! 🔥&quot;
              </p>
              <p className={styles.caption}>
                &quot;Just discovered the best AI caption generator. My engagement went up 40% since I started using it. 
                Seriously obsessed! ✨&quot;
              </p>
              <p className={styles.caption}>
                              &quot;If you&apos;re a content creator, you need this AI caption tool. Saves me 2+ hours every day. 
              Link in bio! 💯&quot;
              </p>
            </div>
            <div className={styles.hashtags}>
              <p><strong>Suggested hashtags:</strong></p>
              <p>#AICaptions #ContentCreator #InstagramTips #SocialMedia #ViralCaptions</p>
            </div>
          </div>

          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Reels/TikTok Script</h3>
            <div className={styles.script}>
              <p><strong>Hook (0-3s):</strong> &quot;Stop writing captions manually!&quot;</p>
              <p><strong>Demo (3-12s):</strong> Show app generating captions quickly</p>
              <p><strong>CTA (12-15s):</strong> &quot;Link in bio - try it free!&quot;</p>
            </div>
          </div>
        </div>
      </section>

      {/* Promotion Tips Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Promotion Tips</h2>
        <div className={styles.grid}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Instagram Reels & TikTok</h3>
            <ul className={styles.list}>
              <li><strong>Hook:</strong> Start with a problem (time-consuming captions)</li>
              <li><strong>Demo:</strong> Show the app in action (screen recording)</li>
              <li><strong>CTA:</strong> Clear call-to-action with your affiliate link</li>
              <li><strong>Trending:</strong> Use popular sounds and hashtags</li>
            </ul>
          </div>

          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Discord & Communities</h3>
            <div className={styles.template}>
              <p><strong>Template:</strong></p>
              <p>&quot;Hey creators! I found this amazing AI tool that generates Instagram captions in seconds. 
              It&apos;s been a game changer for my content. If anyone wants to try it, I can share my link. 
              No pressure, just genuinely helpful! 🚀&quot;</p>
            </div>
          </div>

          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Your Tracking Link</h3>
            <div className={styles.trackingLink}>
              <p><strong>Base URL:</strong></p>
              <code className={styles.code}>
                {AFFILIATE_BASE_URL}
              </code>
              <p><strong>With UTM params:</strong></p>
              <code className={styles.code}>
                {addUTMParams(AFFILIATE_BASE_URL)}
              </code>
            </div>
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Support & Contact</h2>
        <div className={styles.grid}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Get Help</h3>
            <ul className={styles.list}>
              <li>
                <strong>Email:</strong>{' '}
                <a 
                  href="mailto:affiliates@captioni.com"
                  className={styles.link}
                  data-event="contact"
                  data-cta-name="email_support"
                  data-cta-location="support"
                >
                  affiliates@captioni.com
                </a>
              </li>
              <li>
                <strong>Discord:</strong>{' '}
                <a 
                  href="https://discord.gg/example" 
                  className={styles.link}
                  data-event="join_community"
                  data-cta-name="discord_invite"
                  data-cta-location="support"
                  rel="noopener noreferrer"
                >
                  TODO: Add Discord invite link
                </a>
              </li>
              <li><strong>Response time:</strong> Within 24 hours</li>
            </ul>
          </div>

          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Payout Schedule</h3>
            <ul className={styles.list}>
              <li><strong>Processing:</strong> Monthly on the 1st</li>
              <li><strong>Minimum:</strong> $25 payout threshold</li>
              <li><strong>Methods:</strong> PayPal, Wise (bank transfer)</li>
              <li><strong>Timing:</strong> 3-5 business days after processing</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Footer Note */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <p className={styles.footerText}>
            Need help? Contact{' '}
            <a 
              href="mailto:affiliates@captioni.com"
              className={styles.footerLink}
              data-event="contact"
              data-cta-name="footer_email"
              data-cta-location="footer"
            >
              affiliates@captioni.com
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
