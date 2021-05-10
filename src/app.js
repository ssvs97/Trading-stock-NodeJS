//run database
import "./db/mongoose";
//declaration packages
import express, { json } from "express";
import routerAuthentication from "./routers/authentication";
import routerVerification from "./routers/verification";
import cors from "cors";

//declaration server
const app = express();

//server configration
app.use(json());
app.use(cors());

//declaration routers
app.use(routerAuthentication); //..
app.use(routerVerification); //..

//running server
app.listen(process.env.PORT, () => console.log("Server Running..."));
