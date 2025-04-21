import { CONFIG } from 'src/config-global';

import { GmailSignInView } from 'src/sections/auth/gmail';

// ----------------------------------------------------------------------

export const metadata = { title: `Sign in | Gmail - ${CONFIG.site.name}` };

export default function Page() {
  return <GmailSignInView />;
}
