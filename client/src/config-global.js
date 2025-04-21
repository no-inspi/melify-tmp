import { paths } from 'src/routes/paths';

import packageJson from '../package.json';

// ----------------------------------------------------------------------

export const CONFIG = {
  site: {
    name: 'Melify',
    serverUrl: process.env.NEXT_PUBLIC_SERVER_URL ?? '',
    assetURL: process.env.NEXT_PUBLIC_ASSET_URL ?? '',
    basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? '',
    googleclientid: process.env.NEXT_PUBLIC_CLIENT_ID ?? '',
    cfurl: process.env.NEXT_PUBLIC_CF_URL ?? '',
    version: packageJson.version,
  },
  isStaticExport: JSON.parse(`${process.env.BUILD_STATIC_EXPORT}`),
  /**
   * Auth
   * @method gmail
   */
  auth: {
    method: 'gmail',
    skip: false,
    redirectPath: paths.dashboard.root,
  },
};
