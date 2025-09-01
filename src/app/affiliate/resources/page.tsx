import styles from './page.module.css';

// Helpers
const addUTMParams = (
  base: string,
  source: string,
  medium: string,
  campaign: string
) => {
  const p = new URLSearchParams({
    utm_source: source,
    utm_medium: medium,
    utm_campaign: campaign,
  }).toString();
  return `${base}${base.includes('?') ? '&' : '?'}${p}`;
};

// Examples use placeholder; affiliates must use their personal link from Rewardful
const PLACEHOLDER_LINK = '[YOUR_AFFILIATE_LINK_FROM_REWARDFUL]';

export default function AffiliateResourcesPage() {
  const utmExamples = [
    addUTMParams(PLACEHOLDER_LINK, 'instagram', 'reel', 'sept-aff-push'),
    addUTMParams(PLACEHOLDER_LINK, 'tiktok', 'video', 'hook-demo'),
    addUTMParams(PLACEHOLDER_LINK, 'discord', 'post', 'channel-share'),
  ];

  return (
    <div className={styles.container}>
      {/* Welcome */}
      <section className={styles.section}>
        <div className={styles.welcome}>
          <h1 className={styles.title}>Welcome to Captioni Affiliates!</h1>
          <p className={styles.subtitle}>
            Thanks for joining our affiliate program. You’re helping creators
            discover the #1 AI caption generator. Follow this guide to start
            earning fast — no app access required.
          </p>
          <div className={styles.note}>
            <a href="/affiliate" className={styles.backLink}>
              ← Back to affiliate landing page
            </a>
          </div>
        </div>
      </section>

      {/* Quick Start */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Quick Start (3 steps)</h2>
        <div className={styles.card}>
          <ul className={styles.list}>
            <li><strong>1)</strong> Grab your <strong>personal affiliate link</strong> in your Rewardful dashboard (Links).</li>
            <li><strong>2)</strong> Create a <strong>short-form video</strong> (Reels/TikTok) using our B-roll & overlays + clear CTA.</li>
            <li><strong>3)</strong> Add <strong>UTM parameters</strong> to track your campaigns (examples below).</li>
          </ul>
          <div className={styles.trackingLink} style={{ marginTop: '1rem' }}>
            <p><strong>Your link:</strong> use your **personal** Rewardful link (do not share generic links).</p>
            <p style={{ marginTop: '.5rem' }}><strong>UTM examples:</strong></p>
            {utmExamples.map((u) => (
              <code className={styles.code} key={u}>{u}</code>
            ))}
          </div>
        </div>
      </section>

      {/* Commission Details */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Commission Details</h2>
        <div className={styles.card}>
          <ul className={styles.list}>
            <li><strong>40% commission</strong> on the <strong>first payment</strong> from each new customer</li>
            <li><strong>30% recurring</strong> for the next <strong>11 billing cycles</strong></li>
            <li><strong>$25 minimum payout</strong> threshold</li>
            <li><strong>30-day lock</strong> period for new conversions</li>
            <li><strong>Monthly payouts</strong> processed on the 1st of each month</li>
            <li><strong>Payment methods:</strong> PayPal, Wise (bank transfer)</li>
          </ul>
          <p className={styles.cardSubtitle} style={{ marginTop: '0.75rem' }}>
            Note: First-payment 40% bonus is honored in payouts; Rewardful UI may show the 30% baseline.
          </p>
        </div>
      </section>

      {/* Compliance */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Compliance Quick Rules</h2>
        <div className={styles.grid}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>FTC Disclosure Required</h3>
            <p className={styles.cardSubtitle}>Always disclose your affiliate relationship</p>
            <div className={styles.examples}>
              <p><strong>Example 1:</strong> “I may earn a commission if you sign up through my link.”</p>
              <p><strong>Example 2:</strong> “#ad #affiliate — I earn from qualifying purchases.”</p>
              <p><strong>Example 3:</strong> “Affiliate partner — I receive a commission at no extra cost to you.”</p>
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

      {/* Promo Kit */}
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
                  href="/broll-pack.zip"
                  className={styles.downloadLink}
                  data-event="download"
                  data-cta-name="broll_pack"
                  data-cta-location="promo_kit"
                  rel="noopener noreferrer"
                >
                  🎥 B-roll Pack (typing, posting, analytics spike, POV shots)
                </a>
              </li>
              <li>
                <a
                  href="/screenshots.zip"
                  className={styles.downloadLink}
                  data-event="download"
                  data-cta-name="screenshot_pack"
                  data-cta-location="promo_kit"
                  rel="noopener noreferrer"
                >
                  🖼️ Screenshot Pack (static UI, overlays)
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
                  🎬 Overlay Demo (5–8s, add over your footage)
                </a>
              </li>
            </ul>
          </div>

          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Ready-to-Use Captions</h3>
            <div className={styles.captionExamples}>
              <p className={styles.caption}>
                “Stop wasting hours writing captions. This AI writes scroll-stoppers in seconds. Total game-changer. Try it 👇”
              </p>
              <p className={styles.caption}>
                “My engagement jumped after switching to AI captions. If you create content, you’ll love this.”
              </p>
              <p className={styles.caption}>
                “Creators: meet your new caption co-pilot. Faster posts, better hooks, more comments.”
              </p>
              <p className={styles.caption}>
                “Batch 10 posts in 5 minutes? Yep. This AI caption tool is <i>that</i> good.”
              </p>
              <p className={styles.caption}>
                “Writer’s block? Over. Let AI draft the first 80%, tweak the last 20% — done.”
              </p>
            </div>
            <div className={styles.hashtags}>
              <p><strong>Suggested hashtags:</strong></p>
              <p>#AICaptions #ContentCreator #CreatorTools #InstagramTips #ReelsTips #SocialMedia #MadeWithAI #ViralCaptions #ContentWorkflow #CreatorLife</p>
            </div>
          </div>

          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Reels/TikTok Scripts (15s, no app access needed)</h3>
            <div className={styles.script}>
              <p><strong>V1 – Problem → Solution (voiceover)</strong></p>
              <p><strong>0–3s:</strong> “Still stuck writing captions?”</p>
              <p><strong>3–12s:</strong> B-roll: typing, notes, time pressure → relief shot.</p>
              <p><strong>12–15s:</strong> “CTA: IG → link ve Story (sticker) nebo připnutý komentář • TikTok → připnutý komentář • YouTube → link v popisku/pinned comment.”</p>
            </div>
            <div className={styles.script} style={{ marginTop: '0.75rem' }}>
              <p><strong>V2 – Before/After (text overlay)</strong></p>
              <p><strong>0–4s:</strong> “Before: 20 min per caption → After: 20 seconds.”</p>
              <p><strong>4–12s:</strong> Show planning sheet, overlay results text (no UI needed).</p>
              <p><strong>12–15s:</strong> “Creators save hours. CTA: připnutý komentář nebo link ve Story/popisku.”</p>
            </div>
            <div className={styles.script} style={{ marginTop: '0.75rem' }}>
              <p><strong>V3 – Hook Carousel (educational)</strong></p>
              <p><strong>0–3s:</strong> “Hooks that stop the scroll.”</p>
              <p><strong>3–12s:</strong> Show 3 hook examples as on-screen text.</p>
              <p><strong>12–15s:</strong> “Grab yours — CTA: Story link, pinned comment, or video description.”</p>
            </div>
          </div>
        </div>
      </section>

      {/* Promotion Tips */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Promotion Tips</h2>
        <div className={styles.grid}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Instagram Reels & TikTok</h3>
            <ul className={styles.list}>
              <li><strong>Pain first:</strong> Lead with a time/creativity problem.</li>
              <li><strong>Realistic assets:</strong> Use our B-roll + overlay demo instead of screen recording.</li>
              <li><strong>CTA:</strong> “Link in bio / in comments.”</li>
              <li><strong>Boost:</strong> Use trending sounds, add on-screen text, keep cuts snappy.</li>
            </ul>
          </div>

          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Discord & Communities</h3>
            <div className={styles.template}>
              <p><strong>Template:</strong></p>
              <p>
                “Found an AI tool that generates captions in seconds. It’s saving me hours each week — happy to share my link if anyone wants to try.
                No pressure, just sharing what works. 🚀”
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Support & Payouts */}
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
              {/* <li>
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
              </li> */}
              <li><strong>Response time:</strong> Within 24 hours</li>
            </ul>
          </div>

          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Payout Schedule</h3>
            <ul className={styles.list}>
              <li><strong>Processing:</strong> Monthly on the 1st</li>
              <li><strong>Minimum:</strong> $25 payout threshold</li>
              <li><strong>Methods:</strong> PayPal, Wise (bank transfer)</li>
              <li><strong>Timing:</strong> 3–5 business days after processing</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
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

