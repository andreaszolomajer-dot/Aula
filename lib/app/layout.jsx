import './globals.css';
import CookieConsent from './components/CookieConsent';
import { AuthProvider } from './components/AuthProvider';
import { LangProvider } from './components/LangProvider';

export const metadata = {
  title: 'Aula — Întâlniri video, gratuit',
  description: 'Apeluri video, chat și conferințe. Simplu și gratuit.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ro">
      <body>
        <LangProvider>
          <AuthProvider>
            {children}
            <CookieConsent />
          </AuthProvider>
        </LangProvider>
      </body>
    </html>
  );
}
