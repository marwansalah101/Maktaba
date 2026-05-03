const express = require("express");
const router = express.Router();
// require l routes
const bookRoutes = require("./books");
// bngeeb l routes l goa files
router.use("/books", bookRoutes);

module.exports = router;// export default function 3ala en esmo router  