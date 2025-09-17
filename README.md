# H2Oil Well Testing Calculator

A professional well testing calculator suite designed for the oil and gas industry. This application provides comprehensive tools for well testing calculations including orifice flow, choke rates, critical flow conditions, gas-oil ratios, and more.

## Features

- **Daniel Orifice Calculator** - Gas flow through orifices
- **Choke Rate Calculator** - Well choke flow rates  
- **Critical Flow Calculator** - Critical flow conditions
- **GOR Calculator** - Gas-Oil Ratio calculations
- **Gas Velocity Calculator** - Gas velocity in pipes
- **Unit Converter** - Comprehensive unit conversions
- **Google OAuth Authentication** - Secure user authentication
- **Data Export/Import** - Save and share calculation sessions
- **Dual Unit Systems** - Metric and Field units support

## Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Components**: Radix UI + Tailwind CSS
- **Authentication**: Supabase Auth with Google OAuth
- **Database**: Supabase PostgreSQL
- **Deployment**: Vercel-ready

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/loloil123/wellspring-calculator.git

# Navigate to the project directory
cd wellspring-calculator

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Environment Variables
Create a `.env.local` file:
```
VITE_APP_URL=http://localhost:8081
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions to Vercel.

## Contributing

This is a professional tool for the oil and gas industry. For feature requests or bug reports, please create an issue in the repository.

## License

Professional use license for oil and gas industry applications.