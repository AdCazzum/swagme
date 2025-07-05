'use client';

import { ListItem } from '@worldcoin/mini-apps-ui-kit-react';
import { MiniKit } from '@worldcoin/minikit-js';
import { useMiniKit } from '@worldcoin/minikit-js/minikit-provider';
import { useEffect, useState } from 'react';

export const ViewPermissions = () => {
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const { isInstalled } = useMiniKit();

  useEffect(() => {
    const fetchPermissions = async () => {
      if (isInstalled) {
        try {
          // You can also fetch this by grabbing from user
          // MiniKit.user.permissions
          const permissions = await MiniKit.commandsAsync.getPermissions();
          if (permissions?.finalPayload.status === 'success') {
            setPermissions(permissions?.finalPayload.permissions || {});
            console.log('permissions', permissions);
          }
        } catch (error) {
          console.error('Failed to fetch permissions:', error);
        }
      } else {
        console.log('MiniKit is not installed');
      }
    };
    fetchPermissions();
  }, [isInstalled]);

  return (
    <div className="grid w-full gap-4">
      <p className="text-lg font-semibold">Permissions</p>
      {permissions &&
        Object.entries(permissions).map(([permission, value]) => (
          <ListItem
            key={permission}
            description={`Enabled: ${value}`}
            label={permission}
          />
        ))}
    </div>
  );
};
