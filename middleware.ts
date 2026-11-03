import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Revisa que las variables de Supabase estén bien cargadas en Vercel.
function configProblem(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const missing = [!url && 'NEXT_PUBLIC_SUPABASE_URL', !key && 'NEXT_PUBLIC_SUPABASE_ANON_KEY'].filter(Boolean);
  if (missing.length) return `Faltan estas variables en Vercel: ${missing.join(', ')}.`;
  if (!/^https?:\/\/[^\s/]+\/?$/.test(url!.trim())) {
    return `NEXT_PUBLIC_SUPABASE_URL tiene que ser como https://abcd.supabase.co (sin espacios ni nada al final). Hoy dice: "${url}".`;
  }
  return null;
}

function setupPage(message: string) {
  const html = `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Falta configurar la agenda</title>
<body style="font-family:system-ui,sans-serif;background:#fff8f8;color:#3a2022;padding:32px;max-width:560px;margin:auto;line-height:1.5">
<h1 style="font-weight:400">Falta configurar la agenda</h1>
<p>${message.replace(/</g, '&lt;')}</p>
<p>En Vercel: <b>Settings → Environment Variables</b>, corregí las variables y después <b>Deployments → ⋯ → Redeploy</b>.</p>
</body></html>`;
  return new NextResponse(html, { status: 500, headers: { 'content-type': 'text/html; charset=utf-8' } });
}

// Protege toda la app: si no hay sesión, manda al login.
export async function middleware(request: NextRequest) {
  const problem = configProblem();
  if (problem) return setupPage(problem);

  let response = NextResponse.next({ request });
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!.trim().replace(/\/$/, ''),
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim(),
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(list) {
            list.forEach(({ name, value }) => request.cookies.set(name, value));
            response = NextResponse.next({ request });
            list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          },
        },
      },
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const path = request.nextUrl.pathname;
    const isPublic = path.startsWith('/login') || path.startsWith('/api/');
    if (!user && !isPublic) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.search = '';
      return NextResponse.redirect(url);
    }
    if (user && path.startsWith('/login')) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
    return response;
  } catch (err) {
    return setupPage(`No se pudo conectar con Supabase: ${err instanceof Error ? err.message : String(err)}. Revisá que la URL y la clave anon sean las de tu proyecto.`);
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg|manifest.webmanifest).*)'],
};
