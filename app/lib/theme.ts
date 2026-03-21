'use client';

import { alpha, createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#2f6df6', dark: '#1d4ed8', light: '#69a2ff' },
    secondary: { main: '#0f172a', dark: '#020617', light: '#334155' },
    success: { main: '#0fa88b', dark: '#0f766e', light: '#67e8d4' },
    warning: { main: '#f59e0b', dark: '#d97706', light: '#fcd34d' },
    error: { main: '#dc2626', dark: '#b91c1c', light: '#fca5a5' },
    background: {
      default: '#edf3fb',
      paper: '#ffffff',
    },
    text: {
      primary: '#081121',
      secondary: '#516175',
    },
  },
  shape: { borderRadius: 18 },
  typography: {
    fontFamily: 'Inter, Arial, sans-serif',
    h3: { fontWeight: 900, fontSize: '2.6rem', lineHeight: 1.02, letterSpacing: '-0.04em' },
    h4: { fontWeight: 800, fontSize: '1.95rem', letterSpacing: '-0.03em' },
    h5: { fontWeight: 800, fontSize: '1.4rem', letterSpacing: '-0.02em' },
    h6: { fontWeight: 800, fontSize: '1.06rem', letterSpacing: '-0.015em' },
    subtitle1: { fontWeight: 700, fontSize: '0.98rem', letterSpacing: '-0.01em' },
    body1: { fontSize: '0.94rem', lineHeight: 1.65 },
    body2: { fontSize: '0.835rem', lineHeight: 1.6 },
    caption: { fontSize: '0.74rem', lineHeight: 1.55 },
    button: { fontWeight: 800, fontSize: '0.84rem', letterSpacing: '-0.01em' },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#edf3fb',
          backgroundImage: [
            'radial-gradient(circle at 12% 18%, rgba(47,109,246,0.15), transparent 24%)',
            'radial-gradient(circle at 88% 12%, rgba(20,184,166,0.12), transparent 20%)',
            'linear-gradient(180deg, rgba(255,255,255,0.92), rgba(237,243,251,1))',
          ].join(','),
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 24,
          boxShadow: '0 22px 44px rgba(8, 17, 33, 0.08)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,255,255,1))',
          backdropFilter: 'blur(16px)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 16px 34px rgba(8, 17, 33, 0.06)',
        },
      },
    },
    MuiButton: {
      defaultProps: { variant: 'contained' },
      styleOverrides: {
        root: {
          borderRadius: 14,
          textTransform: 'none',
          minHeight: 40,
          paddingInline: 16,
          transition: 'transform 180ms ease, box-shadow 180ms ease, background-color 180ms ease',
          '&:hover': {
            transform: 'translateY(-1px)',
          },
        },
        contained: {
          backgroundImage: 'linear-gradient(135deg, #2f6df6 0%, #2563eb 55%, #0ea5e9 100%)',
          boxShadow: '0 16px 28px rgba(47, 109, 246, 0.24)',
        },
        outlined: {
          borderColor: alpha('#2f6df6', 0.18),
          backgroundColor: '#fff',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 14,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          fontWeight: 700,
          border: '1px solid rgba(148,163,184,0.12)',
        },
      },
    },
    MuiFormControl: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 14,
            backgroundColor: 'rgba(255,255,255,0.96)',
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)',
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: alpha('#2f6df6', 0.35),
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderWidth: 1.5,
            borderColor: '#2f6df6',
            boxShadow: `0 0 0 4px ${alpha('#2f6df6', 0.08)}`,
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontSize: '0.79rem',
          borderColor: 'rgba(148,163,184,0.14)',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: 'small',
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          backgroundColor: alpha('#0f172a', 0.08),
        },
      },
    },
  },
});
