import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectToDataBase = async () => {
  try {
    await mongoose.connect(
      `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@wacai.wiz2xfn.mongodb.net/?retryWrites=true&w=majority&appName=WacAI`
    );
    console.log("MongoDB Connected");
  } catch (error) {
    console.error("Error to connect to MongoDB: ", error);
  }
};

export default connectToDataBase;
