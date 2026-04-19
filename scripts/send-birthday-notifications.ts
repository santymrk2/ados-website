const API_URL = process.env.API_URL || 'http://localhost:3000';

async function sendBirthdayNotifications() {
  console.log('Checking for birthdays...');

  try {
    const response = await fetch(`${API_URL}/api/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'send_birthday_notifications' }),
    });

    const result = await response.json();
    console.log(JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('Error sending notifications:', error);
    throw error;
  }
}

const isDirectRun = process.argv[1]?.includes('send-birthday-notifications');

if (isDirectRun) {
  sendBirthdayNotifications()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { sendBirthdayNotifications };