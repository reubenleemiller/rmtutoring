const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY); // Set this in Netlify dashboard

exports.handler = async function(event, context) {
  const { email } = event.queryStringParameters || {};
  if (!email) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'No email provided' }),
    };
  }

  try {
    // Find customer by email
    const customers = await stripe.customers.list({ email, limit: 1 });
    if (!customers.data.length) {
      return { statusCode: 200, body: JSON.stringify({ hasSubscription: false }) };
    }

    const customerId = customers.data[0].id;
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 1,
    });

    const hasActive = subscriptions.data.some(sub =>
      ['active', 'trialing', 'past_due'].includes(sub.status)
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ hasSubscription: hasActive }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};