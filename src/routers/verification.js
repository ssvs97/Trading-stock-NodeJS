import { Router } from "express";
import User from "../models/users";
import auth from "../middleware/auth";
import email from "../emails/sendCode";
import { verify } from "jsonwebtoken";

const routerVerification = new Router();

/**
 * @api {post} /verfication/account Verify account
 * @apiGroup Verification
 *
 *
 * @apiParam {String} codeToken Required.
 * @apiParam {String} email Required.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {}
 *
 */
routerVerification.post("/verfication/account", async (request, response) => {
  try {
    //check if the token valid and extract information from it
    const decode = verify(request.body.codeToken, process.env.JWT_PRIVATE_KEY);

    //find the specific user
    const user = await User.findOne({ email: request.body.email });

    //check if token information valid
    if (user.code != decode._id || request.body.codeToken != user.codeToken)
      throw new Error("invalid code");

    //verify account
    user.valid = true;
    await user.save();

    response.send();
  } catch (error) {
    if (error.message.includes("expired"))
      return response.status(401).send({ error: "expired token" });

    if (error.message.includes("malformed"))
      return response.status(400).send({ error: "malformed token" });

    response.status(400).send({ error: error.message });
  }
});

/**
 * @api {get} /verfication/account-resend-message Resend message to verify account
 * @apiGroup Verification
 *
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {}
 *
 */
routerVerification.get(
  "/verfication/account-resend-message",
  auth,
  async (request, response) => {
    try {
      //regenerate code digits and its token format
      const [code, codeToken] = await User.generateCode();

      //assign data
      request.user.code = code;
      request.user.codeToken = codeToken;

      //save it into database
      await request.user.save();

      //resend message
      email.verifyAccountMsg(request.user.email, request.user.name, codeToken);

      response.send();
    } catch (error) {
      response.send({ error: error.message });
    }
  }
);

/**
 * @api {post} /verfication/forget-password-send-message Send message to reset password
 * @apiGroup Verification
 *
 *
 * @apiParam {String} email Required.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {}
 *
 */
routerVerification.post(
  "/verfication/forget-password-send-message",
  async (request, response) => {
    try {
      //extract user information by email
      const user = await User.findOne({ email: request.body.email });

      //check email exist
      if (!user) {
        return response.status(404).send();
      }

      //generate code digits and its token format
      const [code, codeToken] = await User.generateCode();

      //assign data
      user.code = code;
      user.codeToken = codeToken;

      //save it into database
      await user.save();

      //send message
      email.forgetPasswordMsg(user.email, user.name, codeToken);

      response.send();
    } catch (error) {
      response.status(404).send({ error: error.message });
    }
  }
);

/**
 * @api {post} /verfication/forget-password Reset password
 * @apiGroup Verification
 *
 * @apiParam {String} email Required.
 * @apiParam {String} password Required.
 * @apiParam {String} codeToken Required.
 *
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {}
 *
 */
routerVerification.post(
  "/verfication/forget-password",
  async (request, response) => {
    try {
      //extract information from code token
      const decode = verify(
        request.body.codeToken,
        process.env.JWT_PRIVATE_KEY
      );

      //find specific user by email
      const user = await User.findOne({ email: request.body.email });

      //check if code token valid
      if (user.code != decode._id || request.body.codeToken != user.codeToken)
        throw new Error("invalid code");

      //assign data
      user.password = request.body.password;

      //save into database
      await user.save();

      response.send();
    } catch (error) {
      if (error.message.includes("jwt"))
        return response.status(401).send({ error: "expired token" });

      response.status(400).send({ error: error.message });
    }
  }
);

export default routerVerification;
