// Run this in the browser console to clear the old API key in Local Storage

localStorage.removeItem('edwise_gemini_key');

// Reload the page
alert('Old API key cleared! The page will reload and prompt you for a new API key when you use AI features.');
location.reload();
