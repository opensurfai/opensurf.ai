import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import styles from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'OpenSurf - Open web skills for agents',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: styles,
      },
      {
        rel: 'preload',
        as: 'script',
        href: 'https://challenges.cloudflare.com/turnstile/v0/api.js',
        crossOrigin: 'anonymous',
      },
    ],
  }),
  notFoundComponent: NotFound,
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ margin: 0, padding: 0, height: '100%', backgroundColor: '#0F5370' }}>
      <head>
        <HeadContent />
        <script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          async
          defer
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <div>{children}</div>
        <Scripts />
      </body>
    </html>
  )
}

function NotFound() {
  return (
    <div style={{ padding: 16 }}>
      <h1>Not Found</h1>
      <div>The page you requested could not be found.</div>
    </div>
  )
}
