import Head from 'next/head';
import VaultApp from '../components/VaultApp';

export default function PopupPage() {
  return (
    <>
      <Head>
        <title>Secure Vault</title>
      </Head>
      <VaultApp mode="popup" />
    </>
  );
}
