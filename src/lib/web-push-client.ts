export interface PushSubscriptionData {
  endpoint: string;
  p256dh: string;
  auth: string;
}

let cachedPublicKey: string | null = null;

async function getPushServerPublicKey(): Promise<string | null> {
  if (cachedPublicKey) return cachedPublicKey;
  
  if (typeof window === 'undefined') return null;

  try {
    const response = await fetch('/api/push-config');
    const data = await response.json();
    cachedPublicKey = data.publicKey;
    return cachedPublicKey;
  } catch (error) {
    console.error('Error fetching push config:', error);
    return null;
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

function uint8ArrayToUrlBase64(uint8Array: Uint8Array): string {
  // Convert Uint8Array to binary string
  let binary = '';
  for (let i = 0; i < uint8Array.length; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  const base64 = window.btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export async function subscribeToPush(): Promise<PushSubscriptionData | null> {
  if (typeof window === 'undefined') return null;
  
  // Check if Push Manager is available
  if (!('PushManager' in window)) {
    console.warn('Push notifications not supported in this browser');
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission denied');
      return null;
    }

    // Register service worker if not already
    let registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      registration = await navigator.serviceWorker.register('/sw.js');
    }
    
    await navigator.serviceWorker.ready;
    
    const publicKey = await getPushServerPublicKey();
    if (!publicKey) {
      console.error('No public key available');
      return null;
    }
    
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey) as any,
    });

    // getKey() returns ArrayBuffer in Chrome/Edge
    let p256dhKey = (subscription as any).getKey('p256dh');
    let authKey = (subscription as any).getKey('auth');
    
    let p256dh: string;
    let auth: string;
    
    if (p256dhKey && p256dhKey.byteLength > 0) {
      // Chrome/Edge: getKey() returns ArrayBuffer
      p256dh = uint8ArrayToUrlBase64(new Uint8Array(p256dhKey));
      auth = uint8ArrayToUrlBase64(new Uint8Array(authKey));
    } else {
      // Firefox: get keys from JSON representation
      const json = subscription.toJSON();
      p256dh = json?.keys?.p256dh || '';
      auth = json?.keys?.auth || '';
    }

    const subscriptionData: PushSubscriptionData = {
      endpoint: subscription.endpoint,
      p256dh,
      auth,
    };

    return subscriptionData;
  } catch (error) {
    console.error('Error subscribing to push:', error);
    return null;
  }
}

export async function unsubscribeFromPush(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return false;
    
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error unsubscribing from push:', error);
    return false;
  }
}

export async function isPushSubscribed(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return false;
    
    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
  } catch {
    return false;
  }
}

export async function isWebPushAvailable(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  return 'PushManager' in window;
}

export async function isWebPushConfigured(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  
  try {
    const response = await fetch('/api/push-config');
    const data = await response.json();
    return data.configured === true;
  } catch {
    return false;
  }
}
