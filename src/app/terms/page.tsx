import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="max-w-3xl">
      <p className="mb-4">
        <Link href="/">← Boards</Link>
      </p>

      <h1 className="text-2xl font-semibold mb-6">Terms of Service</h1>
      <p className="text-sm text-neutral-600 mb-8">
        Last updated: {new Date().toLocaleDateString()}
      </p>

      <div className="space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-medium mb-2">1. Acceptance</h2>
          <p>
            By creating an account or using Moors, you agree to these Terms of
            Service. If you do not agree, do not use the site.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium mb-2">2. Eligibility</h2>
          <p>
            You must be at least 13 years old to use Moors. Access to adult boards
            and certain content requires that you are at least 18 and have been
            granted adult access by site staff.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium mb-2">3. Accounts</h2>
          <p>
            You are responsible for your account, password, and activity under
            your username. Do not share credentials. Staff may suspend or remove
            accounts that break these terms or applicable law.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium mb-2">4. Content rules</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Do not post illegal content or links to illegal material.</li>
            <li>Do not harass, threaten, dox, or impersonate others.</li>
            <li>Respect board rules, including content boundaries.</li>
            <li>
              Image attachments may require staff approval before they appear
              publicly.
            </li>
            <li>
              You retain rights to content you post, but grant Moors a license to
              host and display it on the service.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-medium mb-2">5. Moderation</h2>
          <p>
            Admins and moderators may remove content, ban users, approve or reject
            images, and manage boards as needed to keep the community usable and
            lawful. Staff decisions may be appealed by contacting an admin.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium mb-2">6. Availability</h2>
          <p>
            Moors is provided as-is. Features may change, and the service may be
            unavailable at times. We are not liable for lost posts.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium mb-2">7. Changes</h2>
          <p>
            We may update these terms. Continued use after changes means you
            accept the updated terms. Material changes may also be announced on
            the site.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium mb-2">8. Contact</h2>
          <p>
            Questions about these terms can be raised via Site updates or by
            contacting a site admin through the forum.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium mb-2">9. Breach of these terms</h2>
          <p>
            If you are found to have shared illegal content, illegal links, or
            illegal material, we will forward that content to the appropriate
            authorities. Remember, what you share is not anonymous.
          </p>
        </section>
      </div>
    </main>
  );
}
