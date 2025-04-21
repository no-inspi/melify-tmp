import { useRouter } from 'src/routes/hooks';
// ----------------------------------------------------------------------

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    router.push('/dashboard/mail');
  }, [router]);

  return null;
}
