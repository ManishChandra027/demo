let scriptPromise;

const loadRazorpay = () => {
  if (window.Razorpay) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => {
      if (window.Razorpay) resolve();
      else reject(new Error("Razorpay checkout could not be loaded."));
    };
    script.onerror = () => reject(new Error("Razorpay checkout could not be loaded."));
    document.head.appendChild(script);
  }).catch((error) => {
    scriptPromise = null;
    throw error;
  });

  return scriptPromise;
};

export const openRazorpayCheckout = async ({ order, payment, onSuccess }) => {
  await loadRazorpay();

  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      callback(value);
    };
    const checkout = new window.Razorpay({
      key: payment.keyId,
      amount: payment.payment.amount,
      currency: payment.payment.currency,
      name: "RareWolf",
      description: `Order ${order._id}`,
      order_id: payment.payment.id,
      prefill: {
        name: order.deliveryAddress?.fullName || "",
        contact: order.deliveryAddress?.phone || "",
      },
      theme: { color: "#7c3aed" },
      handler: async (response) => {
        try {
          await onSuccess(response);
          finish(resolve, true);
        } catch (error) {
          finish(reject, error);
        }
      },
      modal: {
        ondismiss: () => finish(resolve, false),
      },
    });

    checkout.on("payment.failed", (response) => {
      finish(
        reject,
        new Error(response.error?.description || "Razorpay payment failed. You can retry from the order page."),
      );
    });
    checkout.open();
  });
};
