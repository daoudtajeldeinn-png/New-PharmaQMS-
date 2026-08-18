# PharmaQMS Vercel Deployment

## Use one stable production URL

The URLs that contain a deployment identifier, such as `new-pharma-fhnf1rxdr-daoudtajeldeinn-pngs-projects.vercel.app`, are deployment-specific snapshots. They are useful for testing a particular build, but they must not be distributed as the permanent application URL. A later deployment does not replace the files behind an older deployment URL.

Users should always open the Vercel production domain or a custom domain connected to the same Vercel project. Deployments from the configured production branch update that stable domain while retaining immutable preview URLs for rollback and testing.

## Vercel project settings

Configure the Vercel project with the repository root as its Root Directory. Use the following settings, which are also represented by the root `vercel.json` file:

| Setting | Value |
| --- | --- |
| Framework Preset | Other or Vite |
| Install Command | `npm install` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Production Branch | `main` |

After the project is imported, promote a successful deployment from `main` to production and copy the stable production-domain URL from the Vercel project settings. Do not send users the random deployment URL shown for a preview or a one-off deployment.

## PWA update behavior

The web app now uses a controlled PWA update flow. When a new service worker is available on the stable production domain, the application displays **New version available** and an **Update Now** action. Selecting that action activates the new worker and reloads the current page.

The repository also sends `Cache-Control: public, max-age=0, must-revalidate` for the HTML shell, manifest, and service-worker files. Hashed JavaScript and CSS assets remain cacheable because their filenames change when their content changes.

If a device previously installed the PWA from an old deployment-specific URL, open the stable production domain once and install the PWA again from that domain. The old installed shortcut remains tied to the old origin and cannot be redirected by a new Vercel deployment.

## Deployment checklist

Before announcing an update, deploy the `main` branch to the production environment, open the stable production URL in a private browser window, and verify the new feature. Then open the same stable URL in an existing browser session or installed PWA and confirm that the update prompt appears. If a user still sees an old screen, verify that the address bar contains the stable production domain rather than a deployment-specific URL.
