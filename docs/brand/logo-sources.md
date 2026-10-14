# Third-party logo sources

Logos shown in the home page's stack strip. Path data: `public/brand/stack-icons.svg` (one cached SVG sprite); keys: `src/components/icons/brand.ts`.

- **Source:** [Simple Icons](https://simpleicons.org) **16.35.0**, licence **CC0-1.0** (the SVG files). Path data copied verbatim; rendered monochrome via `currentColor`.
- **Trademarks** remain the property of their owners. Simple Icons' licence covers the files, not the marks: each owner's brand guidelines still apply. The site uses them only as factual statements of the tools the studio works with (nominative use), unaltered in shape, with no implied partnership or endorsement.
- **Not used:** OpenAI's mark (removed from Simple Icons at OpenAI's request). "Codex" is shown as a text label with a generic terminal glyph (drawn after Lucide's `terminal` icon, ISC licence) — not an OpenAI mark.
- **iOS** uses a generic phone glyph: Apple's guidelines don't permit third-party use of the Apple logo, and Simple Icons' `ios` mark is only the word "iOS" (it rendered as "iOS iOS").
- **Java** uses a generic code glyph: Oracle's Java logo isn't in Simple Icons, and the OpenJDK mark would misrepresent it.
- **React Native** reuses the React mark (as React Native's own branding does). **SwiftUI** uses the Swift mark.

| Slug | Title | Upstream source | Brand guidelines |
|---|---|---|---|
| `rust` | Rust | https://www.rust-lang.org | https://www.rust-lang.org/policies/media-guide |
| `go` | Go | https://blog.golang.org/go-brand | https://blog.golang.org/go-brand |
| `typescript` | TypeScript | https://www.typescriptlang.org/branding | https://www.typescriptlang.org/branding |
| `javascript` | JavaScript | https://github.com/voodootikigod/logo.js/blob/1544bdeed6d618a6cfe4f0650d04ab8d9cfa76d9/js.svg | — |
| `python` | Python | https://www.python.org/community/logos/ | https://www.python.org/community/logos/ |
| `kotlin` | Kotlin | https://www.jetbrains.com/company/brand/logos/ | https://www.jetbrains.com/company/brand/ |
| `swift` | Swift | https://developer.apple.com/swift/resources/ | https://developer.apple.com/swift/resources/ |
| `dart` | Dart | https://github.com/dart-lang/site-shared/tree/18458ff440afd3d06f04e5cb871c4c5eda29c9d5/src/_assets/image/dart/logo | — |
| `react` | React | https://github.com/facebook/create-react-app/blob/282c03f9525fdf8061ffa1ec50dce89296d916bd/test/fixtures/relative-paths/src/logo.svg | — |
| `nextdotjs` | Next.js | https://vercel.com/design/brands#next-js | https://vercel.com/design/brands#next-js |
| `tailwindcss` | Tailwind CSS | https://tailwindcss.com/brand | https://tailwindcss.com/brand |
| `flutter` | Flutter | https://flutter.dev/brand | https://flutter.dev/brand |
| `android` | Android | https://partnermarketinghub.withgoogle.com/brands/android/visual-identity/visual-identity/logo-lock-ups | https://developer.android.com/distribute/marketing-tools/brand-guidelines#brand-android |
| `nodedotjs` | Node.js | https://nodejs.org/en/about/branding | https://nodejs.org/en/about/branding |
| `postgresql` | PostgreSQL | https://wiki.postgresql.org/wiki/Logo | https://www.postgresql.org/about/policies/trademarks/ |
| `appwrite` | Appwrite | https://appwrite.io/assets | https://appwrite.io/assets |
| `supabase` | Supabase | https://github.com/supabase/supabase/blob/4031a7549f5d46da7bc79c01d56be4177dc7c114/packages/common/assets/images/supabase-logo-wordmark--light.svg | — |
| `firebase` | Firebase | https://firebase.google.com/brand-guidelines | https://firebase.google.com/brand-guidelines |
| `claude` | Claude | https://claude.ai | — |
| `cursor` | Cursor | https://cursor.com/brand | — |
| `replit` | Replit | https://repl.it | — |
| `docker` | Docker | https://www.docker.com/company/newsroom/media-resources | — |
| `linux` | Linux | https://www.linuxfoundation.org/the-linux-mark/ | — |
| `nginx` | NGINX | https://www.nginx.com/press/ | https://www.nginx.com/press/ |
| `githubactions` | GitHub Actions | https://github.com/features/actions | — |
| `cloudflare` | Cloudflare | https://www.cloudflare.com/logo/ | https://www.cloudflare.com/trademark/ |

To update: download `simple-icons@<version>`, add a `<symbol id="<slug>" viewBox="0 0 24 24">` with the `<path d>` from `icons/<slug>.svg` to the sprite, add the slug to `brandIconKeys`, and bump the version above. `tests/unit/brand-sprite.test.mjs` fails if the two drift apart.
