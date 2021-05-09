import { Router } from "express";
import User from "../models/users";
import auth from "../middleware/auth";
import email from "../emails/sendCode";

const routerAuthentication = new Router();

/**
 * @api {post} /authentication/signup Sign up
 * @apiGroup Authentication
 *
 *
 * @apiParam {String} name Required.
 * @apiParam {String} email Required.
 * @apiParam {String} password Required.
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {}
 *
 */
routerAuthentication.post(
  "/authentication/signup",
  async (request, response, next) => {
    try {
      //generate the code (4 digits) and its token formate
      const [code, codeToken] = await User.generateCode();

      //insert data into database
      const user = await new User({
        ...request.body,
        code: code,
        codeToken: codeToken,
      }).save();

      //send verify account message to user's email
      email.verifyAccountMsg(request.body.email, request.body.name, codeToken);

      //generate auth token
      const token = await user.generateAuthToken();

      //generate token and put it into cookie
      response = await User.createCookies(response, token);

      response.send();
    } catch (error) {
      response.status(400).send(error.message);
    }
  }
);

/**
 * @api {post} /authentication/login Login
 * @apiGroup Authentication
 *
 * @apiParam {String} email Required.
 * @apiParam {String} password Required.
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {}
 *
 */
routerAuthentication.post(
  "/authentication/login",
  async (request, response) => {
    try {
      //check email and password
      const [flag, user] = await User.findByCredentials(
        request.body.email,
        request.body.password
      );

      // if correct
      if (flag) {
        //generate auth token
        const token = await user.generateAuthToken();

        //generate token and put it into cookie
        response = await User.createCookies(response, token);
        return response.send();
      }
      response.status(404).send({ error: user.message });
    } catch (error) {
      response.status(400).send(error.message);
    }
  }
);

/**
 * @api {get} /authentication/logout Logout from current device
 * @apiGroup Authentication
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {}
 *
 */
routerAuthentication.get(
  "/authentication/logout",
  auth,
  async (request, response) => {
    try {
      await User.findByIdAndUpdate(
        request.user.id,
        {
          $pull: {
            tokens: {
              token: request.token,
            },
          },
        },
        { new: true }
      );
      response.send();
    } catch (error) {
      response.status(400).send(error.message);
    }
  }
);

/**
 * @api {get} /authentication/logout-all Logout from all devices
 * @apiGroup Authentication
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {}
 *
 */
routerAuthentication.get(
  "/authentication/logout-all",
  auth,
  async (request, response) => {
    try {
      request.user.tokens = [];
      await request.user.save();
      response.send();
    } catch (error) {
      response.status(400).send(error.message);
    }
  }
);

export default routerAuthentication;
