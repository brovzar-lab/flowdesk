import * as admin from 'firebase-admin';
import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import Stripe from 'stripe';

admin.initializeApp();

const stripeSecretKey = defineSecret('STRIPE_SECRET_KEY');
const stripeWebhookSecret = defineSecret('STRIPE_WEBHOOK_SECRET');
const webappUrl = defineSecret('WEBAPP_URL');

// ── createCheckoutSession ──────────────────────────────────────────────────

interface CheckoutResult {
  url: string;
}

export const createCheckoutSession = onCall<unknown, Promise<CheckoutResult>>(
  { secrets: [stripeSecretKey, webappUrl] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required.');
    }

    const uid = request.auth.uid;
    const stripe = new Stripe(stripeSecretKey.value());
    const appUrl = webappUrl.value() || 'https://flowdesk.app';

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        {
          price: process.env.STRIPE_PRO_PRICE_ID || 'price_test_pro_monthly',
          quantity: 1,
        },
      ],
      customer_creation: 'always',
      metadata: { uid },
      success_url: `${appUrl}?upgraded=true`,
      cancel_url: appUrl,
    });

    if (!session.url) {
      throw new HttpsError('internal', 'Failed to create Stripe Checkout session.');
    }

    return { url: session.url };
  },
);

// ── stripeWebhook ──────────────────────────────────────────────────────────

export const stripeWebhook = onRequest(
  { secrets: [stripeSecretKey, stripeWebhookSecret] },
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    if (!sig) {
      res.status(400).send('Missing stripe-signature header');
      return;
    }

    const stripe = new Stripe(stripeSecretKey.value());

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        sig,
        stripeWebhookSecret.value(),
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(400).send(`Webhook signature verification failed: ${message}`);
      return;
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const uid = session.metadata?.uid;

      if (uid) {
        // Merge only the tier field — does not clobber other user doc data
        await admin
          .firestore()
          .doc(`users/${uid}`)
          .set({ settings: { tier: 'pro' } }, { mergeFields: ['settings.tier'] });
      }
    }

    res.status(200).json({ received: true });
  },
);
