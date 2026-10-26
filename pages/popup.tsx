import Head from 'next/head';
import VaultApp from '../components/VaultApp';

/** Toolbar popup (popup.html in the built extension). */
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
