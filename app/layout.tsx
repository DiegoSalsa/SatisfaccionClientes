import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: 'ValoraLocal - Encuestas de Satisfacción para Negocios en Chile',
    template: '%s | ValoraLocal',
  },
  description: 'Conoce la opinión real de tus clientes con encuestas QR simples y efectivas. Dashboard en tiempo real, exportación a Excel y QR personalizado con tu logo. Ideal para restaurantes, cafés y comercios en Chile.',
  keywords: ['encuestas de satisfacción', 'encuestas QR', 'opinión de clientes', 'feedback clientes', 'encuestas restaurantes', 'encuestas negocios', 'satisfacción del cliente', 'NPS', 'Chile', 'valoración clientes'],
  authors: [{ name: 'ValoraLocal' }],
  creator: 'ValoraLocal',
  publisher: 'ValoraLocal',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://valoralocal.cl'),
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: 'ValoraLocal - Encuestas de Satisfacción para Negocios',
    description: 'Conoce la opinión real de tus clientes con encuestas QR simples. Dashboard en tiempo real, exportación a Excel y QR con tu logo.',
    url: 'https://valoralocal.cl',
    siteName: 'ValoraLocal',
    locale: 'es_CL',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ValoraLocal - Encuestas de Satisfacción',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ValoraLocal - Encuestas de Satisfacción para Negocios',
    description: 'Conoce la opinión real de tus clientes con encuestas QR simples y efectivas.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // google: 'tu-codigo-de-verificacion', // Agregar cuando tengas Google Search Console
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
