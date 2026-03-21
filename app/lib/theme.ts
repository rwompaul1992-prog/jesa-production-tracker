'use client';

import { alpha, createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#2563eb' },
    secondary: { main: '#7c3aed' },
    success: { main: '#16a34a' },
    warning: { main: '#f59e0b' },
    error: { main: '#dc2626' },
    background: {
      default: '#eff4fb',
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a',
      secondary: '#475569',
    },
  },
  shape: { borderRadius: 18 },
  typography: {
    fontFamily: 'Inter, Arial, sans-serif',
    h4: { fontWeight: 900, letterSpacing: '-0.03em' },
    h5: { fontWeight: 800, letterSpacing: '-0.02em' },
    h6: { fontWeight: 800 },
    button: { fontWeight: 700 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage: 'radial-gradient(circle at top, rgba(37,99,235,0.06), transparent 34%)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 24,
          boxShadow: '0 18px 50px rgba(15, 23, 42, 0.08)',
          backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,255,255,1))',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 16px 40px rgba(15, 23, 42, 0.06)',
        },
      },
    },
    MuiButton: {
      defaultProps: { variant: 'contained' },
      styleOverrides: {
        root: {
          borderRadius: 14,
          textTransform: 'none',
          paddingInline: 16,
        },
        contained: {
          boxShadow: '0 12px 24px rgba(37, 99, 235, 0.18)',
        },
        outlined: {
          borderColor: alpha('#2563eb', 0.18),
          backgroundColor: 'white',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          fontWeight: 700,
        },
      },
    },
  },
});
