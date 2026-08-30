const META_TOKEN = "EAAaU8v9EVzUBSZAz2jfO4VgRq9FgJLLkcnZAtZAlbCvvf9v8M86op4roCBQNvZB643OeXZAhZBx86LKhbLCpg5g6pEp0Tydj2PqFWznk3hUzZCi5fI7Do1vpYmL2YVfAPbd8WECcZAvArro6zRRZAgkObtXhvopJDjZBQBZAT7TL01WAHDYs4T1ies7FTNB2CSIFZAGJC28fLj7L6XwB7O4exHD2DC2GJE9OPUTitdEoYXYPZANse148EhZC4nV6bpvvwYpUarlKbuMQDCbtSUpFgiUlxwl3ge";
const PHONE_NUMBER_ID = "1080055891860393"; // CORRECT ID!
const DESTINATION = "919131822366";

async function test() {
  console.log("Testing WhatsApp API with CORRECT ID...");
  try {
    const response = await fetch(`https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${META_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: DESTINATION,
        type: 'text',
        text: { body: "Hello! This is a test message from your backend confirming we finally fixed the issue! Please send 'Hello' again to test the main bot." }
      })
    });
    
    const data = await response.json();
    console.log("HTTP Status:", response.status);
    console.log("Response Body:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}

test();
