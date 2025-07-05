'use client';
import { Button, LiveFeedback } from '@worldcoin/mini-apps-ui-kit-react';
import { MiniKit, Tokens, tokenToDecimals } from '@worldcoin/minikit-js';
import { useState } from 'react';

export const Pay = () => {
  const [buttonState, setButtonState] = useState<'pending' | 'success' | 'failed' | undefined>(undefined);

  const onClickPay = async () => {
    const address = (await MiniKit.getUserByUsername('alex')).walletAddress;
    setButtonState('pending');

    const res = await fetch('/api/initiate-payment', { method: 'POST' });
    const { id } = await res.json();

    const result = await MiniKit.commandsAsync.pay({
      reference: id,
      to: address ?? '0x0000000000000000000000000000000000000000',
      tokens: [
        { symbol: Tokens.WLD, token_amount: tokenToDecimals(0.5, Tokens.WLD).toString() },
        { symbol: Tokens.USDC, token_amount: tokenToDecimals(0.1, Tokens.USDC).toString() },
      ],
      description: 'Test example payment for minikit',
    });

    console.log(result.finalPayload);
    if (result.finalPayload.status === 'success') {
      setButtonState('success');
    } else {
      setButtonState('failed');
      setTimeout(() => setButtonState(undefined), 3000);
    }
  };

  return (
    <div className="grid w-full gap-4">
      <p className="text-lg font-semibold">Pay</p>
      <LiveFeedback
        label={{ failed: 'Payment failed', pending: 'Payment pending', success: 'Payment successful' }}
        state={buttonState}
        className="w-full"
      >
        <Button onClick={onClickPay} disabled={buttonState === 'pending'} size="lg" variant="primary" className="w-full">
          Pay
        </Button>
      </LiveFeedback>
    </div>
  );
};
