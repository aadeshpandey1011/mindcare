import React from "react";
import { Link } from "react-router-dom";

const Section = ({ title, children }) => (
  <div className="mb-8">
    <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">{title}</h2>
    <div className="text-sm text-gray-600 leading-relaxed space-y-2">{children}</div>
  </div>
);

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-10 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-extrabold mb-2">Privacy Policy</h1>
          <p className="text-white/70 text-sm">Last updated: March 2026 · Effective immediately</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Summary card */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 mb-8">
          <h2 className="font-bold text-emerald-900 text-base mb-3">🔑 The Short Version</h2>
          <ul className="space-y-2 text-sm text-emerald-800">
            <li className="flex items-start gap-2"><span className="mt-0.5">✅</span> Your mental health data is private. We never sell it.</li>
            <li className="flex items-start gap-2"><span className="mt-0.5">✅</span> Your journal, screening results, and chat history are yours alone.</li>
            <li className="flex items-start gap-2"><span className="mt-0.5">✅</span> We only contact you for things you've opted into.</li>
            <li className="flex items-start gap-2"><span className="mt-0.5">✅</span> You can delete your account and all data at any time.</li>
            <li className="flex items-start gap-2"><span className="mt-0.5">⚠️</span> In a life-threatening emergency, we may share minimal information with emergency services if required by law.</li>
          </ul>
        </div>

        <Section title="1. Who we are">
          <p>MindCare is a digital mental health support platform designed for students and young adults in India. We are based in India and our services are governed by Indian data protection law.</p>
          <p>Contact: <a href="mailto:support@mindcare.com" className="text-emerald-600 hover:underline">support@mindcare.com</a></p>
        </Section>

        <Section title="2. What data we collect">
          <p><strong className="text-gray-800">Account data:</strong> Your name, email address, username, date of birth, and institution name when you register.</p>
          <p><strong className="text-gray-800">Identity verification:</strong> Phone number, Aadhar number, and PAN card number if you choose to verify your identity. These are stored encrypted and shown only in masked form (e.g., ✕✕✕✕ 1234).</p>
          <p><strong className="text-gray-800">Mental health data:</strong> Screening test responses and scores, daily mood logs, journal entries, AI chat conversations, and goal progress. This is the most sensitive category of data we hold and is treated with the highest level of protection.</p>
          <p><strong className="text-gray-800">Booking data:</strong> Session dates, times, counsellor details, mode of session, and payment status.</p>
          <p><strong className="text-gray-800">Usage data:</strong> Pages visited, features used, and basic analytics to improve the platform. This is anonymised and aggregated — it cannot be linked back to you individually.</p>
        </Section>

        <Section title="3. How we use your data">
          <p>We use your data to:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Provide and improve the MindCare platform and its features</li>
            <li>Personalise your experience (screening results, resource recommendations)</li>
            <li>Process bookings and payments for counselling sessions</li>
            <li>Send you emails you've opted into (weekly resource, session reminders)</li>
            <li>Alert our admin team when a screening result indicates a high-risk situation — this is done to enable welfare outreach, not for any commercial purpose</li>
            <li>Comply with applicable Indian laws</li>
          </ul>
          <p className="mt-2">We <strong className="text-gray-800">never</strong> use your mental health data for advertising, sell it to third parties, or share it with employers, universities, or insurance companies.</p>
        </Section>

        <Section title="4. Who can see your data">
          <p><strong className="text-gray-800">You</strong> — you can see all your own data in your account.</p>
          <p><strong className="text-gray-800">Your counsellor</strong> — when you book a session, your counsellor sees your name, reason for booking, and screening history. They do not see your journal or AI chat history.</p>
          <p><strong className="text-gray-800">MindCare admins</strong> — our admin team can see user accounts and booking data for platform management. They are trained in data confidentiality. They do not routinely access your journal or chat history.</p>
          <p><strong className="text-gray-800">Third-party services</strong> — we use Cashfree (payments) and Google Gemini (AI). These services process data under their own privacy policies. We do not pass your mental health history to these services.</p>
        </Section>

        <Section title="5. AI chat conversations">
          <p>Your conversations with Mia (our AI companion) are sent to Google's Gemini AI API for response generation. Conversations are held in-session memory and are not stored permanently on Google's servers after the API call completes.</p>
          <p>We store the general content of conversations in our database linked to your account so that context is maintained across sessions. This data is encrypted at rest.</p>
          <p>Our AI is not a therapist and does not provide clinical diagnoses. Always seek professional help for serious mental health concerns.</p>
        </Section>

        <Section title="6. Data security">
          <p>We use industry-standard security measures including:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>HTTPS/TLS encryption for all data in transit</li>
            <li>Encrypted storage for sensitive fields (Aadhar, PAN, bank details)</li>
            <li>JWT-based authentication with secure token handling</li>
            <li>Role-based access controls — counsellors cannot see admin data and vice versa</li>
          </ul>
          <p className="mt-2">No system is 100% secure. In the event of a data breach, we will notify affected users within 72 hours as required by law.</p>
        </Section>

        <Section title="7. Your rights">
          <p>You have the right to:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong className="text-gray-800">Access</strong> your data — email us and we'll send you everything we hold</li>
            <li><strong className="text-gray-800">Correct</strong> inaccurate data — update it in your profile or contact us</li>
            <li><strong className="text-gray-800">Delete</strong> your account and all data — go to Profile → Delete Account, or email us. We will delete all personal data within 30 days.</li>
            <li><strong className="text-gray-800">Object</strong> to processing — you can stop receiving emails from your notification settings</li>
            <li><strong className="text-gray-800">Data portability</strong> — we can provide your data in a machine-readable format on request</li>
          </ul>
          <p className="mt-2">To exercise any of these rights, email <a href="mailto:privacy@mindcare.com" className="text-emerald-600 hover:underline">privacy@mindcare.com</a>.</p>
        </Section>

        <Section title="8. Cookies">
          <p>We use essential cookies only — for authentication (keeping you logged in) and basic security. We do not use advertising cookies or tracking pixels.</p>
          <p>We do not use Google Analytics or Meta Pixel on this platform.</p>
        </Section>

        <Section title="9. Children">
          <p>MindCare is intended for users aged 16 and above. If you are under 16, please use this platform with parental consent. We do not knowingly collect data from children under 13.</p>
        </Section>

        <Section title="10. Changes to this policy">
          <p>We may update this policy as our platform evolves. We will notify registered users by email when significant changes are made. Continued use of MindCare after changes constitutes acceptance.</p>
        </Section>

        <Section title="11. Contact us">
          <p>For privacy concerns, data requests, or questions about this policy:</p>
          <ul className="space-y-1 ml-2">
            <li>Email: <a href="mailto:privacy@mindcare.com" className="text-emerald-600 hover:underline">privacy@mindcare.com</a></li>
            <li>Support: <a href="mailto:support@mindcare.com" className="text-emerald-600 hover:underline">support@mindcare.com</a></li>
          </ul>
        </Section>

        {/* Crisis note */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 mt-8">
          <p className="text-sm font-bold text-red-800 mb-1">🆘 In a mental health crisis?</p>
          <p className="text-xs text-red-700 mb-2">This privacy policy does not apply in emergencies. If you or someone else is in immediate danger, please contact:</p>
          <div className="flex flex-wrap gap-2">
            <a href="tel:9152987821" className="text-xs font-bold bg-red-100 text-red-700 px-3 py-1 rounded-full hover:bg-red-200">iCall: 9152987821</a>
            <a href="tel:18602662345" className="text-xs font-bold bg-red-100 text-red-700 px-3 py-1 rounded-full hover:bg-red-200">Vandrevala: 1860-2662-345</a>
            <a href="tel:112" className="text-xs font-bold bg-red-100 text-red-700 px-3 py-1 rounded-full hover:bg-red-200">Emergency: 112</a>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-200 text-xs text-gray-400 text-center">
          <p>© 2026 MindCare. <Link to="/newhome" className="text-emerald-600 hover:underline">Back to Home</Link></p>
        </div>
      </div>
    </div>
  );
}
