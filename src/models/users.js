//declaration packages
import { Schema, model } from "mongoose";
import { isEmail, contains } from "validator";
import { compare, hash } from "bcrypt";
import { sign } from "jsonwebtoken";

//declaration schema
const userSchema = new Schema({
  name: {
    type: String,
    trim: true,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    async validate(value) {
      if (!isEmail(value)) throw new Error("invalid email");
    },
  },
  password: {
    type: String,
    required: true,
    trim: true,
    validate(value) {
      if (contains(value, "password", { ignoreCase: true }))
        throw new Error("password cant be password");
      if (value.length < 6) throw new Error("password less than 6 chracters");
    },
  },
  valid: {
    type: Boolean,
    default: false,
  },
  code: {
    type: String,
  },
  codeToken: {
    type: String,
  },
  tokens: [
    {
      token: {
        type: String,
        required: true,
      },
    },
  ],
  avatar: {
    type: Buffer,
  },
});

//check auth
userSchema.statics.findByCredentials = async (email, password) => {
  try {
    //check if email invalid
    if (!isEmail(email)) throw new Error("invalid email");

    //check if email exist
    const user = await User.findOne({ email: email });
    if (!user) throw new Error("email does not exist");

    //check if password correct
    const isPassword = await compare(password, user.password);
    if (!isPassword) throw new Error("password wrong");
    //if everything alright return true and user info
    return [true, user];
  } catch (error) {
    return [false, error];
  }
};

//generate token for auth
userSchema.methods.generateAuthToken = async function () {
  try {
    const user = this;
    //generate token
    const token = sign(
      { _id: user.id.toString() },
      process.env.JWT_PRIVATE_KEY
    );

    //push token into database
    user.tokens = user.tokens.concat({ token: token });
    await user.save();

    return token;
  } catch (error) {
    console.log(error);
  }
};

//generate code to valid an email
userSchema.statics.generateCode = async function () {
  //generate random numbers
  const code = Math.floor(100000 + Math.random() * 900000);

  //convert random numbers to token
  const token = sign({ _id: code.toString() }, process.env.JWT_PRIVATE_KEY, {
    expiresIn: "10 minutes",
  });

  return [code, token];
};

//create token and put it into cookie
userSchema.statics.createCookies = async function (response, token) {
  //put the token into browser's coockie
  response.cookie("token", token, {
    signed: true,
    maxAge: 900000,
    httpOnly: true,
  });
  //auth key to remain user login even if closing broswer
  response.cookie("auth", true, { maxAge: 900000 });

  return response;
};

//delete unnecessary information while responding to request
userSchema.methods.toJSON = function () {
  const user = this;
  const userObject = user.toObject();

  delete userObject.password;
  delete userObject.tokens;

  return userObject;
};

//convert password to hash while saving
userSchema.pre("save", async function (next) {
  const user = this;

  if (user.isModified("password")) {
    user.password = await hash(user.password, 8);
  }
  next();
});

const User = model("User", userSchema);

export default User;
