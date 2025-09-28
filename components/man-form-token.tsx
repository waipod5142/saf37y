"use client";

import { useEffect, useState } from 'react';
import { Button } from "./ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TokenData } from '@/data/man';
import ModalPasscode from '@/uti/ModalPasscode';
import ModalRestaurant from '@/uti/ModalRestaurant';

interface ManFormTokenProps {
  bu: string;
  type: string;
  id: string;
}

export default function ManFormToken({ bu, type, id }: ManFormTokenProps) {
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showModalRestaurant, setShowModalRestaurant] = useState(false);
  const [visibleTokens, setVisibleTokens] = useState<string[]>([]);
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTokenData = async () => {
      if (id) {
        try {
          setLoading(true);
          const response = await fetch(`/api/token-data?bu=${encodeURIComponent(bu)}&id=${encodeURIComponent(id)}`);

          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              setTokenData(result.data);
            } else {
              console.log('No token data found:', result.error);
            }
          } else {
            console.error('Failed to fetch token data:', response.statusText);
          }
        } catch (error) {
          console.error('Error fetching token data:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchTokenData();
  }, [bu, id]);

  // Get today's date adjusted to GMT+7 (Thailand Time)
  const now = new Date();
  const thailandTime = new Date(now.getTime() + 7 * 60 * 60 * 1000); // Add 7 hours
  const today = thailandTime.toISOString().split('T')[0];

  // Filter transactions where date matches today
  const todayTokens = tokenData?.trans
    ?.filter((token) => token.date.split('T')[0] === today)
    .map((t) => t.token) || [];


  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
        <span className="ml-2">Loading token data...</span>
      </div>
    );
  }

  return (
    <div>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-center text-xl font-bold text-gray-800">
            โทเคนสำหรับร้านอาหาร / Food Token
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Token Display Section */}
      {todayTokens.length > 0 && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <Label className="text-lg font-semibold text-gray-800">
                รหัสซื้อออาหารวันนี้ / Today's Food Tokens
              </Label>

              <div className="border-green-500 border-2 rounded-md p-2 text-center">
                <span className="text-sm text-gray-600">
                  {new Date().toLocaleString('en-GB', { hour12: false })}
                </span>
              </div>

              <div className="bg-gray-100 p-4 rounded space-y-2">
                {todayTokens.map((token, index) => (
                  <div key={index}>
                    <div
                      className={`noselect block p-4 cursor-pointer rounded-md text-center font-bold text-xl transition-all ${
                        visibleTokens.includes(token)
                          ? 'text-gray-800'
                          : 'text-gray-800 blur-md'
                      } ${
                        token.startsWith('b') ? 'bg-rose-300' : 'bg-yellow-300'
                      } hover:opacity-90 animate-bounce`}
                      onClick={() => {
                        if (!visibleTokens.includes(token)) {
                          setSelectedToken(token);
                          setShowModal(true);
                        } else {
                          setSelectedToken(token);
                          setShowModalRestaurant(true);
                        }
                      }}
                    >
                      {token}
                    </div>
                    {!visibleTokens.includes(token) && (
                      <p className="text-xs text-gray-500 text-center mt-1">
                        Click to unlock token
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {todayTokens.length === 0 && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-gray-500 text-lg">
                ไม่มีโทเคนสำหรับวันนี้ / No tokens available for today
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      {showModal && selectedToken && (
        <ModalPasscode
          id={id}
          token={selectedToken}
          onClose={() => setShowModal(false)}
          onPasswordSubmit={(token) =>
            setVisibleTokens((prev) => [...prev, token])
          }
        />
      )}
      {showModalRestaurant && selectedToken && (
        <ModalRestaurant
          token={selectedToken}
          onClose={() => setShowModalRestaurant(false)}
        />
      )}
    </div>
  );
}