/**
 * One-time migration — drops the stale razorpay_order_id_1 index
 * that is blocking all Cashfree payment inserts.
 *
 * Run once:
 *   node src/fixPaymentIndex.js
 * Then delete this file.
 */

import mongoose from "mongoose";
import dotenv   from "dotenv";
dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
if (!MONGO_URI) { console.error("ERROR: No MONGODB_URI in .env"); process.exit(1); }

(async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("✅ Connected to MongoDB");

        const col = mongoose.connection.db.collection("payments");
        const indexes = await col.indexes();
        console.log("Current indexes:", indexes.map(i => i.name).join(", "));

        const staleIndexes = ["razorpay_order_id_1", "razorpay_payment_id_1"];
        let dropped = 0;
        for (const name of staleIndexes) {
            if (indexes.find(i => i.name === name)) {
                await col.dropIndex(name);
                console.log(`✅ Dropped stale index: ${name}`);
                dropped++;
            } else {
                console.log(`ℹ️  Not found (already clean): ${name}`);
            }
        }

        if (dropped > 0) {
            console.log(`\n✅ Done. Dropped ${dropped} stale index(es). Restart your server now.\n`);
        } else {
            console.log("\nNo stale indexes found. If you're still getting E11000 errors,");
            console.log("run: db.payments.getIndexes() in MongoDB shell to see all indexes.\n");
        }
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err.message);
        process.exit(1);
    }
})();
