import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { toast } from 'sonner';

const PWAManager = () => {
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            console.log('SW Registered: ' + r);
        },
        onRegisterError(error) {
            console.log('SW registration error', error);
        },
    });

    useEffect(() => {
        if (offlineReady) {
            toast.success('App lista para usar sin conexión');
            setOfflineReady(false);
        }
        if (needRefresh) {
            toast('Hay una nueva versión disponible', {
                action: {
                    label: 'Actualizar',
                    onClick: () => updateServiceWorker(true),
                },
            });
        }
    }, [offlineReady, needRefresh, setOfflineReady, setNeedRefresh, updateServiceWorker]);

    return null;
};

export default PWAManager;
