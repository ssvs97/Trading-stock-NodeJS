import { Router } from "express";
import auth from "../middleware/auth";
import { S3 } from "aws-sdk";
import { v1 as uuid } from "uuid";
import User from "../models/users";

const s3 = new S3({
  accessKeyId: process.env.AWS_S3_ID,
  secretAccessKey: process.env.AWS_S3_KEY,
});

const routerUser = new Router();

/**
 * @api {get} /user/avatar-upload-request Upload profile picture
 * @apiGroup User
 *
 * @apiParam {String} fileType Required.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *          "url": "https://first-images.s3.amazonaws.com/6098399eba4f4e0015a3e719 ba737cd0-b1e5-11eb-9654-57f9c7fb3902.jpg?AWSAccessKeyId=AKIA2IEGOASENNDQPNWW&Content-Type=image%2Fjpg&Expires=1620689479&Signature=FB8A87qM%2Fh%2F0SjywgMyNzuxs76g%3D"
 *     }
 *
 */
routerUser.get(
  "/user/avatar-upload-request",
  auth,
  async (request, response) => {
    try {
      //create unique image name
      const Key = `${request.user.id}/${uuid()}.${request.body.fileType}`;

      //send request to s3 aws to get presigned url
      const url = s3.getSignedUrl("putObject", {
        Bucket: "first-images",
        Key,
        ContentType: `image/${request.body.fileType}`,
      });

      response.send({ url });
    } catch (error) {
      response.status(400).send({ error: error.message });
    }
  }
);

/**
 * @api {post} /user/avatar-upload-ack Acknowledge profile picture
 * @apiGroup User
 *
 * @apiParam {String} url Required.
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {}
 *
 */
routerUser.post("/user/avatar-upload-ack", auth, async (request, response) => {
  try {
    //assign picture to database
    request.user.avatar = request.body.url;

    //save picture into database
    await request.user.save();

    response.send({ url });
  } catch (error) {
    response.status(400).send({ error: error.message });
  }
});

/**
 * @api {delete} /users/avatar-remove Remove profile picture
 * @apiGroup User
 *
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {}
 *
 */
router.delete("/users/avatar-remove", auth, async (request, response) => {
  try {
    //check if image exist
    if (!request.user.avatar) response.status(404).send();

    //remove image
    request.user.avatar = undefined;

    //save into database
    await request.user.save();

    response.send();
  } catch (error) {
    response.status(400).send({ error: error.message });
  }
});

export default routerUser;
