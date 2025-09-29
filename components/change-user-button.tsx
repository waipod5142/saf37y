"use client";

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function ChangeUserButton() {
  const router = useRouter();

  const handleRemoveAndRedirect = () => {
    try {
      localStorage.removeItem('inseeId');
      router.push('/');
    } catch (error) {
      console.error('Error removing data from localStorage:', error);
    }
  };

  return (
    <div className="relative py-2 w-full">
      <Button
        variant="destructive"
        className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 shadow-lg"
        onClick={handleRemoveAndRedirect}
      >
        Change to another user
      </Button>
    </div>
  );
}