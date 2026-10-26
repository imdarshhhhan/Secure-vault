import Head from 'next/head';
import VaultApp from '../components/VaultApp';

export default function DashboardPage() {
  return (
    <>
      <Head>
        <title>Secure Vault</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <VaultApp mode="full" />
    </>
  );
}
