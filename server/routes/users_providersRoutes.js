const express = require("express");
const router = express.Router();
const users_providersControllers = require("../controllers/users_providersControllers")

router.get("/:user_id", users_providersControllers.getProviderByUser);
router.post("/", users_providersControllers.createProvider);

module.exports = router;
