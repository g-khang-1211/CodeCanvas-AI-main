+# Changelog
+
+## Unreleased
+
+### Fixed
+- Restored backend Supabase token verification for protected routes, fixing `401 Unauthorized` failures on:
+  - `PUT /api/profile/key`
+  - `GET /api/profile/key-status`
+  - existing `/api/gemini/*` routes
+- Fixed backend auth config loading so Supabase URL/keys are resolved at request time after local env files are loaded, instead of being captured too early during module import.
+- Hardened frontend bearer-token usage for authenticated requests so the app uses the active same-user session more reliably and avoids the earlier save-path pre-request auth veto.
+- Kept the secure backend-owned storage model intact:
+  - frontend sends the user-entered Gemini API key to the backend
+  - backend authenticates the user
+  - backend encrypts with `API_KEY_ENCRYPTION_SECRET`
+  - encrypted key is stored in Supabase
+  - backend decrypts server-side for Gemini routes
+- Preserved compatibility with legacy stored ciphertext shaped like `U2FsdGVkX1...`.
+
+### Developer Experience
+- Fixed backend dev startup instability by narrowing Node watch mode to the backend directory and `.env.local`, avoiding the local `EMFILE: too many open files, watch` crash while keeping auto-reload available.
+
+### Not Changed
+- No public route renames
+- No schema changes
+- No Settings UI redesign
+- No browser-side secret-bearing Supabase access
