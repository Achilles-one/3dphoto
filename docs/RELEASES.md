# Release notes

## Beta v0.1.0 — current

The visible build identifier is injected during the Vite build. Hosted builds
prefer the deployment commit SHA; local builds use the short Git revision and
append `-dirty` when the working tree has uncommitted changes.

### Included

- Local JPG, PNG and MPO processing with split, alignment and wiggle previews.
- Full-resolution-aware GIF export with adaptive memory protection.
- Shared GIF palette and decoded-frame quality regression tests.
- Local H.264 MP4 export through WebCodecs and Mediabunny, with 1080/1440 longest-edge presets, 25fps timing, VBR quality targets, complete-loop duration, capability detection and cancellation.
- MPO to SBS PNG export when both view dimensions match.
- Stable user-facing diagnostic codes and prefilled GitHub feedback.

### Known issues

- MPO compatibility remains Beta until the real-device fixture matrix covers
  Nintendo 3DS and at least one additional stereo camera family.
- iOS/Safari download behavior and low-memory thresholds still require physical
  device verification.
- Shared-palette GIF quality has automated synthetic coverage but still needs
  authorized real-photo review for skin tone, banding and edge flicker.
- MP4 availability depends on runtime WebCodecs H.264 support; real-device 1440,
  mobile download and low-memory verification remain pending.
- Analytics consent remains tracked separately under P0-05.

### Feedback destination

Feedback is filed at
[Achilles-one/3dphoto issues](https://github.com/Achilles-one/3dphoto/issues/new).
The generated issue body contains version, build, browser, input format, export
size and error code. It does not contain image pixels or file names.

### Rollback target

- Rollback build: `0.1.0+0da579d`
- Source revision: `0da579d`
- Use the previously deployed artifact built from that revision. Do not reuse
  an artifact marked `-dirty` as a rollback target.
