"use client";

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ModalRestaurantProps {
  token: string;
  onClose: () => void;
}

const ModalRestaurant = ({ token, onClose }: ModalRestaurantProps) => {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Restaurant Information</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-center">
            <div className="bg-gray-100 p-4 rounded font-mono text-2xl font-bold mb-4">
              {token}
            </div>

            <div className="space-y-3 text-sm">
              <div className="bg-blue-50 p-3 rounded">
                <h3 className="font-semibold text-blue-800 mb-2">Token Information</h3>
                <p className="text-blue-700">
                  {token.startsWith('b')
                    ? 'This is a breakfast token'
                    : 'This is a regular meal token'
                  }
                </p>
              </div>

              <div className="bg-green-50 p-3 rounded">
                <h3 className="font-semibold text-green-800 mb-2">How to Use</h3>
                <ul className="text-green-700 text-left space-y-1">
                  <li>• Present this token at the restaurant</li>
                  <li>• Token is valid for today only</li>
                  <li>• One-time use only</li>
                </ul>
              </div>

              <div className="bg-yellow-50 p-3 rounded">
                <h3 className="font-semibold text-yellow-800 mb-2">Restaurant Hours</h3>
                <p className="text-yellow-700">
                  {token.startsWith('b')
                    ? 'Breakfast: 06:00 - 09:00'
                    : 'Lunch/Dinner: 11:00 - 14:00, 17:00 - 20:00'
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <Button
              onClick={onClose}
              className="bg-green-600 hover:bg-green-700"
            >
              Got it!
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ModalRestaurant;