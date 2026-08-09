# Production Deployment

## Build locally

Use Node.js 22.12 or newer.

```bash
npm ci
npm run release:check
npm run preview:production
```

The release check runs the automated tests, type checking, Vite production build, and a check that the HTML and GIF worker bundle exist in `dist`.

## Cloudflare Pages

Create a Pages project from this repository and use:

- Build command: `npm run build`
- Build output directory: `dist`
- Node.js version: `22.12.0` or newer

The repository includes `wrangler.toml` with `pages_build_output_dir = "./dist"`. The `public/_headers` file is copied to the production output so hashed assets can be cached for a long time while the HTML entry stays fresh.

## Subpath deployments

For a deployment below the domain root, set `VITE_BASE_PATH` during the build, including leading and trailing slashes. For example:

```bash
VITE_BASE_PATH=/photo-enhancer/ npm run build
```

The default value is `/`, which is suitable for a custom domain or a Pages project root.

## Release checklist

- `npm ci` succeeds from a clean checkout.
- `npm run release:check` passes.
- The deployed page loads over HTTPS.
- GIF export works in the deployed build.
- A mobile viewport has no horizontal scroll.
- The browser console has no production errors.
- The deployed URL is tested with JPG, PNG, and MPO samples.
