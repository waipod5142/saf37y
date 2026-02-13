"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface ModalPasscodeProps {
  id: string;
  token: string;
  onClose: () => void;
  onPasswordSubmit: (token: string) => void;
}

const ModalPasscode = ({ id, token, onClose, onPasswordSubmit }: ModalPasscodeProps) => {
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password.trim()) {
      toast.error('Please enter a password');
      return;
    }

    setIsSubmitting(true);

    try {
      // Simple password validation - you can enhance this as needed
      // For now, using the employee ID as the password
      if (password === id) {
        onPasswordSubmit(token);
        onClose();
        toast.success('Token unlocked successfully!');
      } else {
        toast.error('Incorrect password');
      }
    } catch (error) {
      console.error('Password validation error:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Enter Password</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Enter your password to view the token:
            </p>
            <div className="bg-gray-100 p-3 rounded font-mono text-lg">
              {token}
            </div>
          </div>

          <div className="space-y-2">
            <Input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full"
              autoFocus
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? 'Checking...' : 'Unlock Token'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ModalPasscode;