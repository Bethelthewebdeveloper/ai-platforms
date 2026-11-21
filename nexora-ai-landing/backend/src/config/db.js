
import mongoose from "mongoose";

let connectionPromise;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!connectionPromise) {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error(
        "MONGODB_URI is missing from the server environment"
      );
    }

    connectionPromise = mongoose.connect(mongoUri).catch((error) => {
      connectionPromise = null;
      console.error("MongoDB connection failed:", error.message);
      throw error;
    });
  }

  const connection = await connectionPromise;
  console.log("MongoDB connected successfully");
  return connection;
};

export default connectDB;
