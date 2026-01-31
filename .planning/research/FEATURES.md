# Compliance Features Research

## Executive Summary

This research identifies compliance requirements for a piano learning PWA targeting 8-year-old children, to be deployed on Google Play and Apple App Store. Key deadlines: COPPA rule updates take effect April 22, 2026; state laws (TX, UT, LA) start January 1, 2026.

**Critical Finding**: Apps in Apple's Kids Category may NOT include third-party advertising or analytics. This is a table-stakes requirement that affects architecture decisions.

---

## COPPA Requirements (Children's Online Privacy Protection Act)

### Required (Table Stakes)

#### 1. Verifiable Parental Consent
- **What**: Must obtain consent before collecting, using, or disclosing personal information from children under 13
- **Methods**:
  - Credit card verification (charge + refund)
  - Digital signature via government-issued ID
  - Video conference with trained personnel
  - "Email plus" for internal-only data (email + confirmation step like phone callback)
- **Implementation**: Build consent flow before any data collection begins
- **Sources**: [FTC COPPA FAQ](https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions)

#### 2. Neutral Age Gating (NEW 2026 Requirement)
- **What**: Age verification must be done in a neutral manner that does not default to a set age or encourage visitors to falsify age
- **Bad Practice**: "Are you over 13?" checkbox
- **Good Practice**: "What is your date of birth?" or "How old are you?"
- **Anti-pattern**: Back-button loophole (use cookies to prevent re-entry with different age)
- **Deadline**: April 22, 2026
- **Sources**: [FTC Amended COPPA Rule](https://www.dwt.com/blogs/privacy--security-law-blog/2025/05/coppa-rule-ftc-amended-childrens-privacy)

#### 3. Privacy Notice Requirements
- **What**: Clear, comprehensive, easily accessible privacy policy detailing children's data practices
- **Format**: Must be understandable to parents (not all are tech-savvy)
- **Placement**: Visible during parental consent flow
- **Content**:
  - Types of data collected
  - How data is used
  - Third parties with access
  - Parental rights (review, delete, revoke consent)
- **Sources**: [COPPA Compliance Checklist](https://bigid.com/blog/coppa-compliance/)

#### 4. Parental Rights Implementation
- **Review**: Parents must be able to review what data has been collected
- **Delete**: Parents must be able to request deletion of child's data
- **Revoke**: Parents must be able to prevent further collection
- **Timeline**: Requests should be fulfilled within reasonable timeframe (track as compliance metric)
- **Sources**: [COPPA Compliance Guide 2025](https://blog.promise.legal/startup-central/coppa-compliance-in-2025-a-practical-guide-for-tech-edtech-and-kids-apps/)

#### 5. Data Minimization
- **What**: Collect only information necessary for the service
- **Retention**: Delete data as soon as it's no longer needed for its purpose
- **Method**: Secure deletion using industry-standard practices
- **Implementation**: Automatic data deletion schedules, retention policies
- **Sources**: [Kids Apps Data Privacy](https://countly.com/blog/data-privacy-kids-apps)

#### 6. Personal Information Scope
Personal information under COPPA includes:
- Names, email addresses, phone numbers
- Geolocation data
- Cookies and persistent identifiers
- Device IDs
- IP addresses
- Photos, videos, or audio containing child's image or voice
- Screen names or usernames
- Sources**: [COPPA Rule eCFR](https://www.ecfr.gov/current/title-16/chapter-I/subchapter-C/part-312)

### Penalties
- **Fine**: Up to $50,120 per violation
- **Enforcement**: FTC can pursue civil penalties through courts
- **Sources**: [Kiteworks COPPA Guide](https://www.kiteworks.com/risk-compliance-glossary/coppa-childrens-online-privacy-protection-act/)

### Recommended (Beyond Minimum)

#### 1. Parental Dashboard
- Centralized view of child's data
- One-click data export in machine-readable format (JSON/CSV)
- Self-service deletion (no email required)
- Activity logs (what child practiced, when, scores)
- **Why**: Reduces support burden, builds trust, exceeds compliance

#### 2. Privacy by Design
- Default settings should be most privacy-protective
- No data collection until consent obtained
- Clear visual indicators when data is being collected (e.g., microphone icon)
- Progressive consent (ask only when feature is used)

#### 3. CSAM Reporting Process
- Designated contact for Child Sexual Abuse Exploitation (CSAE) notifications
- Process to report confirmed CSAM to National Center for Missing and Exploited Children
- **Note**: Required for Google Play (see App Store section)
- **Sources**: [Google Play Child Safety Standards](https://support.google.com/googleplay/android-developer/answer/14747720?hl=en)

---

## App Store Requirements

### Google Play Store

#### Required (Table Stakes)

##### 1. Families Policy Compliance
- **Certification**: Self-certify compliance with child safety laws
- **Target Age**: Declare if app is designed for children
- **Privacy Policy**: Must comply with COPPA and GDPR
- **Effective Date**: January 1, 2026
- **Sources**: [Google Play Families Policies](https://support.google.com/googleplay/android-developer/answer/9893335?hl=en)

##### 2. Child Safety Standards (NEW)
- **CSAM Reporting**: Process to report confirmed Child Sexual Abuse Material to NCMEC or regional authority
- **Designated Contact**: Someone positioned to handle CSAE notifications from Google Play
- **Enforcement Process**: Must have review and enforcement procedures
- **Sources**: [Google Play Child Safety](https://support.google.com/googleplay/android-developer/answer/14747720?hl=en)

##### 3. State Age Verification Laws (U.S. Only)
Affects users in Texas, Utah, Louisiana:
- **Texas**: January 1, 2026
- **Utah**: May 7, 2026
- **Louisiana**: July 1, 2026

**Requirements**:
- Integrate Play Age Signals API (currently in beta)
- Receive user's age verification status, age ranges, supervision status
- Only use Age Signals API data for age-appropriate experiences
- **Sources**: [Google Play State Laws](https://support.google.com/googleplay/android-developer/answer/16569691)

##### 4. Ad Network Restrictions
- **Rule**: Ads in children's apps MUST use Google-certified ad networks
- **Compliance**: Ad network must be certified under "Designed for Families" program
- **Prohibited Data**: Cannot transmit AAID, SIM Serial, Build Serial, BSSID, MAC, SSID, IMEI, IMSI
- **Use Cases**: Ads limited to contextual targeting, frequency capping, fraud prevention
- **Sources**: [Google Play Ads Compliance](https://help.adjust.com/en/article/coppa-compliance)

##### 5. Permissions Justification
- Request only necessary permissions
- Location, camera, contacts, SMS, calls, storage access must be justified
- Over-requesting permissions is common rejection reason
- **Sources**: [Google Play Rejections](https://onemobile.ai/common-google-play-store-rejections/)

##### 6. Content Policy
- No content showing endangerment of children
- No user-generated content without moderation (if allows child-created content)
- Prohibition on content facilitating child exploitation/abuse
- **Sources**: [Google Play Program Policy](https://support.google.com/googleplay/android-developer/answer/16810878?hl=en)

#### Recommended

##### 1. Proactive Compliance Review
- Track time to fulfill parental deletion requests as metric
- Regular audit of third-party SDKs for COPPA compliance
- Document data flow diagrams showing what data goes where

##### 2. Age Rating Accuracy
- Provide accurate responses to age rating questionnaire
- **Deadline**: Must update by January 31, 2026 or app updates interrupted
- Ensure content matches declared rating
- **Sources**: [App Store Age Ratings](https://capgo.app/blog/app-store-age-ratings-guide/)

### Apple App Store

#### Required (Table Stakes)

##### 1. Kids Category Restrictions (CRITICAL)
**This is the most restrictive requirement and affects architecture:**

- **NO third-party advertising** in Kids Category apps
- **NO third-party analytics** in Kids Category apps (limited exceptions possible if analytics don't collect IDFA or identifiable information)
- **Prohibition**: Apps cannot send personally identifiable information OR device information to third parties
- **Scope**: Applies even to sections intended for adults (e.g., parent dashboard)
- **Sources**: [Apple Kids Category](https://developer.apple.com/kids/), [TechCrunch Report](https://techcrunch.com/2019/06/03/apple-kid-apps-trackers/)

##### 2. Age Band Selection
- Must select age band in App Store Connect:
  - 5 and under
  - 6-8 (your target)
  - 9-11
- **Compliance Guidelines**: Must follow App Review Guidelines 1.3 and 5.1.4
- **Sources**: [Apple Age Ratings](https://developer.apple.com/help/app-store-connect/reference/app-information/age-ratings-values-and-definitions/)

##### 3. Parental Gate for Transactions
- Adult-level task required before:
  - In-App Purchases
  - External links
  - Social features
- **Examples**: Math problem, reading comprehension, time-based hold
- **Sources**: [Apple Kids Design](https://developer.apple.com/kids/)

##### 4. State Parental Consent Laws (U.S. Only)
Affects users in Texas, Utah, Louisiana:
- **Consent Required For**:
  - Each app download
  - Each app purchase
  - Each in-app purchase (via Apple's IAP system only)
- **No Bundling**: One-time consent for all purchases NOT permitted
- **Physical Goods**: Purchases of physical goods exempt from consent requirement
- **API**: Declared Age Range API provides age category (under 13, 13-15, 16-17, over 18)
- **Testing**: Sandbox testing available in iOS 26.2
- **Sources**: [iOS 26.2 Parental Consent](https://www.macrumors.com/2025/11/04/ios-26-2-texas-age-verification-law/), [Privacy World Blog](https://www.privacyworld.blog/2025/10/app-store-age-verification-laws-your-questions-answered/)

##### 5. Privacy Policy Link
- Required if app has subscriptions in Kids Category
- Must be easily accessible from app listing
- **Sources**: [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)

#### Recommended

##### 1. Age Rating Accuracy
- Respond to updated age rating questions by January 31, 2026
- Failure blocks app updates
- Common rejection: content doesn't match declared rating
- User-generated content almost always increases age rating
- **Sources**: [Age Rating Guide](https://capgo.app/blog/app-store-age-ratings-guide/)

##### 2. Family Sharing Integration
- Direct parents to Apple's Family Sharing for account management
- Reduces burden of building custom parental consent flows
- **Sources**: [Privacy Guidelines](https://www.termsfeed.com/blog/privacy-guidelines-apps-children/)

---

## GDPR-K Requirements (EU/EEA Users)

### Required (Table Stakes)

#### 1. Age of Consent Verification
- **Default Age**: 16 years for GDPR consent
- **Member State Flexibility**: Can lower to minimum of 13 years
- **Parental Consent**: Required for users below age of consent
- **Verification**: Must make "reasonable efforts" to verify consent given by parent
- **Sources**: [GDPR Article 8](https://gdpr-info.eu/art-8-gdpr/), [Clarip GDPR-K](https://www.clarip.com/data-privacy/gdpr-child-consent/)

#### 2. Reasonable Verification Methods
GDPR-K is less prescriptive than COPPA, leaving "reasonable" to the operator:
- Digital signatures
- Credit card validation
- Government-issued ID verification
- Knowledge-based authentication
- Confirmatory texts to parents
- **Risk-Based**: Method should match risk of data processing
- **Sources**: [SuperAwesome GDPR-K Toolkit](https://www.superawesome.com/blog/the-gdpr-k-toolkit-for-kids-publishers-part-six-obtaining-verifiable-parental-consent/)

#### 3. Child-Friendly Privacy Notices
- **Requirement**: Privacy information must be in clear, plain language that a child can understand
- **Audience**: Must address both children and parents
- **Accessibility**: Easily accessible to both audiences
- **Sources**: [ICO Children and UK GDPR](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/children-and-the-uk-gdpr/)

#### 4. Data Subject Rights for Children
Same rights as adults, exercisable by parents:
- Right to access
- Right to rectification
- Right to erasure ("right to be forgotten")
- Right to data portability
- Right to object to processing
- **Sources**: [iubenda Minors GDPR](https://www.iubenda.com/en/help/11429-minors-and-the-gdpr/)

### Recommended

#### 1. Age-Appropriate Privacy Notice Tiers
- Version 1: For children (simplified, visual)
- Version 2: For parents (detailed, legal)
- Both link to full privacy policy

#### 2. Data Protection Impact Assessment (DPIA)
- Recommended for services targeting children
- Documents privacy risks and mitigation measures
- Shows due diligence to regulators

---

## Data Privacy Features

### Required Implementation

#### 1. Data Export
- **Format**: Machine-readable (JSON, CSV, XML)
- **Scope**: All personal information about the child
- **Timeline**: Reasonable timeframe (recommend 30 days max)
- **Delivery**: Secure method (encrypted email, download link with expiry)
- **Sources**: [COPPA Compliance Guide](https://blog.promise.legal/startup-central/coppa-compliance-in-2025-a-practical-guide-for-tech-edtech-and-kids-apps/)

#### 2. Data Deletion
- **Scope**: All personal information about child
- **Method**: Secure, permanent deletion (not just marking inactive)
- **Cascading**: Delete from backups within reasonable timeframe
- **Confirmation**: Notify parent when deletion complete
- **Timeline**: Recommend fulfilling within 30 days
- **Metric**: Track and monitor deletion request fulfillment times
- **Sources**: [Privacy Laws for Kids Apps](https://thisisglance.com/learning-centre/what-privacy-laws-apply-when-my-app-collects-kids-data)

#### 3. Parental Access Dashboard
- View child's personal information
- See activity history (what was practiced, when)
- Download data export
- Request deletion
- Manage consent settings
- Revoke consent
- **Sources**: [Kids Apps Privacy](https://countly.com/blog/data-privacy-kids-apps)

#### 4. Consent Management
- **Granular**: Separate consent for different data uses
- **Revocable**: Parents can withdraw consent anytime
- **Logged**: Maintain audit trail of consent changes
- **Clear UI**: Easy-to-understand consent toggles

### Recommended Features

#### 1. Automatic Data Retention Policies
- Set expiration dates on inactive accounts (e.g., 1 year)
- Notify parents before deletion
- Option to keep account active with parent action

#### 2. Privacy-Preserving Analytics
- Use aggregated data only
- No individual-level tracking
- On-device analytics where possible
- First-party analytics only (no third-party SDKs per Apple requirement)

#### 3. Transparency Reports
- Show parents what data exists about their child
- Visual dashboards with icons (not dense text)
- Child-friendly explanations

---

## Parental Consent Mechanisms

### Recommended Implementation Approaches

#### 1. Teacher-as-Parent Model (FERPA Exception)
**For school use cases:**
- Schools can act in loco parentis under FERPA
- Teacher creates student account with school email verification
- Parents receive notification + opt-out option
- Reduces friction for classroom deployment
- **Limitation**: Only valid for educational context, not home use
- **Sources**: [COPPA FERPA Exception](https://www.privacypolicies.com/blog/legal-requirements-kids-game-apps/)

#### 2. Multi-Tier Consent Flow
**For mixed school/home use:**
1. **Signup**: Ask if using for school or home
2. **School Path**: Teacher verification → FERPA exception → parent notification
3. **Home Path**: Full parental consent → verification
4. **Upgrade**: Student can later add parent access to school account

#### 3. Parental Gate Examples
- **Math Problem**: "What is 7 + 8?" (prevents accidental child clicks)
- **Reading Comprehension**: "Type the third word in this sentence"
- **Time Hold**: "Press and hold for 3 seconds"
- **Not Recommended**: CAPTCHAs (accessibility issues)
- **Sources**: [Apple Kids Design](https://developer.apple.com/kids/)

#### 4. Verification Method Selection (Risk-Based)

**Low Risk** (data used internally only):
- Email plus confirmation
- Parent creates account with credit card on file (no charge)
- SMS verification to parent phone

**Medium Risk** (limited third-party sharing):
- Credit card transaction ($0.50 charge + refund)
- Video call with customer support
- Digital consent form signed via DocuSign-like service

**High Risk** (extensive data collection/sharing):
- Government ID verification
- Notarized consent form
- In-person verification at school
- **Sources**: [FPF Verifiable Parental Consent](https://fpf.org/wp-content/uploads/2023/06/FPF-VPC-White-Paper-06-02-23-final2.pdf)

---

## Anti-Features (Do NOT Build)

These features would violate compliance or app store policies:

### 1. Third-Party Analytics SDKs (Apple Kids Category)
- ❌ Google Analytics
- ❌ Firebase Analytics (if sends data to Google servers)
- ❌ Mixpanel
- ❌ Amplitude
- ❌ Segment
- **Why**: Apple prohibits third-party analytics in Kids Category
- **Alternative**: Build first-party analytics or use on-device only
- **Sources**: [Apple Kids Trackers Ban](https://techcrunch.com/2019/06/03/apple-kid-apps-trackers/)

### 2. Third-Party Advertising Networks (Both Stores)
- ❌ AdMob (unless Google Families certified and Android-only)
- ❌ Facebook Audience Network
- ❌ Unity Ads (unless COPPA mode enabled)
- **Why**: Apple bans all third-party ads; Google requires Families certification
- **Alternative**: No ads in initial version; if needed later, use Google-certified networks on Android only
- **Sources**: [Unity COPPA Compliance](https://docs.unity.com/en-us/grow/ads/privacy/coppa-compliance)

### 3. User-Generated Content Without Moderation
- ❌ Public leaderboards with usernames
- ❌ Chat features (even between students)
- ❌ Profile pictures uploaded by users
- ❌ "Share your performance" social features
- **Why**: Increases age rating, creates moderation burden, COPPA risk
- **Alternative**: Anonymous leaderboards, pre-scripted encouragement messages
- **Sources**: [Google Play Content Policy](https://support.google.com/googleplay/android-developer/answer/16810878?hl=en)

### 4. Behavioral Advertising / Retargeting
- ❌ Facebook Pixel
- ❌ Google Ads remarketing
- ❌ Lookalike audiences
- ❌ Cross-app tracking
- **Why**: Violates COPPA, prohibited in kids apps
- **Alternative**: Contextual ads only (if ads needed at all)
- **Sources**: [COPPA Third-Party Tracking](https://blog.promise.legal/startup-central/coppa-compliance-in-2025-a-practical-guide-for-tech-edtech-and-kids-apps/)

### 5. Default Data Collection
- ❌ Collecting data before obtaining consent
- ❌ Pre-checked consent boxes
- ❌ "Implied consent" through continued use
- **Why**: Violates privacy by design principles, GDPR-K requirements
- **Alternative**: Opt-in everything, no data collection until consent obtained

### 6. "Are You Over 13?" Age Gates
- ❌ Yes/No checkbox
- ❌ Age defaulting to adult
- ❌ Encouraging age falsification
- **Why**: Violates new 2026 COPPA neutral age-gating requirement
- **Alternative**: Neutral date-of-birth picker
- **Sources**: [FTC Amended COPPA](https://www.dwt.com/blogs/privacy--security-law-blog/2025/05/coppa-rule-ftc-amended-childrens-privacy)

### 7. Persistent Identifiers Without Consent
- ❌ Storing device ID before consent
- ❌ Fingerprinting techniques
- ❌ Cross-device tracking
- **Why**: Considered personal information under COPPA
- **Alternative**: Generate identifiers only after consent, allow deletion

### 8. Public Username Displays (PII Exposure)
- ❌ Showing real usernames in public features
- ❌ Exposing student names to other students
- ❌ Email addresses visible to other users
- **Why**: Violates child data protection, increases COPPA risk
- **Alternative**: Anonymous identifiers ("Student 1", "Star Pianist"), only show real names to teacher/parent
- **Note**: Your codebase already implements this correctly (see CLAUDE.md section 5)

---

## Recommendations

### Priority 1: Immediate (Before Any Store Submission)

1. **Remove Third-Party Analytics**
   - Current: Check if app uses Google Analytics, Mixpanel, or similar
   - Action: Remove or gate behind parental consent (even then, not allowed in Apple Kids Category)
   - Timeline: Before submission

2. **Implement Neutral Age Gating**
   - Current: Audit signup flow
   - Action: Use date-of-birth picker, not "Are you over X?" checkbox
   - Use cookie to prevent back-button age falsification
   - Timeline: Before April 22, 2026 (COPPA deadline)

3. **Build Parental Consent Flow**
   - Decide: Teacher-as-parent model (FERPA) vs. direct parental consent
   - Method: Email plus confirmation (for internal-use-only data)
   - UI: Clear explanation of what data collected and why
   - Timeline: Before submission

4. **Create Child-Friendly Privacy Policy**
   - Separate versions for children and parents
   - Place link in consent flow
   - Include all required COPPA disclosures
   - Timeline: Before submission

5. **Implement Data Deletion**
   - API endpoint for parental deletion requests
   - Secure, permanent deletion from all databases
   - Confirmation email to parent
   - Timeline: Before submission

### Priority 2: Pre-Launch (Nice to Have for Initial Approval)

6. **Parental Dashboard**
   - View child's data
   - Download data export (JSON format)
   - One-click deletion
   - Manage consent settings
   - Timeline: Before public launch

7. **CSAM Reporting Process**
   - Designate contact person
   - Document reporting workflow
   - Partner with NCMEC (National Center for Missing and Exploited Children)
   - Timeline: Required for Google Play, before Android launch

8. **Age Verification API Integration**
   - Google: Play Age Signals API
   - Apple: Declared Age Range API
   - Scope: Only for users in TX, UT, LA
   - Timeline: Before January 1, 2026 (Texas deadline)

### Priority 3: Post-Launch (Ongoing Compliance)

9. **Compliance Metrics Dashboard**
   - Track deletion request fulfillment times
   - Monitor consent withdrawal rates
   - Audit third-party SDK usage
   - Regular privacy impact assessments
   - Timeline: Ongoing

10. **Automated Data Retention**
    - Set 1-year inactivity expiration
    - Notify parents before deletion
    - Allow reactivation with parent action
    - Timeline: 3-6 months post-launch

11. **Penetration Testing & Security Audit**
    - Focus on authorization flows (per your CLAUDE.md security section)
    - Test RLS policies
    - Verify parental access controls
    - Timeline: Before public launch, then annually

### Priority 4: Future Enhancements

12. **Multi-Language Privacy Policies**
    - Your app supports Hebrew RTL
    - Provide privacy policy in Hebrew for Israeli users
    - Timeline: When expanding internationally

13. **Privacy Sandbox / On-Device Analytics**
    - Move analytics processing to device
    - No data leaves device
    - Aggregate-only reporting
    - Timeline: If analytics needed post-launch

---

## Platform-Specific Deployment Strategy

### For Apple App Store (Kids Category)

**Must Do:**
- ✅ Remove ALL third-party SDKs (analytics, ads, attribution)
- ✅ Build first-party analytics (on-device or Supabase only)
- ✅ Implement parental gate for any external links
- ✅ Select age band "6-8"
- ✅ No subscriptions (or add privacy policy link if adding later)
- ✅ Test on iOS 26.2 beta for Age Range API (if targeting TX/UT/LA)

**Review Timeline**: 24-48 hours typical, longer for Kids Category

### For Google Play Store (Families Program)

**Must Do:**
- ✅ Self-certify child safety compliance
- ✅ Designate CSAE contact
- ✅ Use only Google Families-certified ad networks (or no ads)
- ✅ Request minimal permissions with justifications
- ✅ Complete age rating questionnaire by January 31, 2026
- ✅ Integrate Play Age Signals API for TX/UT/LA users
- ✅ Disable AAID and device identifier collection

**Review Timeline**: Few hours to 7 days, depending on human review needs

### For Web (PWA Direct Distribution)

**Advantage**: Not subject to app store restrictions (can use third-party analytics)
**Disadvantage**: Still subject to COPPA, GDPR-K regardless of distribution method
**Recommendation**: Start with web to validate product, then remove third-party SDKs for app store versions

---

## Cost Estimates for Compliance Implementation

### One-Time Costs

| Item | Estimated Hours | Notes |
|------|----------------|-------|
| Neutral age gate | 8-16 | Date picker, cookie anti-bypass |
| Parental consent flow | 40-60 | UI + backend + verification method |
| Privacy policy (child-friendly) | 16-24 | Requires legal review |
| Data export API | 16-24 | JSON export of all child data |
| Data deletion API | 24-40 | Cascade delete, audit trail |
| Parental dashboard | 60-80 | View, export, delete, consent management |
| Third-party SDK removal | 16-40 | Depends on current usage |
| CSAM reporting process | 8-16 | Workflow + designated contact |
| Age Signals API integration | 24-40 | Google + Apple APIs |
| **Total** | **212-340 hours** | **~5-8 sprint weeks** |

### Ongoing Costs

| Item | Frequency | Estimated Hours/Year |
|------|-----------|---------------------|
| Privacy policy updates | Quarterly | 8-12 |
| Compliance audits | Quarterly | 16-24 |
| Security penetration testing | Annually | 40-60 |
| Staff training on COPPA | Annually | 8-16 |
| Parental request handling | Monthly | 48-96 (varies with users) |
| **Total** | | **120-208 hours/year** |

---

## Legal Considerations

### When to Consult a Privacy Lawyer

You should consult a qualified attorney for:
1. **Privacy Policy Creation**: Ensure all required COPPA/GDPR-K disclosures included
2. **Verification Method Selection**: Assess what's "reasonable" for your risk level
3. **FERPA School Exception**: Validate teacher-as-parent model for your use case
4. **Multi-Jurisdiction Compliance**: If serving EU, CA (CCPA-CAADCA), and other regions
5. **Before Launch**: Final compliance review

### Recommended Legal Documents

1. **Privacy Policy** (required)
2. **Terms of Service** (required)
3. **Parental Consent Agreement** (required)
4. **Teacher/School Agreement** (if using FERPA exception)
5. **Data Processing Agreement** (for Supabase subprocessor)

---

## Existing Compliance Measures in Your Codebase

Based on review of CLAUDE.md, you already have:

✅ **Authorization Checks**: Service layer verifies studentId === user.id (Section 6.1)
✅ **RLS Policies**: Database-level security, not relying on user_metadata (Section 6.2)
✅ **Secure Logout**: Clears localStorage user data (Section 6.3)
✅ **Anonymous Leaderboards**: Usernames hidden for non-current users (Section 6.5)
✅ **No Debug Functions in Prod**: Gated behind NODE_ENV (Section 6.7)
✅ **Service Worker Auth Exclusion**: Auth endpoints not cached (Section 6.4)

**Gaps to Address:**
❌ Neutral age gate (currently using user_metadata which is client-modifiable)
❌ Parental consent flow (no verification mechanism)
❌ Data export endpoint (parents can't download child's data)
❌ Child-friendly privacy policy (likely doesn't exist yet)
❌ Third-party SDK audit (need to verify no analytics SDKs present)
❌ CSAM reporting process (required for Google Play)

---

## Testing Checklist Before Submission

### COPPA Compliance

- [ ] Age gate is neutral (no age suggestions, no encouragement to lie)
- [ ] Age gate uses cookie to prevent back-button retry
- [ ] Parental consent obtained before any data collection
- [ ] Privacy policy is clear, concise, accessible
- [ ] Privacy policy includes all required disclosures (what, why, who, rights)
- [ ] Parents can review child's data via dashboard
- [ ] Parents can export child's data (JSON/CSV)
- [ ] Parents can delete child's data (secure, permanent)
- [ ] Parents can revoke consent
- [ ] Data minimization: only collect necessary information
- [ ] Data retention: delete when no longer needed
- [ ] No personal info sent to third parties without consent

### Apple App Store

- [ ] Removed all third-party analytics SDKs
- [ ] Removed all third-party advertising SDKs
- [ ] No PII sent to third parties (even in parent sections)
- [ ] Parental gate before IAP, external links, social features
- [ ] Age band selected in App Store Connect (6-8)
- [ ] Privacy policy link present (if using subscriptions)
- [ ] Age rating questionnaire completed (deadline: Jan 31, 2026)
- [ ] Content matches declared age rating
- [ ] Declared Age Range API integrated (if targeting TX/UT/LA)

### Google Play Store

- [ ] Self-certified child safety compliance
- [ ] Designated CSAE contact documented
- [ ] CSAM reporting process to NCMEC documented
- [ ] Only Google Families-certified ad networks (or no ads)
- [ ] No AAID, device identifiers, or location transmitted
- [ ] Minimal permissions requested with justifications
- [ ] Content does not endanger children
- [ ] User-generated content is moderated (or feature disabled)
- [ ] Play Age Signals API integrated (if targeting TX/UT/LA)
- [ ] Age rating questionnaire completed

### GDPR-K (EU/EEA Users)

- [ ] Age verification for users under 16 (or member state minimum)
- [ ] Parental consent for users below age of consent
- [ ] Verification method is "reasonable" for risk level
- [ ] Privacy notice in plain language children can understand
- [ ] All data subject rights (access, rectification, erasure, portability) implemented
- [ ] DPIA conducted (recommended)

---

## Additional Resources

### Official Guidance
- [FTC COPPA FAQ](https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions)
- [Google Play Families Policies](https://support.google.com/googleplay/android-developer/answer/9893335?hl=en)
- [Apple Design Safe Experiences](https://developer.apple.com/kids/)
- [GDPR Article 8](https://gdpr-info.eu/art-8-gdpr/)

### Industry Best Practices
- [Future of Privacy Forum: Verifiable Parental Consent White Paper](https://fpf.org/wp-content/uploads/2023/06/FPF-VPC-White-Paper-06-02-23-final2.pdf)
- [COPPA Compliance Practical Guide 2025](https://blog.promise.legal/startup-central/coppa-compliance-in-2025-a-practical-guide-for-tech-edtech-and-kids-apps/)

### Developer Communities
- [Privacy World Blog: App Store Age Verification](https://www.privacyworld.blog/2025/10/app-store-age-verification-laws-your-questions-answered/)
- [Median: Age Verification Laws 2026](https://median.co/blog/new-age-verification-laws-2026)

---

*Researched: January 31, 2026*
*Next Review: April 2026 (COPPA deadline check-in)*

---

## Sources

### COPPA Requirements
- [FTC Amends COPPA Rule To Address Changes in Technology](https://www.dwt.com/blogs/privacy--security-law-blog/2025/05/coppa-rule-ftc-amended-childrens-privacy)
- [Children's Online Privacy Protection Rule (COPPA) | FTC](https://www.ftc.gov/legal-library/browse/rules/childrens-online-privacy-protection-rule-coppa)
- [COPPA Requirements & Compliance](https://www.kiteworks.com/risk-compliance-glossary/coppa-childrens-online-privacy-protection-act/)
- [Complying with COPPA: Frequently Asked Questions](https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions)
- [Federal Register: Children's Online Privacy Protection Rule](https://www.federalregister.gov/documents/2025/04/22/2025-05904/childrens-online-privacy-protection-rule)
- [COPPA Compliance Checklist](https://bigid.com/blog/coppa-compliance/)
- [eCFR COPPA Rule](https://www.ecfr.gov/current/title-16/chapter-I/subchapter-C/part-312)

### Google Play Requirements
- [Developer Program Policy - Play Console Help](https://support.google.com/googleplay/android-developer/answer/16810878?hl=en)
- [Google Play Families Policies](https://support.google.com/googleplay/android-developer/answer/9893335?hl=en)
- [App Store Age Verification Laws for Android & iOS Apps](https://median.co/blog/new-age-verification-laws-2026)
- [Child Safety Standards Policy](https://support.google.com/googleplay/android-developer/answer/14747720?hl=en)
- [Google Play Changes for App Store Bills](https://support.google.com/googleplay/android-developer/answer/16569691)
- [Google Play Streamlines Kids Apps Policies](https://techcrunch.com/2022/11/16/google-play-streamlines-policies-around-kids-apps-as-regulations-tighten/)

### Apple App Store Requirements
- [Design Safe and Age-Appropriate Experiences - Apple Developer](https://developer.apple.com/kids/)
- [App Review Guidelines - Apple Developer](https://developer.apple.com/app-store/review/guidelines/)
- [App Store Age Verification Laws](https://www.privacyworld.blog/2025/10/app-store-age-verification-laws-your-questions-answered/)
- [iOS 26.2 Adds APIs for Texas Parental Consent Law](https://www.macrumors.com/2025/11/04/ios-26-2-texas-age-verification-law/)
- [Age Ratings - App Store Connect](https://developer.apple.com/help/app-store-connect/reference/app-information/age-ratings-values-and-definitions/)

### GDPR-K Requirements
- [GDPR-K: Children's Data and Parental Consent](https://www.clarip.com/data-privacy/gdpr-child-consent/)
- [Understanding Children's Online Privacy Rules Around COPPA, GDPR-K](https://pandectes.io/blog/childrens-online-privacy-rules-around-coppa-gdpr-k-and-age-verification/)
- [GDPR-K Compliance - Captain Compliance](https://captaincompliance.com/education/gdpr-k-compliance/)
- [Art. 8 GDPR – Conditions for Child's Consent](https://gdpr-info.eu/art-8-gdpr/)
- [GDPR Safeguards for Children - European Commission](https://commission.europa.eu/law/law-topic/data-protection/rules-business-and-organisations/legal-grounds-processing-data/are-there-any-specific-safeguards-data-about-children_en)
- [GDPR-K Toolkit: Verifiable Parental Consent](https://www.superawesome.com/blog/the-gdpr-k-toolkit-for-kids-publishers-part-six-obtaining-verifiable-parental-consent/)
- [Children and the UK GDPR | ICO](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/children-and-the-uk-gdpr/)

### Data Privacy Features
- [Everything to Know about Data Privacy for Kids Apps](https://countly.com/blog/data-privacy-kids-apps)
- [COPPA Compliance in 2025: A Practical Guide](https://blog.promise.legal/startup-central/coppa-compliance-in-2025-a-practical-guide-for-tech-edtech-and-kids-apps/)
- [What Privacy Laws Apply When My App Collects Kids' Data?](https://thisisglance.com/learning-centre/what-privacy-laws-apply-when-my-app-collects-kids-data)
- [Legal Requirements for Websites and Apps Used by Children](https://www.iubenda.com/en/help/5717-legal-requirements-websites-apps-children)
- [How Do I Make My App Compliant With Children's Privacy Laws?](https://thisisglance.com/learning-centre/how-do-i-make-my-app-compliant-with-childrens-privacy-laws)
- [Privacy Guidelines for Apps for Children - TermsFeed](https://www.termsfeed.com/blog/privacy-guidelines-apps-children/)

### Parental Consent Mechanisms
- [Future of Privacy Forum: Verifiable Parental Consent White Paper](https://fpf.org/wp-content/uploads/2023/06/FPF-VPC-White-Paper-06-02-23-final2.pdf)
- [Designing Apps for Children: Guide to COPPA and Mobile Apps](https://www.iubenda.com/blog/guide-coppa-mobile-apps/)
- [Legal Requirements for App Games for Kids](https://www.privacypolicies.com/blog/legal-requirements-kids-game-apps/)

### Third-Party Tracking & Advertising
- [COPPA Compliance in 2025](https://blog.promise.legal/startup-central/coppa-compliance-in-2025-a-practical-guide-for-tech-edtech-and-kids-apps/)
- [IronSource Child-Directed Apps](https://developers.is.com/ironsource-mobile/general/ironsource-mobile-child-directed-apps/)
- [Singular Kids Apps SDKs FAQ](https://support.singular.net/hc/en-us/articles/8662482470555-Kids-Apps-SDKs-FAQ)
- [Adjust Apps for Children](https://dev.adjust.com/en/sdk/apps-for-children/)
- [Apple Restricts Ads and Third-Party Trackers in Kids Apps](https://techcrunch.com/2019/06/03/apple-kid-apps-trackers/)
- [Unity COPPA Compliance](https://docs.unity.com/en-us/grow/ads/privacy/coppa-compliance)

### App Rejection Reasons
- [11 Common Google Play Store Rejections](https://onemobile.ai/common-google-play-store-rejections/)
- [App Store Age Ratings Guide](https://capgo.app/blog/app-store-age-ratings-guide/)
- [App Store Rejection Reasons](https://www.hexnode.com/blogs/app-store-rejection-reasons/)
