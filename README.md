# 3D Photo Enhancer

3D Photo Enhancer is a browser-based Beta tool for turning an MPO, side-by-side image, or top-bottom image into a four-frame wiggle GIF or H.264 MP4 video. MPO input can also be exported as a side-by-side PNG. Photo pixels are decoded and processed locally in the browser.

## Local development

Requirements: Node.js 22.12 or newer and npm.

```bash
npm ci
npm run dev
```

The application is a Vue 3 and Vite static site. No backend is required for local photo processing.

## Documentation

Start with [`docs/STATUS.md`](docs/STATUS.md) for the current project state.

- Product scope and user flow: [`docs/PRD.md`](docs/PRD.md)
- Interaction rules: [`docs/UI.md`](docs/UI.md)
- Page specifications: [`docs/pages/`](docs/pages/)
- Development loop: [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md)
- Architecture boundaries: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- Quality gates: [`docs/QUALITY.md`](docs/QUALITY.md)
- Design baseline: [`docs/design/`](docs/design/)
- Release history: [`docs/RELEASES.md`](docs/RELEASES.md)

## Test and release checks

```bash
npm test
npm run test:mp4
npm run release:check
```

`test:mp4` runs the real-browser H.264 export gate. `release:check` runs the automated tests, type check, production build, GIF/MP4 Worker artifact checks, Vercel-header checks, a minimal GIF export through the built GIF Worker, and the MP4 browser gate. CI uses `ffprobe` only to verify the generated video; it is not bundled with the site.

GitHub Actions runs the core checks and the Windows Edge MP4 gate for every push, pull request, and merge-queue commit. Configure both `CI / release-check` and `CI / mp4-browser-gate` as required status checks on the protected release branch so a test, build, browser encode, or artifact failure blocks release.

## Deployment

The production build is created in `dist/` and deployed to Vercel. Versioned Vercel headers and cache policy are in `vercel.json`.

```bash
npm run release:check
```

Publish only the exact build that passed this check. Vercel uses `npm run build` as the build command and `dist` as the output directory.

After deployment, run:

```bash
npm run smoke:deployment -- https://your-deployment.example
```

The smoke test checks the homepage, referenced static assets, required security headers, both deployed export Workers, and a minimal four-frame GIF export. The `Deployment smoke` GitHub workflow can run from a successful deployment event or with a manually supplied URL.

## Privacy boundary

- Image bytes, decoded pixels, MPO contents, and generated downloads remain in the browser by default.
- Product analytics is disabled by default. It sends only when an endpoint is configured and the user has explicitly enabled the in-app analytics toggle; closing the privacy dialog without enabling it must not send events. The current CSP permits same-origin connections only; any future analytics host requires an explicit privacy review and CSP change.
- Current analytics metadata can include event properties, browser user agent, and coarse pointer/device type. It must not include filenames, image pixels, raw MPO bytes, or reversible image identifiers.
- The GitHub feedback link includes version and non-sensitive diagnostics, never the uploaded image or filename.

## Test sample policy

Do not commit personal photos or device samples without explicit redistribution permission. Every real fixture should record its source, license, device, expected view order, relevant MPO/EXIF properties, known anomalies, and whether it is public, local-only, or non-committable.

## Known limitations

- Only one input file is supported; JPG and PNG files must already contain side-by-side or top-bottom views.
- MPO compatibility is Beta and has not yet been verified against the planned real-device fixture matrix.
- Automatic layout detection uses image proportions and can be wrong; eye order may need `Swap Eyes`.
- Automatic subject alignment safely fills horizontal and vertical offsets when confidence is sufficient; manual adjustment remains available. Perspective, rotation, scaling, lens distortion, and severe scene motion are not corrected.
- GIF color and frame-order regression tests use synthetic fixtures; real-photo visual validation is still required.
- MP4 availability depends on browser WebCodecs H.264 support; 1440, mobile download, and low-memory behavior still require real-device sign-off.
- MPO-to-PNG export does not preserve the original MPO bytes or all EXIF/ICC metadata.
- Mobile Safari, Android download behavior, and low-memory device thresholds still require real-device sign-off.
