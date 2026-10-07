<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## App architecture
- Keep the fixed drinks reference in a browser-safe catalog module; preserve the supplied historical labels independently from AI commentary.
- Use bundled individual generated product images for collection and detail views so assets work without third-party hotlinks.
- Put AI calls in client-safe server function declarations backed by server-only helpers; never expose prompts or credentials to the browser.
- Use semantic global CSS tokens and existing UI controls, with Framer Motion respecting reduced-motion preferences.
