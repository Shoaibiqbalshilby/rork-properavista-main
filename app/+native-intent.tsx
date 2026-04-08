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

    return normalizedPath;
  } catch {
    return '/';
  }
}