export const login = (email: string, password: string): Promise<boolean> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Mock authentication - accept any email/password for demo
      if (email && password) {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userEmail', email);
        resolve(true);
      } else {
        resolve(false);
      }
    }, 1000);
  });
};

export const register = (name: string, email: string, password: string): Promise<boolean> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Mock registration - accept any valid inputs for demo
      if (name && email && password) {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userName', name);
        resolve(true);
      } else {
        resolve(false);
      }
    }, 1000);
  });
};

export const logout = (): void => {
  localStorage.removeItem('isAuthenticated');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userName');
};

export const isAuthenticated = (): boolean => {
  return localStorage.getItem('isAuthenticated') === 'true';
};

export const getCurrentUser = (): { email: string; name?: string } | null => {
  const email = localStorage.getItem('userEmail');
  const name = localStorage.getItem('userName');
  return email ? { email, name: name || undefined } : null;
};