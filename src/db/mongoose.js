import { connect } from "mongoose";

(async () => {
  try {
    await connect(process.env.MONGODB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true,
    });
    console.log("MongoDB connected...");
  } catch (error) {
    console.log(error);
  }
})();
