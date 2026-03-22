import './globals.css';
import type { Metadata } from 'next';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { theme } from '@/app/lib/theme';

export const metadata: Metadata = {
  title: 'JESA Production Tracker',
  description: 'Production tracking dashboard for dairy intake and pasteurization.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
