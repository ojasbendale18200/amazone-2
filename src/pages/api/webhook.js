import { buffer } from "micro";
import * as admin from "firebase-admin";

// Sercure a connection to Firebase from Backend
const serviceAccount = require("../../../permissions.json");

const app = !admin.apps.length
  ? admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    })
  : admin.app();

//   Establish connection to the stripe
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const endpointSecret = process.env.STRIPE_SIGNING_SECRET;

// fulfilling the order
const fulfillOrder = async (session) => {
  return app
    .firestore()
    .collection("users")
    .doc(session.metadata.email)
    .collection("orders")
    .doc(session.id)
    .set({
      amount: session.amount_total / 100,
      amount_shipping: session.total_details.amount_shipping / 100,
      images: JSON.parse(session.metadata.images),
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    })
    .then(() => {
      console.log(`SUCCESS: Order ${session.id} added to DB`);
    });
};

export default async (req, res) => {
  if (req.method === "POST") {
    const requestBuffer = await buffer(req);
    const payload = requestBuffer.toString();
    const sig = req.headers["stripe-signature"];

    let event;

    // Verify, if the event actually happened or not
    try {
      event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
    } catch (err) {
      console.log("ERROR!!", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    // If checkout session is completed
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      // Fulfill the order
      return fulfillOrder(session)
        .then(() => res.status(200))
        .catch((err) => res.status(400).send(`Webhook Error : ${err.message}`));
    }
  }
};

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};
