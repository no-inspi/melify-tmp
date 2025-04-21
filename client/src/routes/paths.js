// ----------------------------------------------------------------------

const ROOTS = {
  AUTH: '/auth',
  DASHBOARD: '/dashboard',
};

// ----------------------------------------------------------------------

export const paths = {
  faqs: '/faqs',
  // AUTH
  auth: {
    gmail: {
      signIn: `${ROOTS.AUTH}/gmail/sign-in`,
      signUp: `${ROOTS.AUTH}/gmail/sign-up`,
    },
  },
  // DASHBOARD
  dashboard: {
    root: ROOTS.DASHBOARD,
    mail: `${ROOTS.DASHBOARD}/mail`,
  },
};
