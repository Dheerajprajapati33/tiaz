import { create } from 'zustand';

export const useSettingsStore = create((set) => ({
  general: {
    appName: "TIA'Z Digital Gold",
    companyLegalName: "TIA'Z Precious Metals India Pvt. Ltd.",
    currency: 'INR (₹)',
    timezone: 'Asia/Kolkata (IST +5:30)',
    supportEmail: 'support@tiaz.gold',
    supportPhone: '+91 1800-202-9988',
    maintenanceMode: false,
    mockDataBanner: true
  },
  gold: {
    defaultPurity: '24K',
    defaultFineness: '99.9%',
    minPurchaseInr: 10,
    maxDailyPurchaseInr: 2000000,
    maxDailySellInr: 500000,
    gstPercentage: 3.0,
    platformSpreadPercentage: 3.0,
    primaryVaultPartner: 'Brinks Global Services (Mumbai SEZ)',
    auditFrequency: 'Quarterly SEBI Trustee Audit'
  },
  security: {
    enforce2FA: true,
    sessionTimeoutMinutes: 30,
    maxFailedAttempts: 5,
    autoLockSuspiciousIP: true,
    kycMandatoryThresholdInr: 10000
  },
  notifications: {
    emailAlertsEnabled: true,
    smsAlertsEnabled: true,
    whatsappAlertsEnabled: true,
    pushNotificationsEnabled: true
  },
  legal: {
    termsAndConditions: `<h1>Terms and Conditions - TIAZ Digital Gold</h1>
<p>Welcome to <b>TIAZ Digital Gold</b>. By accessing or using our platform, you agree to be bound by these Terms and Conditions.</p>

<h2>1. Purity and Vault Custody</h2>
<p>All digital gold purchased through TIAZ is <b>24 Karat (99.9% fineness)</b> sovereign physical bullion. Physical reserves are strictly insured and held in audited institutional vaults managed by <b>Brinks and Sequel</b> under MMTC-PAMP and IBJA benchmarks.</p>

<h2>2. Fractional Ownership & Trading</h2>
<p>Users may accumulate physical bullion in fractional denominations starting from as low as <b>₹10</b>. Live buy and sell prices reflect real-time bullion spot markets and include applicable wholesale spreads and taxes (such as 3% GST).</p>

<h2>3. KYC Verification Requirements</h2>
<p>In adherence to PMLA and financial regulatory compliance, full KYC documentation (including government-verified PAN and Aadhaar authentication) is mandatory for cumulative holdings exceeding statutory limits or before initiating bullion liquidations.</p>

<h2>4. Customer Support and Grievance</h2>
<p>For any grievances or clarification regarding account ledger or delivery, reach us at <a href="mailto:support@tiaz.gold">support@tiaz.gold</a> or visit our official portal at <a href="https://tiaz.gold" target="_blank">https://tiaz.gold</a>.</p>`,

    privacyPolicy: `<h1>Privacy Policy - TIAZ Digital Gold</h1>
<p>Your privacy and the security of your financial data are fundamental to <b>TIAZ Precious Metals India Pvt. Ltd.</b> This Privacy Policy outlines our data collection, encryption, and custody protocols.</p>

<h2>1. Personal & KYC Information Collected</h2>
<p>To provide secure bullion custody and fulfill regulatory requirements, we collect:</p>
<ul>
  <li><b>Identity Details:</b> Full legal name, PAN card number, and Aadhaar reference via secure UIDAI verification.</li>
  <li><b>Contact Details:</b> Verified mobile phone number and primary email address.</li>
  <li><b>Banking Credentials:</b> Tokenized bank account numbers and IFSC for instant IMPS settlements.</li>
</ul>

<h2>2. Bank-Grade Data Protection</h2>
<p>All personal and financial communications are secured using <b>256-bit SSL/TLS encryption</b>. We never sell or rent your personal information to third-party marketing entities.</p>

<h2>3. User Rights and Data Deletion</h2>
<p>Users may request a copy of their vault transaction records or request account deactivation by contacting our Data Protection Officer at <a href="mailto:privacy@tiaz.gold">privacy@tiaz.gold</a>.</p>`
  },

  updateLegalPolicy: (key, html) => {
    set((state) => ({
      legal: {
        ...state.legal,
        [key]: html
      }
    }));
  },

  updateSection: (section, newValues) => {
    set((state) => ({
      [section]: {
        ...state[section],
        ...newValues
      }
    }));
  }
}));
