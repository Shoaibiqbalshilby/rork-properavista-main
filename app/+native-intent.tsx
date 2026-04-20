export function redirectSystemPath({
  path,
  initial,
}: { path: string; initial: boolean }) {
  try {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const [pathname, search = ''] = normalizedPath.split('?');

    if (pathname === '/login' || pathname === 'login') {
      return search ? `/login?${search}` : '/login';
    }

    if (pathname === '/reset-password' || pathname === 'reset-password') {
      return search ? `/reset-password?${search}` : '/reset-password';
    }

    if (!pathname || pathname === '/' || pathname === '/index') {
      return '/(tabs)';
    }

    if (initial) {
      return '/(tabs)';
    }

    return normalizedPath;
  } catch {
    return '/(tabs)';
  }
}