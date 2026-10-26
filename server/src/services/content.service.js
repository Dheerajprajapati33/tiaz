const Content = require('../models/Content');

const DEFAULT_TERMS = `<h1>Terms and Conditions - TIAZ Digital Gold</h1>
<p>Welcome to <b>TIAZ Digital Gold</b>. By accessing or using our platform, you agree to be bound by these Terms and Conditions.</p>

<h2>1. Purity and Vault Custody</h2>
<p>All digital gold purchased through TIAZ is <b>24 Karat (99.9% fineness)</b> sovereign physical bullion. Physical reserves are strictly insured and held in audited institutional vaults managed by <b>Brinks and Sequel</b> under MMTC-PAMP and IBJA benchmarks.</p>

<h2>2. Fractional Ownership & Trading</h2>
<p>Users may accumulate physical bullion in fractional denominations starting from as low as <b>₹10</b>. Live buy and sell prices reflect real-time bullion spot markets and include applicable wholesale spreads and taxes (such as 3% GST).</p>

<h2>3. KYC Verification Requirements</h2>
<p>In adherence to PMLA and financial regulatory compliance, full KYC documentation (including government-verified PAN and Aadhaar authentication) is mandatory for cumulative holdings exceeding statutory limits or before initiating bullion liquidations.</p>

<h2>4. Customer Support and Grievance</h2>
<p>For any grievances or clarification regarding account ledger or delivery, reach us at <a href="mailto:support@tiaz.gold">support@tiaz.gold</a> or visit our official portal at <a href="https://tiaz.gold" target="_blank">https://tiaz.gold</a>.</p>`;

const DEFAULT_PRIVACY = `<h1>Privacy Policy - TIAZ Digital Gold</h1>
<p>Your privacy and the security of your financial data are fundamental to <b>TIAZ Precious Metals India Pvt. Ltd.</b> This Privacy Policy outlines our data collection, encryption, and custody protocols.</p>

<h2>1. Personal & KYC Information Collected</h2>
<p>To provide secure bullion custody and fulfill regulatory requirements, we collect:</p>
<ul>
  <li><b>Identity Details:</b> Full legal name, PAN card number, and government-verified KYC credentials.</li>
  <li><b>Contact Information:</b> Primary mobile number and verified email address for OTP authentication and notifications.</li>
  <li><b>Financial Ledger:</b> Bank account numbers, IFSC codes, and UPI handles utilized strictly for bullion settlement and IMPS liquidation payouts.</li>
</ul>

<h2>2. Data Security & Encryption</h2>
<p>All sensitive investor records, financial accounts, and authentication sessions are secured using AES-256 bank-grade encryption at rest and TLS 1.3 in transit. We never sell or lease user information to third-party commercial brokers.</p>

<h2>3. Contact Data Protection Officer</h2>
<p>For privacy queries, account data purge requests, or compliance inquiries, contact our Data Protection Officer at <a href="mailto:privacy@tiaz.gold">privacy@tiaz.gold</a>.</p>`;

class ContentService {
  normalizeType(rawType) {
    if (!rawType) return null;
    const lower = rawType.toString().trim().toLowerCase();
    if (lower.includes('term')) return 'terms';
    if (lower.includes('priva')) return 'privacy';
    return lower;
  }

  async getContent(rawType) {
    const type = this.normalizeType(rawType);

    if (!type || type === 'all') {
      const allDocs = await Content.find({});
      const result = {};

      let termsDoc = allDocs.find((d) => d.type === 'terms');
      if (!termsDoc) {
        termsDoc = await Content.create({
          type: 'terms',
          title: 'Terms and Conditions',
          content: DEFAULT_TERMS
        });
      }
      result.terms = termsDoc;

      let privacyDoc = allDocs.find((d) => d.type === 'privacy');
      if (!privacyDoc) {
        privacyDoc = await Content.create({
          type: 'privacy',
          title: 'Privacy Policy',
          content: DEFAULT_PRIVACY
        });
      }
      result.privacy = privacyDoc;

      return result;
    }

    if (!['terms', 'privacy'].includes(type)) {
      throw new Error("Invalid content type. Must be 'terms' or 'privacy'.");
    }

    let doc = await Content.findOne({ type });
    if (!doc) {
      doc = await Content.create({
        type,
        title: type === 'terms' ? 'Terms and Conditions' : 'Privacy Policy',
        content: type === 'terms' ? DEFAULT_TERMS : DEFAULT_PRIVACY
      });
    }

    return doc;
  }

  async saveContent({ type: rawType, content, title, updatedBy = null }) {
    const type = this.normalizeType(rawType);
    if (!type || !['terms', 'privacy'].includes(type)) {
      throw new Error("Invalid content type. Must be 'terms' or 'privacy'.");
    }

    if (!content || typeof content !== 'string') {
      throw new Error('Content string is required.');
    }

    const defaultTitle = type === 'terms' ? 'Terms and Conditions' : 'Privacy Policy';
    const updatedTitle = title && title.trim() ? title.trim() : defaultTitle;

    const doc = await Content.findOneAndUpdate(
      { type },
      {
        $set: {
          content,
          title: updatedTitle,
          updatedBy,
          updatedAt: new Date()
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return doc;
  }
}

module.exports = new ContentService();
