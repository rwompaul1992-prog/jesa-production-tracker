'use client';

import { alpha, createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#2563eb' },
    secondary: { main: '#475569' },
    success: { main: '#16a34a' },
    warning: { main: '#f59e0b' },
    error: { main: '#dc2626' },
    background: {
      default: '#f3f6fb',
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a',
      secondary: '#475569',
    },
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: 'Inter, Arial, sans-serif',
    h4: { fontWeight: 800, fontSize: '1.85rem', letterSpacing: '-0.02em' },
    h5: { fontWeight: 800, fontSize: '1.35rem' },
    h6: { fontWeight: 800, fontSize: '1.05rem' },
    subtitle1: { fontWeight: 700, fontSize: '1rem' },
    body1: { fontSize: '0.95rem' },
    body2: { fontSize: '0.875rem' },
    caption: { fontSize: '0.76rem' },
    button: { fontWeight: 700, fontSize: '0.87rem' },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage: 'radial-gradient(circle at top, rgba(37,99,235,0.04), transparent 32%)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 18,
          boxShadow: '0 10px 24px rgba(15, 23, 42, 0.05)',
          backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.99), rgba(255,255,255,1))',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 8px 18px rgba(15, 23, 42, 0.04)',
        },
      },
    },
    MuiButton: {
      defaultProps: { variant: 'contained' },
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          minHeight: 36,
          paddingInline: 14,
        },
        contained: {
          boxShadow: '0 8px 18px rgba(37, 99, 235, 0.14)',
        },
        outlined: {
          borderColor: alpha('#2563eb', 0.16),
          backgroundColor: '#fff',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          fontWeight: 700,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontSize: '0.8rem',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: 'small',
      },
    },
  },
});
