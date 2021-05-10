import { verify } from "jsonwebtoken";
import User from "../models/users.js";

const auth = async (request, response, next) => {
  try {
    //take the token from header request
    const token = request.header("Authorization");

    //extract information from token
    const decode = verify(token, process.env.JWT_PRIVATE_KEY);

    //look for specific user
    const user = await User.findOne({ _id: decode._id, "tokens.token": token });

    //check if exist
    if (!user) throw new Error();

    //if exist assign information
    request.user = user;
    request.token = token;

    //go to next layer
    next();
  } catch (error) {
    response.status(401).send({ error: "you must login" });
  }
};

export default auth;
