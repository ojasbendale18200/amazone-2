import Header from "../components/Header";
import { useSession, getSession } from "next-auth/react";
import moment from "moment";
import db from "../../firebase";
import Order from "../components/Order";
import {
  collection,
  orderBy,
  query,
  doc,
  getDocs,
} from "firebase/firestore/lite";

function orders({ orders }) {
  const { data: session } = useSession();

  console.log(orders);
  return (
    <div>
      <Header />
      <main className="max-w-screen-lg mx-auto p-10">
        <h1 className="text-3xl border-b border-yellow-400 ">Your Orders</h1>
        {session ? (
          <h2>{orders.length} Orders</h2>
        ) : (
          <h2>Please Sign in to see your orders</h2>
        )}

        <div className="mt-5 space-y-4">
          {orders.map(
            ({ id, amount, amountShipping, items, timeStamp, images }) => (
              <Order
                key={id}
                id={id}
                amount={amount}
                amountShipping={amountShipping}
                items={items}
                timeStamp={timeStamp}
                images={images}
              />
            )
          )}
        </div>
      </main>
    </div>
  );
}

export default orders;

// Server side props
export async function getServerSideProps(context) {
  const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

  // Used logged in credentials
  const session = await getSession(context);

  if (!session) {
    return {
      props: {},
    };
  }

  // Firebase DB
  const collectionRef = collection(db, "users", session.user.email, "orders");
  const q = query(collectionRef, orderBy("timestamp", "desc"));
  const stripeOrders = await getDocs(q);

  // Stripe orders
  const orders = await Promise.all(
    stripeOrders.docs.map(async (order) => ({
      id: order.id,
      amount: order.data().amount,
      amountShipping: order.data().amount_shipping,
      images: order.data().images,
      timeStamp: moment(order.data().timestamp.toDate()).unix(),
      items: (
        await stripe.checkout.sessions.listLineItems(order.id, {
          limit: 100,
        })
      ).data,
    }))
  );

  return {
    props: {
      orders,
    },
  };
}
