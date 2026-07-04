# Handoff Report — React SSR Explorer Diagnostics

## 1. Observation
* **Verbatim Error Log** inside `task-69.log` (Vite dev server log):
  > `Error in renderToReadableStream: TypeError: Cannot read properties of undefined (reading '0')`
  > `at CollapsedTile (eval at runInlinedModule (file:///C:/Users/Lenovo/Desktop/RAG%20&%20LLM/node_modules/vite/dist/node/module-runner.js:1062:11), <anonymous>:123:45)`
* **File Path & Line Content** in `src/components/jobs/JobCard.tsx` (line 167):
  ```typescript
  {job.company.name[0]}
  ```
* **File Path & Line Content** in `src/components/brand/IntroSplash.tsx` (lines 37-40):
  ```typescript
  const [phase, setPhase] = useState<"idle" | "playing" | "done">(() => {
    if (typeof window === "undefined") return "playing";
    return alreadySeen() ? "done" : "playing";
  });
  ```
* **API Response Payload** from backend query to `http://127.0.0.1:8000/jobs`:
  ```json
  "items":[{"source":"adzuna","externalId":"5787563239","title":"Senior Backend Developer","company":"Spectrum It Recruitment Limited", ...
  ```
* **Vite SSR Configuration** in `vite.config.ts` (lines 9-14):
  ```typescript
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  ```

---

## 2. Logic Chain
1. We booted the Vite dev server on port `8081` (as port `8080` was in use) and made requests to `/`, `/login`, and `/jobs`.
2. Requests to `/login` and `/jobs` completed immediately with `200 OK`, while `/` hung and timed out.
3. Checking `task-69.log` revealed a server-side rendering abort error: `TypeError: Cannot read properties of undefined (reading '0')` at `CollapsedTile` in `JobCard.tsx`.
4. In `JobCard.tsx`, the code attempts to read `{job.company.name[0]}`.
5. In the backend API response and schemas (`schemas.py`), the `company` field is returned as a raw string (e.g. `"company": "Spectrum It Recruitment Limited"`), not as a `Company` object with a `name` property.
6. This causes `job.company.name` to be `undefined`, and `job.company.name[0]` throws a `TypeError`.
7. While `/jobs` runs successfully on the server during the initial render pass (since it suspends or renders skeletons initially when loading), it crashes on the client once it hydrates and resolves the data. On `/`, the error triggers during server rendering when the lazy component resolves, causing the server stream to abort.
8. The client-side page remains locked in a blank black screen because the `IntroSplash` overlay (a solid black fullscreen overlay with `bg-[#0B0C0E]`) is rendered initially on the server.
9. Due to a hydration mismatch (where `IntroSplash` sets its initial state to `"done"` on subsequent client visits, while the server rendered `"playing"`), React hydration fails, and the overlay is never removed from the DOM, showing a blank black screen.

---

## 3. Caveats
* We assumed that the backend schema cannot be easily updated without migrations, so we proposed both frontend-only safe-guards and an optional backend response model change.
* We did not inspect the behavior of other authenticated subpages since we are unauthenticated in read-only mode, but the proposed frontend guard applies to all references of `company.name` across the codebase.

---

## 4. Conclusion
The blank black screen is caused by a server-side and client-side crash due to `job.company` being returned as a string rather than an object by the API, causing a `TypeError: Cannot read properties of undefined (reading '0')` in `JobCard` and `JobDetail` components. This triggers a React SSR stream abort. Concurrently, a hydration mismatch in the `IntroSplash` component leaves a fullscreen black overlay permanently blocking the app.

---

## 5. Verification Method
* **Programmatic Test**: Request `/login` and `/jobs` and verify they load successfully without errors.
* **Component Inspections**: Check `src/components/jobs/JobCard.tsx` and `src/components/brand/IntroSplash.tsx` to verify the fixes have been applied.
* **Manual Page Load**: Boot the dev server via `npm run dev` and navigate to `http://localhost:8080` (or the dev port) on a browser with existing session/cookies. Verify the splash page plays once and fades out to show the hero section cleanly.
