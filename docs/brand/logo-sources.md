# Third-party logo sources

Logos shown in the home page's stack strip (`src/components/icons/brand.ts`).

- **Source:** [Simple Icons](https://simpleicons.org) **16.35.0**, licence **CC0-1.0** (the SVG files). Path data copied verbatim; rendered monochrome via `currentColor`.
- **Trademarks** remain the property of their owners. Simple Icons' licence covers the files, not the marks: each owner's brand guidelines still apply. The site uses them only as factual statements of the tools the studio works with (nominative use), unaltered in shape, with no implied partnership or endorsement.
- **Not used:** OpenAI's mark (removed from Simple Icons at OpenAI's request). "Codex" is shown as a text label with a generic terminal glyph (drawn after Lucide's `terminal` icon, ISC licence) — not an OpenAI mark.
- **iOS** uses a generic phone glyph: Apple's guidelines don't permit third-party use of the Apple logo, and Simple Icons' `ios` mark is only the word "iOS" (it rendered as "iOS iOS").
- **React Native** reuses the React mark (as React Native's own branding does). **SwiftUI** uses the Swift mark.

| Slug | Title | Upstream source | Brand guidelines |
|---|---|---|---|
| `rust` | Rust | https://www.rust-lang.org | https://www.rust-lang.org/policies/media-guide |
| `javascript` | JavaScript | https://github.com/voodootikigod/logo.js/blob/1544bdeed6d618a6cfe4f0650d04ab8d9cfa76d9/js.svg | — |
| `typescript` | TypeScript | https://www.typescriptlang.org/branding | https://www.typescriptlang.org/branding |
| `react` | React | https://github.com/facebook/create-react-app/blob/282c03f9525fdf8061ffa1ec50dce89296d916bd/test/fixtures/relative-paths/src/logo.svg | — |
| `nextdotjs` | Next.js | https://vercel.com/design/brands#next-js | https://vercel.com/design/brands#next-js |
| `flutter` | Flutter | https://flutter.dev/brand | https://flutter.dev/brand |
| `swift` | Swift | https://developer.apple.com/swift/resources/ | https://developer.apple.com/swift/resources/ |
| `android` | Android | https://partnermarketinghub.withgoogle.com/brands/android/visual-identity/visual-identity/logo-lock-ups | https://developer.android.com/distribute/marketing-tools/brand-guidelines#brand-android |
| `claude` | Claude | https://claude.ai | — |
| `cursor` | Cursor | https://cursor.com/brand | — |
| `replit` | Replit | https://repl.it | — |

To update: download `simple-icons@<version>`, copy the `<path d>` from `icons/<slug>.svg`, and bump the version above.
