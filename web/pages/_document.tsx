import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en" className="dark">
      <Head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
      </Head>
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
