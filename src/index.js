export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/contact" && request.method === "POST") {
      return handleContact(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};

async function handleContact(request, env) {
  try {
    const formData = await request.formData();

    const firstName = cleanText(formData.get("first_name"), 80);
    const email = cleanText(formData.get("email"), 254);
    const phone = cleanText(formData.get("phone"), 30);
    const service = cleanText(formData.get("service"), 50);
    const vehicleMake = cleanText(formData.get("vehicle_make"), 60);
    const vehicleModel = cleanText(formData.get("vehicle_model"), 80);
    const vehicleYear = cleanText(formData.get("vehicle_year"), 4);
    const vehicleRegistration = normaliseRegistration(
      formData.get("vehicle_registration")
    );
    const message = cleanText(formData.get("message"), 3000);

    const honeypot = cleanText(formData.get("website"), 200);
    const turnstileToken = formData.get("cf-turnstile-response");

    // Honeypot should always be empty
    if (honeypot) {
      return redirect("/contact-success.html");
    }

    const allowedServices = new Set([
      "dashcam",
      "audio",
      "reversing-camera",
      "windscreen-chip",
      "accessories-wiring",
      "other",
    ]);

    if (
      !firstName ||
      !email ||
      !service ||
      !vehicleMake ||
      !vehicleModel ||
      !vehicleYear ||
      !vehicleRegistration ||
      !message
    ) {
      return redirect("/contact.html?error=missing");
    }

    if (!isValidEmail(email)) {
      return redirect("/contact.html?error=email");
    }

    if (!allowedServices.has(service)) {
      return redirect("/contact.html?error=service");
    }

    if (!/^\d{4}$/.test(vehicleYear)) {
      return redirect("/contact.html?error=year");
    }

    if (message.length < 10) {
      return redirect("/contact.html?error=message");
    }

    const turnstileValid = await verifyTurnstile(
      turnstileToken,
      request,
      env.TURNSTILE_SECRET
    );

    if (!turnstileValid) {
      return redirect("/contact.html?error=verification");
    }

    const serviceLabel = {
      dashcam: "Dashcam installation",
      audio: "Audio / stereo / Apple CarPlay",
      "reversing-camera": "Reversing camera",
      "windscreen-chip": "Windscreen chip repair",
      "accessories-wiring": "Accessories / minor wiring",
      other: "Other",
    }[service];

    const subject =
      `DW TEC enquiry – ${serviceLabel} – ` +
      `${vehicleMake} ${vehicleModel} – ${vehicleRegistration}`;

    const emailText = `
New DW TEC website enquiry

Name:
${firstName}

Email:
${email}

Phone:
${phone || "Not provided"}

Service:
${serviceLabel}

Vehicle:
${vehicleMake} ${vehicleModel}
${vehicleYear}
${vehicleRegistration}

Message:
${message}
`.trim();

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "DW TEC Website <website@dwtec.co.uk>",
        to: ["info@dwtec.co.uk"],
        reply_to: email,
        subject,
        text: emailText,
      }),
    });

    if (!resendResponse.ok) {
      console.error("Resend failed:", await resendResponse.text());
      return redirect("/contact.html?error=send");
    }

    return redirect("/contact-success.html");
  } catch (error) {
    console.error("Contact form error:", error);
    return redirect("/contact.html?error=server");
  }
}

async function verifyTurnstile(token, request, secret) {
  if (!token || !secret) {
    return false;
  }

  const ip = request.headers.get("CF-Connecting-IP");

  const body = new FormData();
  body.append("secret", secret);
  body.append("response", token);

  if (ip) {
    body.append("remoteip", ip);
  }

  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      body,
    }
  );

  if (!response.ok) {
    return false;
  }

  const result = await response.json();

  return result.success === true;
}

function cleanText(value, maxLength) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, maxLength);
}

function normaliseRegistration(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ")
    .slice(0, 20);
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function redirect(location) {
  return new Response(null, {
    status: 303,
    headers: {
      Location: location,
    },
  });
}