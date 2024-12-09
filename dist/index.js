"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const app = (0, express_1.default)();
app.use(express_1.default.json());
const authenticationRoute = require("./routes/authentication");
const profileRoute = require("./routes/profile");
const bookingRoute = require("./routes/bookings");
app.use("/authentication", authenticationRoute);
app.use("/profile", profileRoute);
app.use("/slot", bookingRoute);
app.listen(3000, () => {
    console.log("listening on port 3000");
});
module.exports = router;
