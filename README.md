# DevStudio - Modern Software Development Agency Website

A modern, elegant, and responsive website for a software development agency built with Next.js, Tailwind CSS, and Framer Motion.

## Features

- **Modern Design**: Clean, professional aesthetic with light background and accent colors
- **Responsive Layout**: Fully responsive for desktop, tablet, and mobile devices
- **Smooth Animations**: Subtle animations and transitions powered by Framer Motion
- **Component-Based Architecture**: Modular and reusable components
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **TypeScript**: Type-safe code for better developer experience

## Sections

- **Hero**: Eye-catching headline with call-to-action buttons
- **About**: Company introduction, mission, and values
- **Services**: Grid layout showcasing various services offered
- **Portfolio**: Project showcase with filtering and hover effects
- **Testimonials**: Client testimonials with a slider
- **Call-to-Action**: Prominent section encouraging visitors to get in touch
- **Contact**: Contact form and company information
- **Footer**: Site navigation, social links, and copyright information

## Getting Started

### Prerequisites

- Node.js 14.6.0 or newer
- npm or yarn

### Installation

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd agency-website
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn install
   ```

3. Run the development server
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

## Project Structure

```
/
├── public/            # Static files
│   └── images/        # Image assets
├── src/
│   ├── app/          # Next.js app directory
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/    # React components
│   │   ├── layout/   # Layout components
│   │   ├── sections/ # Page sections
│   │   └── ui/       # UI components
│   └── styles/       # Global styles
├── next.config.js    # Next.js configuration
├── tailwind.config.js # Tailwind CSS configuration
└── tsconfig.json     # TypeScript configuration
```

## Customization

### Colors

The color scheme can be customized in the `tailwind.config.js` file. The current theme uses:

- Primary: Blue shades
- Secondary: Purple shades
- Accent: Emerald shades

### Typography

The website uses two main fonts:
- **Inter**: For body text
- **Poppins**: For headings

## Deployment

This website can be easily deployed to platforms like Vercel, Netlify, or any other hosting service that supports Next.js applications.

```bash
# Build for production
npm run build
# or
yarn build
```

## License

This project is licensed under the MIT License.