// Drops leading and trailing slash to avoid /\/?/ everywhere
export const getCleanPathname = () =>
  location.pathname.replace(/^[/]|[/]$/g, '');
