export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const getDaysUntilExpiration = (expirationDate: string): number => {
  const today = new Date();
  const expDate = new Date(expirationDate);
  const diffTime = expDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const getStatusColor = (days: number): string => {
  if (days < 0) return 'text-red-600 bg-red-50'; // Expired
  if (days <= 30) return 'text-amber-600 bg-amber-50'; // Expiring soon
  return 'text-green-600 bg-green-50'; // Active
};

export const getStatusText = (days: number): string => {
  if (days < 0) return 'Expired';
  if (days <= 30) return 'Expiring Soon';
  return 'Active';
};