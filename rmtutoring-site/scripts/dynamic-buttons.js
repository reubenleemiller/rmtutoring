  const email = localStorage.getItem("email");
  const subscriptionButtons = document.getElementById('subscription-buttons');

  async function checkStripeSubscription(email) {
    if (!email) {
      // fallback: show both if no email
      subscriptionButtons.innerHTML = `
        <a href="https://billing.stripe.com/p/login/00wcMY8NFcFE6qI5Zo9k400" class="button" style="background-color: #7fc571;">
          Manage My Subscription
        </a>
        <a href="https://packages.rmtutoringservices.com" class="button" style="background-color: #7fc571; margin-left:2rem;">
          Start My Subscription
        </a>
      `;
      return;
    }
    try {
      const res = await fetch(`/.netlify/functions/has-stripe-subscription?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data.hasSubscription) {
        subscriptionButtons.innerHTML = `
          <a href="https://billing.stripe.com/p/login/00wcMY8NFcFE6qI5Zo9k400" class="button" style="background-color: #7fc571;">
            Manage My Subscription
          </a>
        `;
      } else {
        subscriptionButtons.innerHTML = `
          <a href="https://packages.rmtutoringservices.com" class="button" style="background-color: #7fc571;">
            Start My Subscription
          </a>
        `;
      }
    } catch (e) {
      // fallback: show both if error
      subscriptionButtons.innerHTML = `
        <a href="https://billing.stripe.com/p/login/00wcMY8NFcFE6qI5Zo9k400" class="button" style="background-color: #7fc571;">
          Manage My Subscription
        </a>
        <a href="https://packages.rmtutoringservices.com" class="button" style="background-color: #7fc571; margin-left:2rem;">
          Start My Subscription
        </a>
      `;
    }
  }

  checkStripeSubscription(email);