import '../styles/globals.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { AuthProvider } from '../context/AuthContext';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Head>
        <title>Livestock Sentinel - Animal Health Surveillance & Early Warning</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          name="description"
          content="Rural veterinary early warning system with role-based access and automated reverse-geocoding"
        />
      </Head>
      <Component {...pageProps} />
    </AuthProvider>
  );
}
