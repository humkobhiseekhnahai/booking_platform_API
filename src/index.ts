import express from "express";
const router  = express.Router();
const app = express();
app.use(express.json());
const authenticationRoute = require("./routes/authentication");
const profileRoute = require("./routes/profile")
const bookingRoute  =require("./routes/bookings")


app.use("/authentication",authenticationRoute)
app.use("/profile",profileRoute)
app.use("/slot",bookingRoute)


app.listen(3000,()=>{
    console.log("listening on port 3000")
});



module.exports = router;


