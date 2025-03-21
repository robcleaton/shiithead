
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
                karma: {
                    background: '#f8f9fa',
                    foreground: '#1a1a1a',
                    primary: '#8B5CF6',
                    secondary: '#E5DEFF',
                    accent: '#D946EF',
                    muted: '#F1F0FB',
                    border: '#E2E8F0',
                    card: {
                        red: '#ef4444',
                        black: '#1e293b',
                        back: '#334155'
                    }
                }
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
                'float': {
                    '0%, 100%': {
                        transform: 'translateY(0)'
                    },
                    '50%': {
                        transform: 'translateY(-10px)'
                    }
                },
                'card-flip': {
                    '0%': { 
                        transform: 'rotateY(0deg)',
                        opacity: '1'
                    },
                    '50%': { 
                        transform: 'rotateY(90deg)',
                        opacity: '0.5'
                    },
                    '100%': { 
                        transform: 'rotateY(0deg)',
                        opacity: '1'
                    }
                },
                'card-deal': {
                    '0%': { 
                        transform: 'translateX(100%) translateY(-100%) rotate(20deg)',
                        opacity: '0'
                    },
                    '100%': { 
                        transform: 'translateX(0) translateY(0) rotate(0)',
                        opacity: '1'
                    }
                },
                'card-hover': {
                    '0%': { 
                        transform: 'translateY(0)'
                    },
                    '100%': { 
                        transform: 'translateY(-20px)'
                    }
                },
                'fade-in': {
                    '0%': { 
                        opacity: '0',
                        transform: 'translateY(10px)'
                    },
                    '100%': { 
                        opacity: '1',
                        transform: 'translateY(0)'
                    }
                },
                'blur-in': {
                    '0%': { 
                        opacity: '0',
                        filter: 'blur(20px)'
                    },
                    '100%': { 
                        opacity: '1',
                        filter: 'blur(0)'
                    }
                },
                'slide-up': {
                    '0%': { 
                        transform: 'translateY(100%)',
                        opacity: '0'
                    },
                    '100%': { 
                        transform: 'translateY(0)',
                        opacity: '1'
                    }
                },
                'pulse-subtle': {
                    '0%, 100%': { 
                        opacity: '1'
                    },
                    '50%': { 
                        opacity: '0.8'
                    }
                }
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
                'float': 'float 6s ease-in-out infinite',
                'card-flip': 'card-flip 0.5s ease-out',
                'card-deal': 'card-deal 0.5s ease-out forwards',
                'card-hover': 'card-hover 0.2s ease-out forwards',
                'fade-in': 'fade-in 0.5s ease-out',
                'blur-in': 'blur-in 0.8s ease-out',
                'slide-up': 'slide-up 0.5s ease-out',
                'pulse-subtle': 'pulse-subtle 2s ease-in-out infinite'
			},
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'card-texture': "url('data:image/svg+xml,%3Csvg width=\"20\" height=\"20\" viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"%239C92AC\" fill-opacity=\"0.05\" fill-rule=\"evenodd\"%3E%3Ccircle cx=\"3\" cy=\"3\" r=\"3\"/%3E%3Ccircle cx=\"13\" cy=\"13\" r=\"3\"/%3E%3C/g%3E%3C/svg%3E')"
            }
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
