const express = require("express");
const router = express.Router();
// require l routes
const bookRoutes = require("./books");
const authorRoutes = require('./Authors'); // This links to your Authors.js file
// bngeeb l routes l goa files
router.use("/books", bookRoutes);
router.use('/authors', authorRoutes);


module.exports = router;// export default function 3ala en esmo router  