// /pages/_app.tsx
import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import '../styles/globals.css';

// Optional: Add analytics or other global providers here
// import { Analytics } from '@vercel/analytics/react';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  // Optional: Add page view tracking
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      // Add analytics tracking here if needed
      console.log('App is changing to: ', url);
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

  // Optional: Add global error boundary
  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('Global error caught:', error);
      // Add error reporting here if needed
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  return (
    <>
      <Head>
        <title>AI Notes - Voice Recording & AI Analysis</title>
        <meta 
          name="description" 
          content="Create smart voice notes with AI transcription, image capture, and automatic summarization. Perfect for field work, meetings, and project documentation." 
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#2563eb" />
        
        {/* Favicon and App Icons */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        
        {/* Open Graph / Social Media */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="AI Notes - Smart Voice Recording" />
        <meta property="og:description" content="Create smart voice notes with AI transcription and analysis" />
        <meta property="og:image" content="/og-image.png" />
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:title" content="AI Notes - Smart Voice Recording" />
        <meta property="twitter:description" content="Create smart voice notes with AI transcription and analysis" />
        <meta property="twitter:image" content="/og-image.png" />
        
        {/* Performance and Security */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="Referrer-Policy" content="origin-when-cross-origin" />
        
        {/* Preload critical fonts */}
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          as="style"
          onLoad={(e) => {
            const link = e.target as HTMLLinkElement;
            link.onload = null;
            link.rel = 'stylesheet';
          }}
        />
        <noscript>
          <link
            href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
            rel="stylesheet"
          />
        </noscript>
      </Head>

      <div className="app-container">
        {/* Global Loading Indicator */}
        <style jsx global>{`
          .app-container {
            min-height: 100vh;
            background-color: #f9fafb;
          }
          
          /* Custom scrollbar */
          ::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }
          
          ::-webkit-scrollbar-track {
            background: #f1f5f9;
          }
          
          ::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 3px;
          }
          
          ::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
          }
          
          /* Focus styles */
          .focus-visible:focus {
            outline: 2px solid #2563eb;
            outline-offset: 2px;
          }
          
          /* Animation for page transitions */
          .page-transition-enter {
            opacity: 0;
            transform: translateY(20px);
          }
          
          .page-transition-enter-active {
            opacity: 1;
            transform: translateY(0);
            transition: opacity 300ms, transform 300ms;
          }
          
          .page-transition-exit {
            opacity: 1;
          }
          
          .page-transition-exit-active {
            opacity: 0;
            transition: opacity 300ms;
          }
          
          /* Loading skeleton animation */
          @keyframes skeleton-loading {
            0% {
              background-position: -200px 0;
            }
            100% {
              background-position: calc(200px + 100%) 0;
            }
          }
          
          .skeleton {
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200px 100%;
            animation: skeleton-loading 1.5s infinite;
          }
          
          /* Print styles */
          @media print {
            .no-print {
              display: none !important;
            }
            
            body {
              background: white !important;
              color: black !important;
            }
          }
          
          /* High contrast mode support */
          @media (prefers-contrast: high) {
            .bg-gray-50 {
              background-color: white !important;
            }
            
            .border-gray-200 {
              border-color: black !important;
            }
          }
          
          /* Reduced motion support */
          @media (prefers-reduced-motion: reduce) {
            *,
            *::before,
            *::after {
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
              transition-duration: 0.01ms !important;
              scroll-behavior: auto !important;
            }
          }
        `}</style>

        <Component {...pageProps} />
        
        {/* Global notifications container */}
        <div id="notifications" className="fixed top-4 right-4 z-50 space-y-2" />
        
        {/* Global modal container */}
        <div id="modal-root" />
      </div>

      {/* Optional: Add analytics component */}
      {/* <Analytics /> */}
    </>
  );
}

// Optional: Add global error boundary component
export function reportWebVitals(metric: any) {
  // Log performance metrics
  console.log(metric);
  
  // Send to analytics service
  // Example: analytics.track('Web Vital', metric);
}